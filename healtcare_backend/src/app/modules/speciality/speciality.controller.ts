import { Request, Response } from "express";
import { specialityService } from "./speciality.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { Speciality } from "../../../generated/prisma/client";

const getSpecialities = catchAsync(async (req: Request, res: Response) => {
  const result = await specialityService.getSpecialitiesHandler();
  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data fetched successfully",
    data: result,
  });
});

const createSpeciality = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    icon: req.file?.path,
  };

  const result = await specialityService.createSpecialitiesHandler(
    payload as Speciality,
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    ok: true,
    message: "Data created successfully",
    data: result,
  });
});

const deleteSpeciality = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await specialityService.deleteSpecialityHandler(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data deleted successfully",
  });
});

export const specialityController = {
  getSpecialities,
  createSpeciality,
  deleteSpeciality,
};
