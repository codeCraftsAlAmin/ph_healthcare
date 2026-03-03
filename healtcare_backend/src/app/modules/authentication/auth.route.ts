import express from "express";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();
// sign up user
router.post("/signup", authController.registerUser);
// sign in user
router.post("/signin", authController.loginUser);
// my profile
router.get(
  "/me",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.myProfile,
);
// refresh token
router.post("/refresh-token", authController.refreshToken);
// change password
router.post(
  "/change-password",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.changePassword,
);
// log out user
router.post(
  "/logout",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.logoutUser,
);
// verify email
router.post("/verify-email", authController.verifyEmail);
// forget password
router.post("/forget-password", authController.forgetPassword);
// reset password
router.post("/reset-password", authController.resetPassword);

// google login
router.get("/login/google", authController.googleLogin);
// success login
router.get("/google/success", authController.googleLoginSuccess);
// google failure
router.get("/oauth/error", authController.googleLoginError);

export const authRouter = router;
