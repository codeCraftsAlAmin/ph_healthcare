import express from "express";

import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { doctorScheduleController } from "./doctorSchedule.controller";
const router = express.Router();

// create doctor schedule
router.post(
  "/create-my-doctor-schedule",
  checkAuth(Role.DOCTOR),
  // Todos: validateRequest(createDoctorScheduleZodSchema),
  doctorScheduleController.createDoctorSchedule,
);

// get all doctor schedule by admin/super admin
router.get(
  "/get-doctor-schedules",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  doctorScheduleController.getAllDoctorSchedules,
);

// get my doctor schedules
router.get(
  "/get-my-doctor-schedules",
  checkAuth(Role.DOCTOR),
  doctorScheduleController.getMyDoctorSchedules,
);

// get a doctor schedule by admin/super admin
router.get(
  "/:doctorId/get-doctor-schedules/:scheduleId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  doctorScheduleController.getDoctorSchedulesById,
);

// update doctor schedule
router.put(
  "/update-my-doctor-schedule",
  checkAuth(Role.DOCTOR),
  // Todos: validateRequest(updateDoctorScheduleZodSchema),
  doctorScheduleController.updateDoctorSchedule,
);

// delete doctor schedule
router.delete(
  "/delete-my-doctor-schedule/:id",
  checkAuth(Role.DOCTOR),
  doctorScheduleController.deleteDoctorSchedule,
);

export const doctorScheduleRouter = router;
