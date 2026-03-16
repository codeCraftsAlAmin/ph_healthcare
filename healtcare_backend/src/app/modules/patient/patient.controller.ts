import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";

import { PatientService } from "./patient.service";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await PatientService.updateMyProfile(user!, payload);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

export const PatientController = {
  updateMyProfile,
};
