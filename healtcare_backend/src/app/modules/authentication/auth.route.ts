import express from "express";
import { authController } from "./auth.controller";

const router = express.Router();
// sign up user
router.post("/signup", authController.registerUser);
// sign in user
router.post("/signin", authController.loginUser);

export const authRouter = router;
