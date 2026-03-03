import express from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createAdminZodSchema,
  createDoctorZodSchema,
  createSuperAdminZodSchema,
} from "./user.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// create doctor
router.post(
  "/users/create-doctor",
  validateRequest(createDoctorZodSchema),
  userController.createDoctor,
);

// create admin
router.post(
  "/users/create-admin",
  // checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(createAdminZodSchema),
  userController.createAdmin,
);

// create super admin
router.post(
  "/users/create-super-admin",
  validateRequest(createSuperAdminZodSchema),
  userController.createSuperAdmin,
);

export const userRouter = router;
