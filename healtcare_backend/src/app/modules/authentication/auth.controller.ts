import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { authService } from "./auth.service";
import status from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUserHanlder(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    ok: true,
    message: "Data created successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUserHanlder(req.body);

  sendResponse(res, {
    statusCode: 200,
    ok: true,
    message: "Login successful",
    data: result,
  });
});

export const authController = {
  registerUser,
  loginUser,
};
