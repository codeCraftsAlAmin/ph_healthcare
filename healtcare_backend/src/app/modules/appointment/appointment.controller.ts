import status from "http-status";
import { sendResponse } from "../../shared/sendResponse";
import { Request, Response } from "express";
import { AppointmentService } from "./appointment.service";
import { IQueryParams } from "../../interface/query.interface";

const bookAppointment = async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await AppointmentService.bookAppointment(user!, payload);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointment booked successfully",
    data: result,
  });
};

const getMyAppointments = async (req: Request, res: Response) => {
  const user = req.user;

  const result = await AppointmentService.getMyAppointments(user!);
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

  const result = await AppointmentService.changeAppointmentStatus(
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

  const result = await AppointmentService.getMyAppointment(user!, id as string);
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "My appointment fetched successfully",
    data: result,
  });
};

const getAllAppointments = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await AppointmentService.getAllAppointments(
    query as IQueryParams,
  );
  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointments fetched successfully",
    data: result,
  });
};

const bookAppointmentWithPaylater = async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await AppointmentService.bookAppointmentWithPaylater(
    payload,
    user!,
  );

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Appointment booked successfully with Pay Later option",
    data: result,
  });
};

const initiatePayment = async (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  const user = req.user;

  const result = await AppointmentService.initiatePayment(
    appointmentId as string,
    user!,
  );

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Payment initiated successfully",
    data: result,
  });
};

export const appointmentController = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMyAppointment,
  getAllAppointments,
  bookAppointmentWithPaylater,
  initiatePayment,
};
