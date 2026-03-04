import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { schedulesService } from "./schedules.service";
import { IQueryParams } from "../../interface/query.interface";
import { IUpdateSchedule } from "./schedule.interface";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await schedulesService.createScheduleHandler(req.body);
  sendResponse(res, {
    ok: true,
    message: "Schedule created successfully",
    statusCode: 200,
    data: result,
  });
});
const getSchedules = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await schedulesService.getSchedulesHandler(
    query as IQueryParams,
  );
  sendResponse(res, {
    ok: true,
    message: "Schedules fetched successfully",
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});
const getScheduleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await schedulesService.getScheduleByIdHandler(id as string);
  sendResponse(res, {
    ok: true,
    message: "Schedule fetched successfully",
    statusCode: 200,
    data: result,
  });
});
const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await schedulesService.deleteScheduleHandler(id as string);
  sendResponse(res, {
    ok: true,
    message: "Schedule deleted successfully",
    statusCode: 200,
    data: null,
  });
});
const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await schedulesService.updateScheduleHandler(
    id as string,
    req.body as IUpdateSchedule,
  );
  sendResponse(res, {
    ok: true,
    message: "Schedule updated successfully",
    statusCode: 200,
    data: result,
  });
});

export const schedulesController = {
  createDoctor,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  updateSchedule,
};
