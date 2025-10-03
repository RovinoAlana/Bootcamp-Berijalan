import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { publishQueueUpdate } from "../config/redis.config";
import { IGlobalResponse } from "../interfaces/global.interface";

const prisma = new PrismaClient();

export const SGetMetrics = async (): Promise<IGlobalResponse> => {
  const waitingCount = await prisma.queue.count({
    where: { status: "CLAIMED" },
  });
  const calledCount = await prisma.queue.count({
    where: { status: "CALLED" },
  });
  const releasedCount = await prisma.queue.count({
    where: { status: "RELEASED" },
  });
  const skippedCount = await prisma.queue.count({
    where: { status: "SKIPPED" },
  });

  return {
    status: true,
    message: "Metrics retrieved successfully",
    data: {
      waiting: waitingCount,
      called: calledCount,
      released: releasedCount,
      skipped: skippedCount,
    },
  };
};

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { currentQueue: "asc" },
  });

  if (!counter) {
    throw AppError.notFound("No active counters found");
  }

  let nextQueueNumber = counter.currentQueue + 1;

  if (nextQueueNumber > counter.maxQueue) {
    nextQueueNumber = 1;
  }

  const queue = await prisma.queue.create({
    data: {
      number: nextQueueNumber,
      status: "CLAIMED",
      counterId: counter.id,
    },
    include: {
      counter: true,
    },
  });

  await prisma.counter.update({
    where: { id: counter.id },
    data: { currentQueue: nextQueueNumber },
  });

  await publishQueueUpdate({
    event: "queue_claimed",
    counter_id: counter.id,
    counter_name: counter.name,
    queue_number: nextQueueNumber,
  });

  return {
    status: true,
    message: "Queue claimed successfully",
    data: {
      queueNumber: queue.number,
      counterName: queue.counter.name,
      counterId: queue.counter.id,
    },
  };
};

