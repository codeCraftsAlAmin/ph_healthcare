import express from "express";
import { specialityController } from "./speciality.controller";

const router = express.Router();

// get all specialities
router.get("/specialities", specialityController.getSpecialities);
// create speciality
router.post("/speciality", specialityController.createSpeciality);
// delete speciality
router.delete("/speciality/:id", specialityController.deleteSpeciality);

export const sepcialityRouter = router;
