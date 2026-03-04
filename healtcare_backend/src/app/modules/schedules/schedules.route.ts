import express from "express";

import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { schedulesController } from "./schedules.controller";
import { scheduleValidation } from "./schedule.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = express.Router();

// create schedule
router.post(
  "/schedule",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(scheduleValidation.createScheduleZodSchema),
  schedulesController.createDoctor,
);

// get schedules
router.get(
  "/schedules",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  schedulesController.getSchedules,
);

// get schedule by id
router.get(
  "/schedule/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  schedulesController.getScheduleById,
);

// delete schedule
router.delete(
  "/schedule/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  schedulesController.deleteSchedule,
);

// update schedule
router.put(
  "/schedule/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(scheduleValidation.updateScheduleZodSchema),
  schedulesController.updateSchedule,
);

export const schedulesRouter = router;
