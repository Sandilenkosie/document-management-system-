import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import { authRoutes } from "./routes/auth.js";
import { documentRoutes } from "./routes/documents.js";
import { approvalRoutes } from "./routes/approvals.js";
import { reportRoutes } from "./routes/reports.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// Vercel runs behind a reverse proxy and forwards client IP via X-Forwarded-For.
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
    : []),
].filter(Boolean);

const isAllowedVercelOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
};

app.use((helmet as unknown as () => express.RequestHandler)());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isAllowedVercelOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    service: "pcg-mindrift-backend",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.use(errorHandler);

app.use("*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
