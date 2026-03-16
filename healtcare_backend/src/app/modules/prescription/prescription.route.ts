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
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.myPrescriptions,
);

router.post(
  "/give-prescription",
  checkAuth(Role.DOCTOR),
  PrescriptionController.givePrescription,
);

router.put(
  "/:id",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.updatePrescription,
);

router.delete(
  "/:id",
  checkAuth(Role.DOCTOR),
  PrescriptionController.deletePrescription,
);

export const prescriptionRouter = router;
