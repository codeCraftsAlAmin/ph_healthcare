import express from "express";
import { appointmentController } from "./appointment.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// book appointment
router.post(
  "/book-appointment",
  checkAuth(Role.PATIENT),
  appointmentController.bookAppointment,
);

// get my appointments
router.get(
  "/my-appointments",
  checkAuth(Role.PATIENT, Role.DOCTOR),
  appointmentController.getMyAppointments,
);

// change appointment status
router.put(
  "/change-appointment-status/:id",
  checkAuth(Role.DOCTOR, Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
  appointmentController.changeAppointmentStatus,
);

// get my appointment
router.get(
  "/my-appointment/:id",
  checkAuth(Role.PATIENT, Role.DOCTOR),
  appointmentController.getMyAppointment,
);

// get all appointments
router.get(
  "/all-appointments",
  // checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  appointmentController.getAllAppointments,
);

// book appointment with pay later
router.post(
  "/book-appointment-with-pay-later",
  checkAuth(Role.PATIENT),
  appointmentController.bookAppointmentWithPaylater,
);

// initiate payment
router.post(
  "/initiate-payment/:id",
  checkAuth(Role.PATIENT),
  appointmentController.initiatePayment,
);

export const appointmentRouter = router;
