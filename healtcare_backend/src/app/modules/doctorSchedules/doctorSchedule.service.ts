import { DoctorSchedule, Prisma } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interface/query.interface";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  doctorScheduleFilterableFields,
  doctorScheduleIncludeConfig,
  doctorScheduleSearchableFields,
} from "./doctorSchedule.constant";
import {
  ICreateDoctorSchedulePayload,
  IUpdateDoctorSchedulePayload,
} from "./doctorSchedule.interface";

const createDoctorSchedule = async (
  payload: ICreateDoctorSchedulePayload,
  user: IRequestUserInterface,
) => {
  // find the doctor
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
  });

  const doctorScheudleData = payload.scheduleIds.map((scheduleId) => ({
    doctorId: doctor.id,
    scheduleId,
  }));

  // create schedule
  await prisma.doctorSchedule.createMany({
    data: doctorScheudleData,
  });

  // find user
  const result = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: doctor.id,
      scheduleId: {
        in: payload.scheduleIds,
      },
    },
    include: {
      schedule: true,
    },
  });

  return result;
};

const updateDoctorSchedule = async (
  user: IRequestUserInterface,
  payload: IUpdateDoctorSchedulePayload,
) => {
  // find doctor
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const deletedIds = payload.scheduleIds
    .filter((item) => item.shouldDelete)
    .map((item) => item.id);

  const createIds = payload.scheduleIds
    .filter((item) => !item.shouldDelete)
    .map((item) => item.id);

  const result = await prisma.$transaction(async (tx) => {
    // delete prev data
    await tx.doctorSchedule.deleteMany({
      where: {
        isBooked: false,
        doctorId: doctorData.id,
        scheduleId: {
          in: deletedIds,
        },
      },
    });

    // create new data
    const doctorScheduleData = createIds.map((scheduleId) => ({
      doctorId: doctorData.id,
      scheduleId,
    }));

    const result = await tx.doctorSchedule.createMany({
      data: doctorScheduleData,
    });

    return result;
  });

  return result;
};

const deleteDoctorSchedule = async (
  id: string,
  user: IRequestUserInterface,
) => {
  // find user
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // delete schedule
  await prisma.doctorSchedule.deleteMany({
    where: {
      isBooked: false,
      doctorId: doctor.id,
      scheduleId: id,
    },
  });
};

const getAllDoctorSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    DoctorSchedule,
    Prisma.DoctorScheduleWhereInput,
    Prisma.DoctorScheduleInclude
  >(prisma.doctorSchedule, query, {
    searchableFields: doctorScheduleFilterableFields,
    filterableFields: doctorScheduleFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .pagination()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .execute();

  return result;
};

const getDoctorSchedulesById = async (doctorId: string, scheduleId: string) => {
  const result = await prisma.doctorSchedule.findUnique({
    where: {
      doctorId_scheduleId: {
        doctorId,
        scheduleId,
      },
    },
    include: {
      schedule: true,
    },
  });

  return result;
};

const getMyDoctorSchedules = async (
  user: IRequestUserInterface,
  query: IQueryParams,
) => {
  // find doctor
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const queryBuilder = new QueryBuilder<
    DoctorSchedule,
    Prisma.DoctorScheduleWhereInput,
    Prisma.DoctorScheduleInclude
  >(
    prisma.doctorSchedule,
    {
      // each query must have doctor id
      doctorId: doctorData.id,
      ...query,
    },
    {
      searchableFields: doctorScheduleSearchableFields,
      filterableFields: doctorScheduleFilterableFields,
    },
  );

  const result = await queryBuilder
    .search()
    .filter()
    .pagination()
    .include({
      schedule: true,
      doctor: {
        include: {
          user: true,
        },
      },
    })
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .execute();

  return result;
};

export const doctorScheduleService = {
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule,
  getAllDoctorSchedules,
  getDoctorSchedulesById,
  getMyDoctorSchedules,
};
