import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

// Central error handler: every failure becomes { message, errors? } with a sensible status.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return res.status(400).json({ message: errors[0]?.message ?? "Validation failed", errors });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, errors: err.details });
  }
  if (err?.name === "CastError") return res.status(400).json({ message: "Invalid id" });
  if (err?.code === 11000) return res.status(409).json({ message: "Email already registered" });

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
}
