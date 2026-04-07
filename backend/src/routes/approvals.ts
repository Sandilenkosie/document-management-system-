import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";

const router = Router();
const MAX_APPROVAL_STAGE = 3;

const approvalActionSchema = z.object({
  comment: z.string().optional(),
});

router.get("/pending", authenticate, async (req, res, next) => {
  try {
    const userStage = getCurrentApprovalStage(req.user!.role);
    if (userStage === 0) {
      return res.json({ approvals: [] });
    }

    // Get pending approvals for user's role
    const pendingApprovals = await prisma.document.findMany({
      where: {
        approvalStatus: "PENDING",
        currentApprovalStage: userStage,
        approvals: {
          none: {
            stage: userStage,
          },
        },
      },
      include: {
        uploader: {
          select: { firstName: true, lastName: true, email: true },
        },
        approvals: true,
      },
    });

    return res.json({ approvals: pendingApprovals });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:documentId/approve/:stage",
  authenticate,
  async (req, res, next) => {
    try {
      const { documentId, stage } = req.params;
      const documentIdParam = Array.isArray(documentId)
        ? documentId[0]
        : documentId;
      if (!documentIdParam) {
        return next(createError("Document ID is required", 400));
      }

      const stageParam = Array.isArray(stage) ? stage[0] : stage;
      if (!stageParam) {
        return next(createError("Approval stage is required", 400));
      }

      const stageNum = Number.parseInt(stageParam, 10);
      if (Number.isNaN(stageNum)) {
        return next(createError("Invalid approval stage", 400));
      }
      if (stageNum < 1 || stageNum > MAX_APPROVAL_STAGE) {
        return next(createError("Approval stage must be between 1 and 3", 400));
      }
      const { comment } = approvalActionSchema.parse(req.body);

      // Validate user can approve at this stage
      if (!canApproveAtStage(req.user!.role, stageNum)) {
        return next(
          createError("Not authorized to approve at this stage", 403),
        );
      }

      // Check if document exists and is in correct state
      const document = await prisma.document.findUnique({
        where: { id: documentIdParam },
        include: { approvals: true },
      });

      if (!document) {
        return next(createError("Document not found", 404));
      }

      if (
        document.approvalStatus !== "PENDING" ||
        document.currentApprovalStage !== stageNum
      ) {
        return next(
          createError("Document is not in the correct approval stage", 400),
        );
      }

      const alreadyActioned = document.approvals.some(
        (a) => a.stage === stageNum,
      );
      if (alreadyActioned) {
        return next(createError("This stage has already been actioned", 409));
      }

      // Create approval record
      await prisma.approval.create({
        data: {
          documentId: documentIdParam,
          stage: stageNum,
          approverRole: req.user!.role as any,
          approverId: req.user!.id,
          approverEmail: req.user!.email,
          status: "APPROVED",
          comment: comment ?? null,
          approvedAt: new Date(),
        },
      });

      // Update document status
      const nextStage = stageNum + 1;
      const newStatus = nextStage > MAX_APPROVAL_STAGE ? "APPROVED" : "PENDING";

      await prisma.document.update({
        where: { id: documentIdParam },
        data: {
          currentApprovalStage: Math.min(nextStage, MAX_APPROVAL_STAGE),
          approvalStatus: newStatus,
        },
      });

      res.json({ message: "Document approved successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:documentId/reject/:stage",
  authenticate,
  async (req, res, next) => {
    try {
      const { documentId, stage } = req.params;
      const documentIdParam = Array.isArray(documentId)
        ? documentId[0]
        : documentId;
      if (!documentIdParam) {
        return next(createError("Document ID is required", 400));
      }

      const stageParam = Array.isArray(stage) ? stage[0] : stage;
      if (!stageParam) {
        return next(createError("Approval stage is required", 400));
      }

      const stageNum = Number.parseInt(stageParam, 10);
      if (Number.isNaN(stageNum)) {
        return next(createError("Invalid approval stage", 400));
      }
      if (stageNum < 1 || stageNum > MAX_APPROVAL_STAGE) {
        return next(createError("Approval stage must be between 1 and 3", 400));
      }
      if (stageNum === MAX_APPROVAL_STAGE) {
        return next(createError("Stage 3 is final approval only", 400));
      }
      const { comment } = approvalActionSchema.parse(req.body);

      if (!comment) {
        return next(createError("Comment is required for rejection", 400));
      }

      // Validate user can approve at this stage
      if (!canApproveAtStage(req.user!.role, stageNum)) {
        return next(createError("Not authorized to reject at this stage", 403));
      }

      // Check if document exists and is in correct state
      const document = await prisma.document.findUnique({
        where: { id: documentIdParam },
        include: { approvals: true },
      });

      if (!document) {
        return next(createError("Document not found", 404));
      }

      if (
        document.approvalStatus !== "PENDING" ||
        document.currentApprovalStage !== stageNum
      ) {
        return next(
          createError("Document is not in the correct approval stage", 400),
        );
      }

      const alreadyActioned = document.approvals.some(
        (a) => a.stage === stageNum,
      );
      if (alreadyActioned) {
        return next(createError("This stage has already been actioned", 409));
      }

      // Create rejection record
      await prisma.approval.create({
        data: {
          documentId: documentIdParam,
          stage: stageNum,
          approverRole: req.user!.role as any,
          approverId: req.user!.id,
          approverEmail: req.user!.email,
          status: "REJECTED",
          comment,
          approvedAt: new Date(),
        },
      });

      // Update document status
      await prisma.document.update({
        where: { id: documentIdParam },
        data: {
          approvalStatus: "REJECTED",
        },
      });

      res.json({ message: "Document rejected successfully" });
    } catch (error) {
      next(error);
    }
  },
);

function getMaxApprovalStage(role: string): number {
  switch (role) {
    case "REVIEWER":
      return 1;
    case "MANAGER":
      return 2;
    case "ADMIN":
      return 3;
    default:
      return 0;
  }
}

function getCurrentApprovalStage(role: string): number {
  switch (role) {
    case "REVIEWER":
      return 1;
    case "MANAGER":
      return 2;
    case "ADMIN":
      return 3;
    default:
      return 0;
  }
}

function canApproveAtStage(role: string, stage: number): boolean {
  const userStage = getCurrentApprovalStage(role);
  return userStage === stage;
}

export { router as approvalRoutes };
