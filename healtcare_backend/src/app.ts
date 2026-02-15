import express, { Application, Request, Response } from "express";
import { sepcialityRouter } from "./app/modules/speciality/speciality.route";
import { authRouter } from "./app/modules/authentication/auth.route";
import { globalError } from "./app/middleware/globalError";
import { routeError } from "./app/middleware/routeError";
import { userRouter } from "./app/modules/user/user.route";
import { doctorRouter } from "./app/modules/doctor/doctor.route";

const app: Application = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// speciality route
app.use("/api/v1", sepcialityRouter);

// speciality route
app.use("/api/auth", authRouter);

// user route
app.use("/api/auth", userRouter);

// doctor router
app.use("/api", doctorRouter);

// base route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, from express ts");
});

// global error
app.use(globalError);
// route error
app.use(routeError);

export default app;
