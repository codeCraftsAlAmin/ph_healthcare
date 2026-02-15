import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { userService } from "./user.service";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createDoctorHandler(req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    ok: true,
    message: "Doctor created successfully",
    data: result,
  });
});

export const userController = {
  createDoctor,
};
