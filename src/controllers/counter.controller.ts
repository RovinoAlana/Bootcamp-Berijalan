import type { Request, Response } from "express";
import {
  SGetAllCounters,
  SGetCounterById,
  SCreateCounter,
  SUpdateCounter,
  SUpdateCounterStatus,
  SDeleteCounter,
} from "../services/counter.service.js";

export const CGetAllCounters = async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const result = await SGetAllCounters(includeDeleted);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: error.message || "Failed to retrieve counters",
    });
  }
};

export const CGetCounterById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid counter ID",
      });
    }

    const result = await SGetCounterById(id);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Counter not found") {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      status: false,
      message: error.message || "Failed to retrieve counter",
    });
  }
};

export const CCreateCounter = async (req: Request, res: Response) => {
  try {
    const { name, maxQueue, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        status: false,
        message: "Name is required",
      });
    }

    const result = await SCreateCounter(name, maxQueue, isActive);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "Counter name already in use") {
      return res.status(409).json({
        status: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      status: false,
      message: error.message || "Failed to create counter",
    });
  }
};

export const CUpdateCounter = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, currentQueue, maxQueue, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid counter ID",
      });
    }

    const result = await SUpdateCounter(id, {
      name,
      currentQueue,
      maxQueue,
      isActive,
    });

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Counter not found") {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }
    
    if (error.message === "Counter name already in use") {
      return res.status(409).json({
        status: false,
        message: error.message,
      });
    }

    res.status(500).json({
      status: false,
      message: error.message || "Failed to update counter",
    });
  }
};

export const CUpdateCounterStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid counter ID",
      });
    }

    if (!['active', 'inactive', 'disable'].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Status must be one of: active, inactive, disable",
      });
    }

    const result = await SUpdateCounterStatus(id, status);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Counter not found") {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }

    res.status(500).json({
      status: false,
      message: error.message || "Failed to update counter status",
    });
  }
};

export const CDeleteCounter = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid counter ID",
      });
    }

    const result = await SDeleteCounter(id);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Counter not found") {
      return res.status(404).json({
        status: false,
        message: error.message,
      });
    }

    res.status(500).json({
      status: false,
      message: error.message || "Failed to delete counter",
    });
  }
};