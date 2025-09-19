import type { Request, Response, NextFunction } from "express";
import { UVerifyToken } from "../utils/jwt.util.js";
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export const MAuthValidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      throw Error("Unauthorized");
    }

    const token = auth.split(" ")[1];

    if(!token) {
        throw Error("Unauthorized");
    }

    const payload = await UVerifyToken(token);

    const user = await prismaClient.admin.findUnique({
      where: { id: payload.id, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw Error("Unauthorized");
    }

    req.user = payload;

    next();
  } catch (e) {
    next(e);
  }
};