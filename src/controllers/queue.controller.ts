import type { NextFunction, Request, Response } from "express";
import {
  SGetAllQueues,
  SGetQueueById,
  SCreateQueue,
  SUpdateQueue,
  SDeleteQueue,
  SClaimQueue,
  SReleaseQueue,
  SGetCurrentStatus,
  SNextQueue,
  SSkipQueue,
  SResetQueue
} from "../services/queue.service.js";

export const CGetAllQueues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetAllQueues();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetQueueById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "Invalid queue ID"
      });
      return;
    }

    const result = await SGetQueueById(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CCreateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counterId } = req.body;
    if (!counterId) {
      res.status(400).json({
        status: false,
        message: "Counter ID is required"
      });
      return;
    }

    const result = await SCreateQueue(Number(counterId));
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const CUpdateQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "Invalid queue ID"
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        status: false,
        message: "Status is required"
      });
      return;
    }

    const result = await SUpdateQueue(id, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CDeleteQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        status: false,
        message: "Invalid queue ID"
      });
      return;
    }

    const result = await SDeleteQueue(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CClaimQueue = async (
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

export const CReleaseQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queueId } = req.body;
    if (!queueId) {
      res.status(400).json({
        status: false,
        message: "Queue ID is required"
      });
      return;
    }

    const result = await SReleaseQueue(Number(queueId));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CGetCurrentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await SGetCurrentStatus();
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
    const counterId = Number(req.params.counter_id);
    if (isNaN(counterId)) {
      res.status(400).json({
        status: false,
        message: "Invalid counter ID"
      });
      return;
    }

    const result = await SNextQueue(counterId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CSkipQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const counterId = Number(req.params.counter_id);
    if (isNaN(counterId)) {
      res.status(400).json({
        status: false,
        message: "Invalid counter ID"
      });
      return;
    }

    const result = await SSkipQueue(counterId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const CResetQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { counterId } = req.body;
    const result = await SResetQueue(counterId ? Number(counterId) : undefined);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};