import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { sepcialityRouter } from "./app/modules/speciality/speciality.route";
import { authRouter } from "./app/modules/authentication/auth.route";
import { globalError } from "./app/middleware/globalError";
import { routeError } from "./app/middleware/routeError";
import { userRouter } from "./app/modules/user/user.route";
import { doctorRouter } from "./app/modules/doctor/doctor.route";
import { adminRouter } from "./app/modules/admin/admin.route";
import { superAdminRouter } from "./app/modules/superAdmin/superAdmin.route";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "path";
import { envVars } from "./app/config/env";
import cors from "cors";
import qs from "qs";
import { schedulesRouter } from "./app/modules/schedules/schedules.route";
import { doctorScheduleRouter } from "./app/modules/doctorSchedules/doctorSchedule.route";
import { appointmentRouter } from "./app/modules/appointment/appointment.route";
import { PaymentController } from "./app/modules/payment/payment.controller";
import cron from "node-cron";
import { AppointmentService } from "./app/modules/appointment/appointment.service";
import { patientRouter } from "./app/modules/patient/patient.route";
import { reviewRouter } from "./app/modules/review/review.route";
import { prescriptionRouter } from "./app/modules/prescription/prescription.route";

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));

// set ejsg
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// stripe webhook
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handlePaymentWebhook,
);

// cancel unpaid appointment
cron.schedule("*/25 * * * *", () => {
  try {
    console.log("Running cron job to cancel unpaid appointments...");
    AppointmentService.cancelUnpaidPayments();
  } catch (error: any) {
    console.error(
      "Error occurred while canceling unpaid appointments:",
      error.message,
    );
  }
});

// review route
app.use("/api", reviewRouter);

// update profile route
app.use("/api", patientRouter);

// prescription route
app.use("/api", prescriptionRouter);

// appointment router
app.use("/api", appointmentRouter);

// doctor schedule router
app.use("/api", doctorScheduleRouter);

// schedules router
app.use("/api", schedulesRouter);

// speciality route
app.use("/api/v1", sepcialityRouter);

// register user route
app.use("/api/auth", authRouter);

// user route -- create admin, super_admin, doctor
app.use("/api/auth", userRouter);

// doctor router
app.use("/api", doctorRouter);

// admin router
app.use("/api", adminRouter);

// super admin router
app.use("/api", superAdminRouter);

// social login route
app.use("/api/auth", toNodeHandler(auth));

// base route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, from express ts");
});

// global error
app.use(globalError);
// route error
app.use(routeError);

export default app;
