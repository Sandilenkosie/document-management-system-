import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const isZodError = err instanceof ZodError;
  const statusCode = isZodError ? 400 : err.statusCode || 500;
  const message = isZodError
    ? err.issues.map((issue) => issue.message).join(", ")
    : err.message || "Internal Server Error";

  console.error(
    `[${new Date().toISOString()}] Error ${statusCode}: ${message}`,
  );
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(isZodError && {
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode: number): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
