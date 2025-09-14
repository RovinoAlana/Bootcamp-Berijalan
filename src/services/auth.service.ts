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
        throw new Error("Invalid credentialss");
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

export const SUpdate = async (
    id: number,
    updateFields: {
        email?: string;
        name?: string;
        password?: string;
        username?: string;
    }
): Promise<IGlobalResponse> => {
    const admin = await prisma.admin.findUnique({
        where: { id },
    });
    
    if (!admin || admin.deletedAt) {
        throw new Error("Admin not found");
    }
    
    const updateData: any = {};

    if (updateFields.email) {
        updateData.email = updateFields.email;
    }
    if (updateFields.name) {
        updateData.name = updateFields.name;
    }
    if (updateFields.username) {
        updateData.username = updateFields.username;
    }
    if (updateFields.password) {
        updateData.password = await bcrypt.hash(updateFields.password, 10);
    }
    
    await prisma.admin.update({
        where: { id },
        data: updateData,
    });

    return {
        status: true,
        message: "Admin updated successfully",
    };
}

export const SDelete = async (id: number): Promise<IGlobalResponse> => {
    const admin = await prisma.admin.findUnique({
        where: { id },
    });
    if (!admin || admin.deletedAt) {
        throw new Error("Admin not found");
    }
    await prisma.admin.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    return {
        status: true,
        message: "Admin deleted successfully",
    };
}

export const SGetAllAdmins = async (): Promise<IGlobalResponse> => {
    const admins = await prisma.admin.findMany({
        where: { deletedAt: null },
        select: {
            id: true,
            username: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return {
        status: true,
        message: "Admins retrieved successfully",
        data: admins,
    };
};

const UGenereateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};