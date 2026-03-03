import express from "express";
import { specialityController } from "./speciality.controller";
import { multerUpload } from "../../config/multer.config";
import { specialityValidation } from "./speciality.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = express.Router();

// get all specialities
router.get("/specialities", specialityController.getSpecialities);
// create speciality
router.post(
  "/speciality",
  multerUpload.single("file"),
  validateRequest(specialityValidation.createSpecialityZodSchema),
  specialityController.createSpeciality,
);
// delete speciality
router.delete("/speciality/:id", specialityController.deleteSpeciality);

export const sepcialityRouter = router;
