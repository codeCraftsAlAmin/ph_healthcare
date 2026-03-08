import { uuidv7 } from "zod";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import { IBookAppointment } from "./appointment.interface";
import { AppointmentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Appointment, Prisma } from "../../../generated/prisma/client";
import {
  appointmentFilterableFields,
  appointmentIncludeConfig,
  appointmentSearchableFields,
} from "./appointment.constant";

const bookAppointment = async (
  user: IRequestUserInterface,
  payload: IBookAppointment,
) => {
  // verify the patient
  const patient = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
  });

  // verify the doctor
  await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
    },
  });

  // verify the slot
  await prisma.doctorSchedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  const videoCallingId = String(uuidv7());

  // create the appointment
  const result = await prisma.$transaction(async (tx) => {
    // create the appointment
    const appointment = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        scheduleId: payload.scheduleId,
        patientId: patient.id,
        videoCallingId,
      },
    });

    // update the slot
    await tx.doctorSchedule.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    return appointment;
  });

  return result;
};

const getMyAppointments = async (user: IRequestUserInterface) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  let appointments = [];

  if (patientData) {
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return appointments;
};

const changeAppointmentStatus = async (
  user: IRequestUserInterface,
  appointmentStatus: AppointmentStatus,
  id: string,
) => {
  // verify patient
  const patient = await prisma.patient.findUnique({
    where: {
      email: user.email,
    },
  });

  // verify doctor
  const doctor = await prisma.doctor.findUnique({
    where: {
      email: user.email,
    },
  });

  // if user not found
  if (!patient && !doctor) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // find appointment
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  // if appointment not found
  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  // if appointment is completed or cancelled
  if (appointment.status === "COMPLETED" || appointment.status === "CANCELED") {
    throw new AppError(
      status.BAD_REQUEST,
      "Completed or Cancelled appointment is not allowed to update",
    );
  }

  let result = {};

  // doctor part
  if (user.role === "DOCTOR") {
    if (user.email !== appointment.doctor.email) {
      throw new AppError(status.BAD_REQUEST, "This is not your appointment!");
    }

    const firstCondition =
      appointment.status === "SCHEDULED" &&
      (appointmentStatus === "INPROGRESS" || appointmentStatus === "CANCELED");
    const secondCondition =
      appointment.status === "INPROGRESS" &&
      (appointmentStatus === "COMPLETED" || appointmentStatus === "CANCELED");

    if (firstCondition || secondCondition) {
      result = await prisma.appointment.update({
        where: {
          id,
        },
        data: {
          status: appointmentStatus,
        },
      });
    }
  } else if (user.role === "PATIENT") {
    // patient part
    if (appointmentStatus === "CANCELED") {
      result = await prisma.appointment.update({
        where: {
          id,
          status: "SCHEDULED",
        },
        data: {
          status: appointmentStatus,
        },
      });
    }
  } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    // admin/super admin part
    result = await prisma.appointment.update({
      where: {
        id,
      },
      data: {
        status: appointmentStatus,
      },
    });
  } else {
    throw new AppError(status.BAD_REQUEST, "Invalid role");
  }

  return result;
};

const getMyAppointment = async (user: IRequestUserInterface, id: string) => {
  // verify patient
  const patient = await prisma.patient.findUnique({
    where: {
      email: user.email,
    },
  });

  // verify doctor
  const doctor = await prisma.doctor.findUnique({
    where: {
      email: user.email,
    },
  });

  // if user not found
  if (!patient && !doctor) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const whereClause: any = { id };

  if (user.role === "PATIENT") {
    whereClause.patientId = user.userId;
  }
  if (user.role === "DOCTOR") {
    whereClause.doctorId = user.userId;
  }

  const result = await prisma.appointment.findUniqueOrThrow({
    where: whereClause,
    include: {
      doctor: true,
      patient: true,
    },
  });

  return result;
};

const getAllAppointments = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Appointment,
    Prisma.AppointmentWhereInput,
    Prisma.AppointmentInclude
  >(prisma.appointment, query, {
    searchableFields: appointmentSearchableFields,
    filterableFields: appointmentFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .pagination()
    .dynamicInclude(appointmentIncludeConfig)
    .sort()
    .execute();

  return result;
};

export const appointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMyAppointment,
  getAllAppointments,
};
