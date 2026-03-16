import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";

import { checkAuth } from "../../middleware/checkAuth";
import { PatientController } from "./patient.controller";
import { PatientValidation } from "./patient.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { multerUpload } from "../../config/multer.config";
import { uploadPatientProfileMiddleware } from "./patient.middleware";

const router = Router();

router.put(
  "/update-my-profile",
  checkAuth(Role.PATIENT),
  multerUpload.fields([
    { name: "profilePhotos", maxCount: 1 },
    { name: "medicalReports", maxCount: 10 },
  ]),
  uploadPatientProfileMiddleware,
  validateRequest(PatientValidation.updatePatientProfileZodSchema),
  PatientController.updateMyProfile,
);

export const patientRouter = router;