export const SReleaseQueue = async (
  queueNumber: number,
  counterId: number
): Promise<IGlobalResponse> => {
  if (!queueNumber || queueNumber <= 0) {
    throw AppError.badRequest("Invalid queue number", null, "queueNumber");
  }

  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const queue = await prisma.queue.findFirst({
    where: {
      number: queueNumber,
      counterId: counterId,
      status: "CLAIMED",
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found or already processed");
  }

  await prisma.queue.update({
    where: { id: queue.id },
    data: { status: "RELEASED" },
  });

  await publishQueueUpdate({
    event: "queue_released",
    counter_id: counterId,
    queue_number: queueNumber,
  });

  return {
    status: true,
    message: "Queue released successfully",
  };
};

export const SGetCurrentQueues = async (
  includeInactive: boolean = false
): Promise<IGlobalResponse> => {
  const whereCondition: any = {
    deletedAt: null,
  };

  if (!includeInactive) {
    whereCondition.isActive = true;
  }

  const counters = await prisma.counter.findMany({
    where: whereCondition,
    orderBy: { name: "asc" },
  });

  const currentQueues = await prisma.queue.findMany({
    where: {
      counterId: {
        in: counters.map((c) => c.id),
      },
      counter: {
        isActive: includeInactive ? undefined : true,
        deletedAt: null,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = counters.map((counter) => ({
    id: counter.id,
    name: counter.name,
    currentQueue: counter.currentQueue,
    maxQueue: counter.maxQueue,
    isActive: counter.isActive,
    status:
      currentQueues.find((q) => q.counterId === counter.id)?.status || null,
  }));

  console.log("Current queues:", data);

  return {
    status: true,
    message: "Current queues retrieved successfully",
    data,
  };
};

export const SNextQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const claimedQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CLAIMED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!claimedQueue) {
    throw AppError.notFound("No claimed queues found for this counter");
  }

  await prisma.queue.update({
    where: { id: claimedQueue.id },
    data: { status: "CALLED" },
  });

  await publishQueueUpdate({
    event: "queue_called",
    counter_id: counterId,
    queue_number: claimedQueue.number,
    counter_name: counter.name,
  });

  return {
    status: true,
    message: "Next queue called successfully",
    data: {
      queueNumber: claimedQueue.number,
      counterName: counter.name,
      counterId,
    },
  };
};

export const SSkipQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const calledQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CALLED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!calledQueue) {
    throw AppError.notFound("No called queue found for this counter");
  }

  await prisma.queue.update({
    where: { id: calledQueue.id },
    data: { status: "SKIPPED" },
  });

  await publishQueueUpdate({
    event: "queue_skipped",
    counter_id: counterId,
    queue_number: calledQueue.number,
  });

  try {
    const nextQueueResult = await SNextQueue(counterId);
    return {
      status: true,
      message: "Queue skipped successfully and next queue called",
      data: nextQueueResult.data,
    };
  } catch (error) {
    console.warn("No more queues to call after skip:", error);
    return {
      status: true,
      message: "Queue skipped successfully, no more queues to call",
    };
  }
};

export const SResetQueues = async (
  counterId?: number
): Promise<IGlobalResponse> => {
  if (counterId) {
    if (counterId <= 0) {
      throw AppError.badRequest("Invalid counter ID", null, "counterId");
    }

    const counter = await prisma.counter.findUnique({
      where: {
        id: counterId,
        deletedAt: null,
      },
    });

    if (!counter) {
      throw AppError.notFound("Counter not found");
    }

    if (!counter.isActive) {
      throw AppError.badRequest("Counter is not active", null, "counterId");
    }

    await prisma.queue.updateMany({
      where: {
        counterId,
        status: { in: ["CLAIMED", "CALLED"] },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "queue_reset",
      counter_id: counterId,
    });

    return {
      status: true,
      message: `Queue for counter ${counter.name} reset successfully`,
    };
  } else {
    await prisma.queue.updateMany({
      where: {
        status: { in: ["CLAIMED", "CALLED"] },
        counter: {
          isActive: true,
          deletedAt: null,
        },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.updateMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "all_queues_reset",
    });

    return {
      status: true,
      message: "All active queues reset successfully",
    };
  }
};

export const SSearchQueue = async (query: string): Promise<IGlobalResponse> => {
  try {
    const queueNumber = parseInt(query);
    
    let queues;
    
    if (!isNaN(queueNumber)) {
      queues = await prisma.queue.findMany({
        where: {
          number: queueNumber,
        },
        include: {
          counter: {
            select: {
              id: true,
              name: true,
              isActive: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      queues = await prisma.queue.findMany({
        where: {
          counter: {
            name: {
              contains: query,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        },
        include: {
          counter: {
            select: {
              id: true,
              name: true,
              isActive: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    const formattedQueues = queues.map(queue => ({
      id: queue.id,
      queueNumber: queue.number,
      status: queue.status,
      counter: queue.counter ? {
        id: queue.counter.id,
        name: queue.counter.name
      } : null,
      createdAt: queue.createdAt.toISOString(),
      updatedAt: queue.updatedAt.toISOString()
    }));

    if (formattedQueues.length === 0) {
      return {
        status: false,
        message: `Queue dengan nomor atau counter '${query}' tidak ditemukan`,
        data: null
      };
    }

    return {
      status: true,
      message: "Queue found successfully",
      data: formattedQueues
    };
  } catch (error: unknown) {
    console.error("Search queue error:", error);
    
    return {
      status: false,
      message: error instanceof Error ? error.message : "Failed to search queue",
      data: null
    };
  }
};

export const SGetAllQueues = async (): Promise<IGlobalResponse> => {
  try {
    const queues = await prisma.queue.findMany({
      where: {
        status: {
          in: ["CLAIMED", "CALLED", "SERVED", "SKIPPED"] // Hanya status yang aktif
        }
      },
      include: {
        counter: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });

    const formattedQueues = queues.map(queue => ({
      id: queue.id,
      queueNumber: queue.number,
      status: queue.status,
      counter: queue.counter ? {
        id: queue.counter.id,
        name: queue.counter.name
      } : null,
      createdAt: queue.createdAt.toISOString(),
      updatedAt: queue.updatedAt.toISOString()
    }));

    return {
      status: true,
      message: "All queues retrieved successfully",
      data: formattedQueues
    };
  } catch (error: unknown) {
    console.error("Get all queues error:", error);
    
    return {
      status: false,
      message: error instanceof Error ? error.message : "Failed to retrieve queues",
      data: null
    };
  }
};