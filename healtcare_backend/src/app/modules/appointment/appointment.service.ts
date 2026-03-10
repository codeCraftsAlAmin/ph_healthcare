import { uuidv7 } from "zod";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import {
  IBookAppointment,
  IUpdateAppointmentPayload,
} from "./appointment.interface";
import {
  AppointmentStatus,
  PaymentStatus,
} from "../../../generated/prisma/enums";
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
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

// paynow integration
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
  const doctor = await prisma.doctor.findUniqueOrThrow({
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

    // TODO : Payment Integration will be here
    const transactionId = String(uuidv7());

    // create payment data
    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        transactionId,
        amount: doctor.appointmentFee,
      },
    });

    // create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with Dr. ${doctor.name}`,
            },
            unit_amount: doctor.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointment.id,
        patientId: patient.id,
      },

      success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,
      cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
    });

    return {
      appointment,
      paymentData,
      paymentUrl: session.url,
    };
  });

  return {
    appointment: result.appointment,
    paymentData: result.paymentData,
    paymentUrl: result.paymentUrl,
  };
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

// paylater integration => create record of payment wihtout payment
const bookAppointmentWithPaylater = async (
  payload: IUpdateAppointmentPayload,
  user: IRequestUserInterface,
) => {
  // find user
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user.email,
    },
  });

  // find doctor
  const doctorData = await prisma.doctor.findUnique({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  // find schedule
  const scheduleData = await prisma.schedule.findUnique({
    where: {
      id: payload.scheduleId,
    },
  });

  if (!patientData || !doctorData || !scheduleData) {
    throw new AppError(status.NOT_FOUND, "Data not found");
  }

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    // create appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
        videoCallingId,
      },
    });

    // update doctor schedule
    await tx.doctorSchedule.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: scheduleData.id,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = String(uuidv7());
    // create payment
    const payment = await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        transactionId,
        amount: doctorData.appointmentFee,
      },
    });

    return {
      appointment,
      payment,
    };
  });

  return {
    appointment: result.appointment,
    payment: result.payment,
  };
};

// initiate payment => to pay unpaid for unpaid appointment
const initiatePayment = async (
  appointmentId: string,
  user: IRequestUserInterface,
) => {
  // find paitient
  const patientData = await prisma.patient.findFirstOrThrow({
    where: {
      email: user.email,
    },
  });

  // find appointment
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  if (!appointmentData) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  if (!appointmentData.payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found");
  }

  if (appointmentData.payment?.status === PaymentStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Payment already completed");
  }

  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(status.BAD_REQUEST, "Appointment already cancelled");
  }

  // create session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointmentData.id,
      patientId: patientData.id,
    },

    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
  });

  return {
    paymentUrl: session.url
  }
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMyAppointment,
  getAllAppointments,
  bookAppointmentWithPaylater,
  initiatePayment,
};
