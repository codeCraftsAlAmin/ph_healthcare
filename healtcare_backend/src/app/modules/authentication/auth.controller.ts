import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { authService } from "./auth.service";
import status from "http-status";
import tokenUtils from "../../utils/token";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import AppError from "../../errorHelpers/AppError";
import cookieUtils from "../../utils/cookie";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { auth } from "../../lib/auth";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUserHanlder(req.body);

  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessToken(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    statusCode: status.CREATED,
    ok: true,
    message: "Data created successfully",
    data: {
      token,
      accessToken,
      refreshToken,
      ...rest,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUserHanlder(req.body);

  const { accessToken, refreshToken, token, ...rest } = result;

  tokenUtils.setAccessToken(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Login successful",
    data: { token, accessToken, refreshToken, ...rest },
  });
});

const myProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await authService.myProfileHanlder(
    user as IRequestUserInterface,
  );

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const sessionToken = req.cookies["better-auth.session_token"];

  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
  }

  const { newAccessToken, newRefreshToken, token } =
    await authService.refreshTokenHanlder(refreshToken, sessionToken);

  tokenUtils.setAccessToken(res, newAccessToken);
  tokenUtils.setRefreshToken(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Refresh token successful",
    data: { token, newAccessToken, newRefreshToken },
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const sessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.changePasswordHandler(payload, sessionToken);

  const { newAccessToken, newRefreshToken, token } = result;

  tokenUtils.setAccessToken(res, newAccessToken);
  tokenUtils.setRefreshToken(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Password changed successfully",
    data: { token, newAccessToken, newRefreshToken },
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // get session token from cookies
  const sessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.logoutUserHanlder(sessionToken);

  // clear cookies
  cookieUtils.clearCookies(res, "accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  cookieUtils.clearCookies(res, "refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  cookieUtils.clearCookies(res, "better-auth.session_token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Logout successful",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmailHandler(email, otp);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Email verified successfully",
    data: result,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgetPasswordHandler(email);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Password reset OTP sent to email successfully",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;
  const result = await authService.resetPasswordHandler(email, otp, password);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Password reset successfully",
    data: null,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  // get redirect path
  const redirectPath = req.query.redirect || "/dashboard";

  // encoded redirect path
  const encodedRedirectPath = encodeURIComponent(redirectPath as string);

  // callback url
  const callbackUrl = `${envVars.BETTER_AUTH_URL}/api/auth/google/success?redirect=${encodedRedirectPath}`;

  res.render("googleRedirect", {
    callbackUrl: callbackUrl,
    betterAuthUrl: envVars.BETTER_AUTH_URL,
  });
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  // get redirect path
  const redirectPath = (req.query.redirect as string) || "/dashboard";

  // get sessionToken
  const sessionToken = req.cookies["better-auth.session_token"];

  if (!sessionToken) {
    return res.redirect(
      `${envVars.FRONTEND_URL}/login?error=session_token_missing`,
    );
  }

  // get session from cookie
  const session = await auth.api.getSession({
    headers: {
      Cookie: `better-auth.session_token=${sessionToken}`,
    },
  });

  if (!session || !session.user) {
    return res.redirect(
      `${envVars.FRONTEND_URL}/login?error=session_token_missing`,
    );
  }

  // get data
  const result = await authService.googleLoginSuccessHandler(session);

  const { accessToken, refreshToken } = result;

  // set cookies
  tokenUtils.setAccessToken(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

  // redirect
  const isValidRedirectPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");

  const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

  res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
});

const googleLoginError = catchAsync(async (req: Request, res: Response) => {
  // get the error
  const error = (req.query.error as string) || "oauth_failed";

  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});

export const authController = {
  registerUser,
  loginUser,
  myProfile,
  refreshToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  googleLoginError,
};
