import type { NextFunction, Request, Response } from "express";
import { UVerifyToken } from "../utils/jwt.util.js";

export const MAuthValidate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw Error("Unauthorized");
        }
        const token = authHeader.split(" ")[1];

        if (!token) {
            throw Error("Unauthorized");
        }

        const decoded = await UVerifyToken(token);
        if(req.admin) {
            req.admin = decoded as typeof req.admin;
        } 

        next();
    }
     catch (error) {
        next(Error("Unauthorized"));;
    }
};