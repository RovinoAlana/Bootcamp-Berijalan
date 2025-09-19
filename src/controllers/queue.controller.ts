import type { NextFunction, Request, Response } from "express";
import { SClaimQueue, SNextQueue } from "../services/queue.service.js";

export const CClaimedQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SClaimQueue();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CNextQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SNextQueue(Number(req.params.counter_id));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};