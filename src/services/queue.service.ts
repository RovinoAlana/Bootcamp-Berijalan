import { PrismaClient } from "@prisma/client";
import type { IGlobalResponse } from "../interfaces/global.interface.js";

const prisma = new PrismaClient();

export const SGetAllQueues = async (): Promise<IGlobalResponse> => {
  const queues = await prisma.queue.findMany({
    where: { deletedAt: null },
    include: {
      counter: {
        select: {
          id: true,
          name: true,
          currentQueue: true,
          maxQueue: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    status: true,
    message: "Queues retrieved successfully",
    data: queues,
  };
};

export const SGetQueueById = async (id: number): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: {
      counter: {
        select: {
          id: true,
          name: true,
          currentQueue: true,
          maxQueue: true,
          isActive: true
        }
      }
    }
  });

  if (!queue) {
    throw new Error("Queue not found");
  }

  return {
    status: true,
    message: "Queue retrieved successfully",
    data: queue,
  };
};

export const SCreateQueue = async (counterId: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id: counterId,
      isActive: true,
      deletedAt: null
    }
  });

  if (!counter) {
    throw new Error("Counter not found or inactive");
  }

  if (counter.currentQueue >= counter.maxQueue) {
    throw new Error("Counter has reached maximum queue capacity");
  }

  const nextQueueNumber = counter.currentQueue + 1;

  const queue = await prisma.queue.create({
    data: {
      number: nextQueueNumber,
      status: 'claimed',
      counterId: counterId
    },
    include: {
      counter: true
    }
  });

  await prisma.counter.update({
    where: { id: counterId },
    data: { currentQueue: nextQueueNumber }
  });

  return {
    status: true,
    message: "Queue created successfully",
    data: queue,
  };
};

export const SUpdateQueue = async (id: number, status: string): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: { 
      id,
      deletedAt: null 
    },
  });

  if (!queue) {
    throw new Error("Queue not found");
  }

  const updatedQueue = await prisma.queue.update({
    where: { id },
    data: { status },
    include: {
      counter: {
        select: {
          id: true,
          name: true,
          currentQueue: true,
          maxQueue: true
        }
      }
    }
  });

  return {
    status: true,
    message: "Queue updated successfully",
    data: updatedQueue,
  };
};

export const SDeleteQueue = async (id: number): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: { 
      id,
      deletedAt: null 
    },
  });

  if (!queue) {
    throw new Error("Queue not found");
  }

  const deletedQueue = await prisma.queue.update({
    where: { id },
    data: { 
      deletedAt: new Date(),
      updatedAt: new Date()
    },
  });

  return {
    status: true,
    message: "Queue deleted successfully",
    data: deletedQueue,
  };
};

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: { 
      isActive: true, 
      deletedAt: null 
    },
    orderBy: { 
      currentQueue: 'asc',
      createdAt: "asc" 
    },
  });

  if (!counter) {
    throw new Error("No active counter found");
  }

  if (counter.currentQueue >= counter.maxQueue) {
    throw new Error("All counters have reached maximum capacity");
  }

  const nextQueueNum = counter.currentQueue + 1;

  const queue = await prisma.queue.create({
    data: {
      status: "claimed",
      number: nextQueueNum,
      counterId: counter.id,
    },
    include: {
      counter: true,
    },
  });

  await prisma.counter.update({
    where: { id: counter.id },
    data: { currentQueue: nextQueueNum },
  });

  return {
    status: true,
    message: "Success claim queue",
    data: {
      queueNumber: queue.number,
      counterId: counter.id,
      counterName: counter.name,
    },
  };
};

export const SReleaseQueue = async (queueId: number): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id: queueId,
      status: 'claimed',
      deletedAt: null
    }
  });

  if (!queue) {
    throw new Error("Queue not found or already processed");
  }

  const releasedQueue = await prisma.queue.update({
    where: { id: queueId },
    data: { status: 'released' }
  });

  return {
    status: true,
    message: "Queue released successfully",
    data: releasedQueue,
  };
};

export const SGetCurrentStatus = async (): Promise<IGlobalResponse> => {
  const counters = await prisma.counter.findMany({
    where: {
      isActive: true,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      currentQueue: true,
      maxQueue: true,
      isActive: true,
      queues: {
        where: {
          status: 'claimed',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        orderBy: { number: 'asc' },
        take: 1
      }
    },
    orderBy: { name: 'asc' }
  });

  return {
    status: true,
    message: "Current status retrieved successfully",
    data: counters,
  };
};

export const SNextQueue = async (counterId: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findUnique({
    where: { 
      id: counterId, 
      isActive: true, 
      deletedAt: null 
    },
  });

  if (!counter) {
    throw new Error("Counter not found or inactive");
  }

  const claimedQueue = await prisma.queue.findFirst({
    where: {
      counterId: counter.id,
      status: "claimed",
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!claimedQueue) {
    throw new Error("No claimed queue found");
  }

  const updatedQueue = await prisma.queue.update({
    where: { id: claimedQueue.id },
    data: {
      status: "called",
    },
    include: {
      counter: true
    }
  });

  return {
    status: true,
    message: "Next queue called successfully",
    data: updatedQueue,
  };
};

export const SSkipQueue = async (counterId: number): Promise<IGlobalResponse> => {
  const currentQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: 'called',
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  if (!currentQueue) {
    throw new Error("No called queue found to skip");
  }

  await prisma.queue.update({
    where: { id: currentQueue.id },
    data: { status: 'skipped' }
  });

  let nextQueue = null;
  try {
    const result = await SNextQueue(counterId);
    nextQueue = result.data;
  } catch (error) {
  }

  return {
    status: true,
    message: "Queue skipped successfully" + (nextQueue ? " and next queue called" : ""),
    data: {
      skippedQueue: currentQueue,
      nextQueue: nextQueue
    },
  };
};

export const SResetQueue = async (counterId?: number): Promise<IGlobalResponse> => {
  const whereClause = counterId ? { counterId } : {};
  
  await prisma.queue.updateMany({
    where: {
      ...whereClause,
      status: 'claimed',
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    data: { status: 'released' }
  });

  // Reset counter currentQueue to 0
  const counterWhere = counterId ? { id: counterId } : { isActive: true };
  await prisma.counter.updateMany({
    where: counterWhere,
    data: { currentQueue: 0 }
  });

  return {
    status: true,
    message: counterId ? 
      `Queue for counter ${counterId} reset successfully` :
      "All queues reset successfully",
    data: null,
  };
};