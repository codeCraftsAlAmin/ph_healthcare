import express from "express";
import { superAdminController } from "./superAdmin.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { updateSuperAdminZodSchema } from "./superAdmin.validation";

const router = express.Router();

// get super admins
router.get(
  "/super-admins",
  checkAuth(Role.SUPER_ADMIN),
  superAdminController.getSuperAdmins,
);

// get super admin by id
router.get(
  "/super-admin/:id",
  checkAuth(Role.SUPER_ADMIN),
  superAdminController.getSuperAdminById,
);

// update super admin
router.put(
  "/super-admin/:id",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(updateSuperAdminZodSchema),
  superAdminController.updateSuperAdmin,
);

// delete super admin
router.delete(
  "/super-admin/:id",
  checkAuth(Role.SUPER_ADMIN),
  superAdminController.deleteSuperAdmin,
);

export const superAdminRouter = router;
