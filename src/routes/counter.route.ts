import { Router } from "express";
import {
  CGetAllCounters,
  CGetCounterById,
  CCreateCounter,
  CUpdateCounter,
  CUpdateCounterStatus,
  CDeleteCounter
} from "../controllers/counter.controller.js";
import { MValidate } from "../middlewares/validation.middleware.js";
import {
  createCounterSchema,
  updateCounterSchema,
  idSchema,
  counterStatusSchema
} from "../schemas/counter.schema.js";
import { MInvalidateCache } from "../middlewares/cache.middleware.js";
import { MAuthValidate } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /counters - Get all counters
router.get("/", MAuthValidate, CGetAllCounters);

// GET /counters/:id - Get single counter detail
router.get("/:id", MValidate(idSchema, "params"), MAuthValidate, CGetCounterById);

// POST /counters - Create new counter
router.post("/", MValidate(createCounterSchema, "body"), MAuthValidate, CCreateCounter);

// PUT /counters/:id - Update counter details
router.put("/:id", 
  MValidate(idSchema, "params"),
  MValidate(updateCounterSchema, "body"),
  MInvalidateCache,
  MAuthValidate,
  CUpdateCounter
);

// PATCH /counters/:id/status - Update counter status
router.patch("/:id/status",
  MValidate(idSchema, "params"),
  MValidate(counterStatusSchema, "body"),
  MInvalidateCache,
  MAuthValidate,
  CUpdateCounterStatus
);

// DELETE /counters/:id - Delete counter
router.delete("/:id",
  MValidate(idSchema, "params"),
  MAuthValidate,
  CDeleteCounter
);

export default router;