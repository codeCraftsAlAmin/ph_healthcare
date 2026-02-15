import express from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createDoctorZodSchema } from "./user.validation";

const router = express.Router();

// create doctor
router.post(
  "/users/create-doctor",
  validateRequest(createDoctorZodSchema),
  userController.createDoctor,
);

export const userRouter = router;
