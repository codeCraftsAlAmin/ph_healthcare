import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { PrescriptionService } from "./prescription.service";

const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getAllPrescriptions();
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Prescriptions retrieved successfully",
    data: result,
  });
});

const myPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const reult = await PrescriptionService.myPrescriptions(user!);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Prescriptions retrieved successfully",
    data: reult,
  });
});

const givePrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await PrescriptionService.givePrescription(user!, payload);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Prescription given successfully",
    data: result,
  });
});

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Prescription updated successfully",
    data: [],
  });
});

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const result = await PrescriptionService.deletePrescription(
    id as string,
    user!,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Prescription deleted successfully",
    data: result,
  });
});

export const PrescriptionController = {
  getAllPrescriptions,
  myPrescriptions,
  givePrescription,
  updatePrescription,
  deletePrescription,
};
