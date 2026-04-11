import { JWT_SECRET } from "@repo/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  userId?: string;
}

export function middleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded !== "string" && "userId" in decoded) {
    req.userId = String(decoded.userId);
    next();
    return;
  }

  res.status(403).json({
    message: "unauthorized",
  });
}
