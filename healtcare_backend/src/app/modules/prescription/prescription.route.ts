import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PrescriptionController } from "./prescription.controller";
import { PrescriptionValidation } from "./prescription.validate";
import { validateRequest } from "../../middleware/validateRequest";

const router = express.Router();

router.get(
  "/all-prescriptions",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  PrescriptionController.getAllPrescriptions,
);

router.get(
  "/my-prescriptions",
  checkAuth(Role.PATIENT, Role.DOCTOR),
  PrescriptionController.myPrescriptions,
);

router.post(
  "/give-prescription",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.givePrescription,
);

router.put(
  "/update-prescription/:id",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.updatePrescriptionZodSchema),
  PrescriptionController.updatePrescription,
);

router.delete(
  "/delete-prescription/:id",
  checkAuth(Role.DOCTOR),
  PrescriptionController.deletePrescription,
);

export const prescriptionRouter = router;
