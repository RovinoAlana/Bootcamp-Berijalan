import {Router} from "express";
import {
    CLogin, CCreate,
    CUpdate, CDelete, CGetAllAdmins
} from "../controllers/auth.controller.js";
import { MValidate } from "../middlewares/validation.middleware.js";
import {
    loginSchema, createSchema,
    updateSchema, idSchema
} from "../schemas/auth.schema.js";
import { MInvalidateCache } from "../middlewares/cache.middleware.js";
import { MAuthValidate } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/login", MValidate(loginSchema, "body"), CLogin);
router.post("/create", MValidate(createSchema, "body"), MAuthValidate, CCreate);
router.put("/update/:id", MValidate(updateSchema, "params"), MValidate(updateSchema, "body"), MInvalidateCache, MAuthValidate,CUpdate);
router.delete("/delete/:id",MValidate(idSchema, "params"), MAuthValidate, CDelete);
router.get("/admins", MAuthValidate, CGetAllAdmins);

export default router;