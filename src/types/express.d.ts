import { Admin } from "@prisma/client";
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: Admin;
    }
  }
}