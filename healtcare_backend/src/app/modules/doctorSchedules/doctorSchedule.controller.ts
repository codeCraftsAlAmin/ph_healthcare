import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { doctorScheduleService } from "./doctorSchedule.service";
import { IQueryParams } from "../../interface/query.interface";

const createDoctorSchedule = async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await doctorScheduleService.createDoctorSchedule(
    payload,
    user!,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.CREATED,
    message: "Doctor schedule created successfully",
    data: result,
  });
};

const updateDoctorSchedule = async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await doctorScheduleService.updateDoctorSchedule(
    user!,
    payload,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Doctor schedule updated successfully",
    data: result,
  });
};

const deleteDoctorSchedule = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user;

  await doctorScheduleService.deleteDoctorSchedule(id as string, user!);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Doctor schedule deleted successfully",
    data: null,
  });
};

const getAllDoctorSchedules = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await doctorScheduleService.getAllDoctorSchedules(
    query as IQueryParams,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Doctor schedule fetched successfully",
    data: result.data,
    meta: result.meta,
  });
};

const getDoctorSchedulesById = async (req: Request, res: Response) => {
  const { doctorId, scheduleId } = req.params;

  const result = await doctorScheduleService.getDoctorSchedulesById(
    doctorId as string,
    scheduleId as string,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Doctor schedules fetched successfully",
    data: result,
  });
};

const getMyDoctorSchedules = async (req: Request, res: Response) => {
  const user = req.user;
  const query = req.query;

  const result = await doctorScheduleService.getMyDoctorSchedules(
    user!,
    query as IQueryParams,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Doctor schedules fetched successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const doctorScheduleController = {
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getAllDoctorSchedules,
  getDoctorSchedulesById,
  getMyDoctorSchedules,
};
