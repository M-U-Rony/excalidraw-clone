import { JWT_SECRET } from "@repo/backend-common/config";
import { Request,Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface AuthRequest extends Request {
  userId?: string;
}

export function middleware(req: AuthRequest, res: Response, next: NextFunction) {

  const token = req.cookies?.token || req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return res.status(403).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== "string" && "userId" in decoded) {
      req.userId = String(decoded.userId);
      next();
      return;
    }
    res.status(403).json({ message: "unauthorized" });
  } catch {
    res.status(403).json({ message: "unauthorized" });
  }
}