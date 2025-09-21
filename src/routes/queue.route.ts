import { Router } from "express";
import {
  CGetAllQueues,
  CGetQueueById,
  CCreateQueue,
  CUpdateQueue,
  CDeleteQueue,
  CClaimQueue,
  CReleaseQueue,
  CGetCurrentStatus,
  CNextQueue,
  CSkipQueue,
  CResetQueue
} from "../controllers/queue.controller.js";
import { MValidate } from "../middlewares/validation.middleware.js";
import {
  createQueueSchema,
  updateQueueSchema,
  idSchema,
  releaseQueueSchema,
  resetQueueSchema
} from "../schemas/queue.schema.js";
import { MAuthValidate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", MAuthValidate, CGetAllQueues);
router.get("/:id", MValidate(idSchema, "params"), MAuthValidate, CGetQueueById);
router.post("/", MValidate(createQueueSchema, "body"), MAuthValidate, CCreateQueue);
router.put("/:id", MValidate(idSchema, "params"), MValidate(updateQueueSchema, "body"), MAuthValidate, CUpdateQueue);
router.delete("/:id", MValidate(idSchema, "params"), MAuthValidate, CDeleteQueue);

router.post("/claim", CClaimQueue); // No auth
router.post("/release", MValidate(releaseQueueSchema, "body"), CReleaseQueue); // No auth
router.get("/current/status", CGetCurrentStatus); // No auth
router.post("/next/:counter_id", MValidate(idSchema, "params"), MAuthValidate, CNextQueue);
router.post("/skip/:counter_id", MValidate(idSchema, "params"), MAuthValidate, CSkipQueue);
router.post("/reset", MValidate(resetQueueSchema, "body"), MAuthValidate, CResetQueue);

export default router;