import type { Admin } from "@prisma/client";
import ms from "ms"; 
import type { StringValue } from "ms";
import jwt from "jsonwebtoken";
import { redisClient } from "../configs/redis.config.js";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as StringValue;

export const UGenerateToken = async (admin: Admin) => {
  const token = jwt.sign(admin, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  const key = `token:${token.split(".")[2]}:${admin.id}`;
  await redisClient.set(key, token, {
    expiration: {
      type: "EX",
      value: ms(JWT_EXPIRES_IN) / 1000,
    },
  });

  return token;
};

export const UVerifyToken = async (token: string) => {
  const payload = jwt.verify(token, JWT_SECRET) as Admin | null;
  if (!payload) {
    throw Error("Unauthorized");
  }

  const key = `token:${token.split(".")[2]}:${payload.id}`;

  const data = await redisClient.get(key);

  if (!data || data !== token) {
    throw Error("Unauthorized");
  }

  return payload;
};

export const UInvalidateToken = async (
  adminId: number,
  token: string
): Promise<void> => {
  try {
    const key = `token:${token.split(".")[2]}:${adminId}`;
    await redisClient.del(key);
    return;
  } catch {
    return;
  }
};