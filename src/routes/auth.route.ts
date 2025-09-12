import {Router} from "express";
import {
    CLogin, CCreate,
    CUpdate, CDelete
} from "../controllers/auth.controller.js";
import { MValidate } from "../middlewares/validation.middleware.js";
import {
    loginSchema, createSchema,
    updateSchema, idSchema
} from "../schemas/auth.schema.js";
const router = Router();

router.post("/login", MValidate(loginSchema, "body"), CLogin);
router.post("/create", MValidate(createSchema, "body"), CCreate);
router.put("/update/:id", MValidate(updateSchema, "params"), MValidate(updateSchema, "body"), CUpdate);
router.delete("/delete/:id",MValidate(idSchema, "params"), CDelete);

export default router;