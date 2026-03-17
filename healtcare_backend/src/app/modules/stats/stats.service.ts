import status from "http-status";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";

const getDashboardStatsData = async (user: IRequestUserInterface) => {
  let statData;

  switch (user.role) {
    case Role.SUPER_ADMIN:
      statData = await getSuperAdminStatsData();
      break;
    case Role.ADMIN:
      statData = await getAdminStatsData();
      break;
    case Role.DOCTOR:
      statData = await getDoctorStatsData(user);
      break;
    case Role.PATIENT:
      statData = await getPatientStatsData(user);
      break;
    default:
      throw new AppError(status.NOT_FOUND, "Invalid role");
  }

  return statData;
};

const getSuperAdminStatsData = async () => {
  const appointment = await prisma.appointment.count();
  const doctor = await prisma.doctor.count();
  const patient = await prisma.patient.count();
  const admin = await prisma.admin.count();
  const superAdmin = await prisma.superAdmin.count();

  const prescription = await prisma.prescription.count();
  const payment = await prisma.payment.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });
  const user = await prisma.user.count();

  const pieChartData = await getPieChartData();
  const barChartData = await getBarChartData();

  return {
    appointment,
    doctor,
    patient,
    admin,
    superAdmin,
    prescription,
    payment,
    totalRevenue: totalRevenue._sum.amount || 0,
    user,
    pieChartData,
    barChartData,
  };
};
const getAdminStatsData = async () => {
  const appointment = await prisma.appointment.count();
  const doctor = await prisma.doctor.count();
  const patient = await prisma.patient.count();
  const admin = await prisma.admin.count();

  const prescription = await prisma.prescription.count();
  const payment = await prisma.payment.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });
  const user = await prisma.user.count();

  const pieChartData = await getPieChartData();
  const barChartData = await getBarChartData();

  return {
    appointment,
    doctor,
    patient,
    admin,
    prescription,
    payment,
    totalRevenue: totalRevenue._sum.amount || 0,
    user,
    pieChartData,
    barChartData,
  };
};

const getDoctorStatsData = async (user: IRequestUserInterface) => {
  // find the doctor first
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const review = await prisma.review.count({
    where: {
      doctorId: doctorData.id,
    },
  });

  const patientCount = await prisma.appointment.groupBy({
    by: ["patientId"],
    where: {
      doctorId: doctorData.id,
    },
    _count: {
      id: true,
    },
  });

  //   const formattedPatientCount = patientCount.map((item) => item._count.id);

  const appointment = await prisma.appointment.count({
    where: {
      doctorId: doctorData.id,
    },
  });

  const payment = await prisma.payment.count();

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      appointment: {
        doctorId: doctorData.id,
      },
      status: PaymentStatus.PAID,
    },
  });

  const appointmentStaus = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      doctorId: doctorData.id,
    },
    _count: {
      id: true,
    },
  });

  const formattedAppointmentStatus = appointmentStaus.map((item) => ({
    status: item.status,
    count: item._count.id,
  }));

  const prescription = await prisma.prescription.count({
    where: {
      appointment: {
        doctorId: doctorData.id,
      },
    },
  });

  return {
    appointment,
    prescription,
    payment,
    totalRevenue: totalRevenue._sum.amount || 0,
    review,
    patientCount: patientCount.length,
    appointmentStatus: formattedAppointmentStatus,
  };
};
const getPatientStatsData = async (user: IRequestUserInterface) => {
  // find the patient first
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const review = await prisma.review.count({
    where: {
      patientId: patientData.id,
    },
  });

  const appointment = await prisma.appointment.count({
    where: {
      patientId: patientData.id,
    },
  });

  const appointmentStatus = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      patientId: patientData.id,
    },
    _count: {
      id: true,
    },
  });

  const formattedAppointmentStatus = appointmentStatus.map((item) => ({
    status: item.status,
    count: item._count.id,
  }));

  return {
    appointment,
    appointmentStatus: formattedAppointmentStatus,
    review,
  };
};

const getPieChartData = async () => {
  const appointment = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  const formattedAppointmentStatus = appointment.map((item) => ({
    status: item.status,
    count: item._count.id,
  }));

  return {
    appointmentStatus: formattedAppointmentStatus,
  };
};

const getBarChartData = async () => {
  interface AppointmentCountByMonth {
    month: Date;
    count: bigint;
  }

  const appointmentCountByMonth: AppointmentCountByMonth[] =
    await prisma.$queryRaw`
    SELECT DATE_TRUNC('month', "createdAt") AS month,
    CAST(COUNT(*) AS INTEGER) AS count
    FROM "appointments"
    GROUP BY month
    ORDER BY month ASC;
  `;

  return appointmentCountByMonth;
};

export const StatsService = {
  getDashboardStatsData,
};
