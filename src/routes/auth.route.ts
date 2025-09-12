import {Router} from "express";
import {
    CLogin, CCreate
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", CLogin);
router.post("/create", CCreate);

export default router;