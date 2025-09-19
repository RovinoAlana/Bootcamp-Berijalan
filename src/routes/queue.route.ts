import { Router } from "express";
import { CClaimedQueue, CNextQueue } from "../controllers/queue.controller.js";
import { MAuthValidate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/claim", CClaimedQueue);

router.post("/next/:counter_id", MAuthValidate, CNextQueue);

export default router;