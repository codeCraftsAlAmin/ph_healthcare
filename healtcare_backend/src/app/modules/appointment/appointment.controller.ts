import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";
import { Request, Response } from "express";
import { appointmentService } from "./appointment.service";
import { IQueryParams } from "../../interface/query.interface";

const bookAppointment = async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await appointmentService.bookAppointment(user!, payload);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointment booked successfully",
    data: result,
  });
};

const getMyAppointments = async (req: Request, res: Response) => {
  const user = req.user;

  const result = await appointmentService.getMyAppointments(user!);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "My appointments fetched successfully",
    data: result,
  });
};

const changeAppointmentStatus = async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const { id } = req.params;

  const result = await appointmentService.changeAppointmentStatus(
    user!,
    payload,
    id as string,
  );

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointment status changed successfully",
    data: result,
  });
};

const getMyAppointment = async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  const result = await appointmentService.getMyAppointment(user!, id as string);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "My appointment fetched successfully",
    data: result,
  });
};

const getAllAppointments = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await appointmentService.getAllAppointments(
    query as IQueryParams,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointments fetched successfully",
    data: result,
  });
};

export const appointmentController = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMyAppointment,
  getAllAppointments,
};
