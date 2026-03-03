import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { doctorService } from "./doctor.service";
import { IUpdateDoctorPayload } from "./doctor.interface";
import { IQueryParams } from "../../interface/query.interface";

const getDoctors = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await doctorService.getDoctorsHandler(query as IQueryParams);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data retrived successfully",
    data: result.data,
    meta: result.meta,
  });
});

const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await doctorService.deleteDoctorsHandler(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data deleted successfully",
  });
});

const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await doctorService.getDoctorByIdHandler(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data retrived successfully",
    data: result,
  });
});

const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await doctorService.updateDoctorHandler(id as string, payload);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Data updated successfully",
    data: result,
  });
});

export const doctorController = {
  getDoctors,
  deleteDoctor,
  getDoctorById,
  updateDoctor,
};
