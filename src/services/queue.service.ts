import { PrismaClient } from "@prisma/client";
import type { IGlobalResponse } from "../interfaces/global.interface.js";

const prismaClient = new PrismaClient();

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  try {
    const counter = await prismaClient.counter.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    if (!counter) {
      throw Error("No active counter found!");
    }

    let nextQueueNum = counter.currentQueue + 1;

    const queue = await prismaClient.queue.create({
      data: {
        status: "claimed",
        number: nextQueueNum,
        counterId: counter.id,
      },
      include: {
        counter: true,
      },
    });

    await prismaClient.counter.update({
      where: { id: counter.id },
      data: { currentQueue: { increment: 1 } },
    });

    return {
      status: true,
      message: "Success claim queue!",
      data: queue,
    };
  } catch (e) {
    throw e;
  }
};

export const SNextQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  try {
    const counter = await prismaClient.counter.findUnique({
      where: { id: counterId, isActive: true, deletedAt: null },
    });

    if (!counter) {
      throw Error("No active counter found!");
    }

    const claimedQueue = await prismaClient.queue.findFirst({
      where: {
        counterId: counter.id,
        status: "claimed",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!claimedQueue) {
      throw Error("No claimed queue found!");
    }

    await prismaClient.queue.update({
      where: { id: claimedQueue.id },
      data: {
        status: "called",
      },
    });

    return {
      status: true,
      message: "Success get next queue!",
      data: {
        ...claimedQueue,
      },
    };
  } catch (e) {
    throw e;
  }
};