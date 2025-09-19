import { PrismaClient } from "@prisma/client";
import type { IGlobalResponse } from "../interfaces/global.interface.js";

const prisma = new PrismaClient();

interface CreateCounterData {
  name: string;
  maxQueue?: number;
  isActive?: boolean;
}

interface UpdateCounterData {
  name?: string;
  currentQueue?: number;
  maxQueue?: number;
  isActive?: boolean;
}

export const SGetAllCounters = async (includeDeleted: boolean = false): Promise<IGlobalResponse> => {
  const whereClause = includeDeleted ? {} : { deletedAt: null };
  
  const counters = await prisma.counter.findMany({
    where: whereClause,
    include: {
      queues: {
        where: { 
          createdAt: { 
            gte: new Date(new Date().setHours(0, 0, 0, 0)) 
          } 
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    status: true,
    message: "Counters retrieved successfully",
    data: counters,
  };
};

export const SGetCounterById = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: {
      queues: {
        where: { 
          createdAt: { 
            gte: new Date(new Date().setHours(0, 0, 0, 0)) 
          } 
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  return {
    status: true,
    message: "Counter retrieved successfully",
    data: counter,
  };
};

export const SCreateCounter = async (
  name: string,
  maxQueue?: number,
  isActive?: boolean
): Promise<IGlobalResponse> => {
  const existingCounter = await prisma.counter.findFirst({
    where: {
      name,
      deletedAt: null,
    },
  });

  if (existingCounter) {
    throw new Error("Counter name already in use");
  }

  const counter = await prisma.counter.create({
    data: {
      name,
      maxQueue: maxQueue || 99,
      isActive: isActive !== undefined ? isActive : true,
      currentQueue: 0,
    },
  });

  return {
    status: true,
    message: "Counter created successfully",
    data: counter,
  };
};

export const SUpdateCounter = async (
  id: number,
  updateFields: UpdateCounterData
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: { 
      id,
      deletedAt: null 
    },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  // Check if name is being updated and if it already exists
  if (updateFields.name && updateFields.name !== counter.name) {
    const existingCounter = await prisma.counter.findFirst({
      where: {
        name: updateFields.name,
        deletedAt: null,
        NOT: { id }
      },
    });

    if (existingCounter) {
      throw new Error("Counter name already in use");
    }
  }

  const updateData: any = {};

  if (updateFields.name !== undefined) {
    updateData.name = updateFields.name;
  }
  if (updateFields.currentQueue !== undefined) {
    updateData.currentQueue = updateFields.currentQueue;
  }
  if (updateFields.maxQueue !== undefined) {
    updateData.maxQueue = updateFields.maxQueue;
  }
  if (updateFields.isActive !== undefined) {
    updateData.isActive = updateFields.isActive;
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Counter updated successfully",
    data: updatedCounter,
  };
};

export const SUpdateCounterStatus = async (
  id: number,
  status: 'active' | 'inactive' | 'disable'
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: { id },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  const updateData: any = {};

  switch (status) {
    case 'active':
      updateData.isActive = true;
      updateData.deletedAt = null;
      break;
    case 'inactive':
      updateData.isActive = false;
      updateData.deletedAt = null;
      break;
    case 'disable':
      updateData.deletedAt = new Date();
      break;
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: `Counter status updated to ${status} successfully`,
    data: updatedCounter,
  };
};

export const SDeleteCounter = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: { 
      id,
      deletedAt: null 
    },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  const deletedCounter = await prisma.counter.update({
    where: { id },
    data: { 
      deletedAt: new Date(),
      updatedAt: new Date()
    },
  });

  return {
    status: true,
    message: "Counter deleted successfully",
    data: deletedCounter,
  };
};