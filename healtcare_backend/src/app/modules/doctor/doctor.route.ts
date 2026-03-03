import express from "express";
import { doctorController } from "./doctor.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { updateDoctorZodSchema } from "./doctor.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// get doctors
router.get("/users/doctors", doctorController.getDoctors);
// get doctor by id
router.get(
  "/users/doctor/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  doctorController.getDoctorById,
);
// delete doctor
router.delete(
  "/users/delete-doctors/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  doctorController.deleteDoctor,
);
// update doctor
router.put(
  "/users/update-doctors/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateDoctorZodSchema),
  doctorController.updateDoctor,
);

export const doctorRouter = router;
