import express from "express";
import { doctorController } from "./doctor.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { updateDoctorZodSchema } from "./doctor.validation";

const router = express.Router();

// get doctors
router.get("/users/doctors", doctorController.getDoctors);
// get doctor by id
router.get("/users/doctor/:id", doctorController.getDoctorById);
// delete doctor
router.delete("/users/delete-doctors/:id", doctorController.deleteDoctor);
// update doctor
router.put(
  "/users/update-doctors/:id",
  validateRequest(updateDoctorZodSchema),
  doctorController.updateDoctor,
);

export const doctorRouter = router;
