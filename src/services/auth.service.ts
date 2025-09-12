import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import type{ IGlobalResponse } from "../interfaces/global.interface.js";
import type{ ILoginResponse } from "../interfaces/global.interface.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const prisma = new PrismaClient();

export const SLogin = async (
    usernameOrEmail: string, 
    password: string
): Promise<IGlobalResponse<ILoginResponse>> => {
    const admin = await prisma.admin.findFirst({
        where: {
            OR: [{ username: usernameOrEmail }, { email: usernameOrEmail}],
            isActive: true,
            deletedAt: null,
        },
        });

    if (!admin) {
        throw new Error("Invalid credentials");
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }
    
    const token = UGenereateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
    });

    return {
        status: true,
        message: "Login successful",
        data: {
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                name: admin.name,
            },
            token,
        },
    };
}

export const SCreate = async (
    username: string,
    email: string,
    name: string,
    password: string
): Promise<IGlobalResponse> => {
    const existingAdmin = await prisma.admin.findFirst({
        where: {
            OR: [{ username }, { email }],
            deletedAt: null,
        },
    });

    if (existingAdmin) {
        throw new Error("Username or email already in use");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.create({
        data: {
            username,
            email,
            name,
            password: hashedPassword,
        },
    });

    return {
        status: true,
        message: "Admin created successfully",
    };
};
const UGenereateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};