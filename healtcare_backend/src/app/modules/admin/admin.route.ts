import express from "express";
import { adminController } from "./admin.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { updateAdminZodSchema } from "./admin.validation";

const router = express.Router();

// get admins
router.get(
  "/admins",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  adminController.getAdmins,
);

// get admin by id
router.get(
  "/admin/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  adminController.getAdminById,
);

// update admin
router.put(
  "/admin/:id",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(updateAdminZodSchema),
  adminController.updateAdmin,
);

// delete admin
router.delete(
  "/admin/:id",
  checkAuth(Role.SUPER_ADMIN),
  adminController.deleteAdmin,
);

// change user status
router.put(
  "/change-user-status",
  checkAuth(Role.SUPER_ADMIN),
  adminController.changeUserStatus,
);

// change user role
router.put(
  "/change-user-role",
  checkAuth(Role.SUPER_ADMIN),
  adminController.changeUserRole,
);

export const adminRouter = router;
