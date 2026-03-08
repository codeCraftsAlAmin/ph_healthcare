import { addHours, addMinutes, format } from "date-fns";
import { ICreateSchedule, IUpdateSchedule } from "./schedule.interface";
import { convertDateTime } from "./timeZone.utils";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interface/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Prisma, Schedule } from "../../../generated/prisma/client";
import {
  scheduleFilterableFields,
  ScheduleIncludingConflig,
  scheduleSearchableFields,
} from "./schedule.constant";

const createScheduleHandler = async (payload: ICreateSchedule) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const interval = 30;
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  const schedules = [];

  // create schedule before the last date
  while (currentDate <= lastDate) {
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(startTime.split(":")[0]),
        ),
        Number(startTime.split(":")[1]),
      ),
    );

    const endDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(endTime.split(":")[0]),
        ),
        Number(endTime.split(":")[1]),
      ),
    );

    while (startDateTime < endDateTime) {
      // convert date time to UTC
      const s = await convertDateTime(startDateTime);
      const e = await convertDateTime(addMinutes(startDateTime, interval));

      const scheduleData = {
        startDateTime: s,
        endDateTime: e,
      };

      const existSchedule = await prisma.schedule.findFirst({
        where: {
          startDateTime: scheduleData.startDateTime,
          endDateTime: scheduleData.endDateTime,
        },
      });

      if (!existSchedule) {
        const result = await prisma.schedule.create({
          data: scheduleData,
        });

        // console.log("Schedule result created 🎉", result);

        schedules.push(result);
      }

      startDateTime.setMinutes(startDateTime.getMinutes() + interval);
    }

    // stop the loop when currentDate is greater than lastDate
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};
const getSchedulesHandler = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Schedule,
    Prisma.ScheduleWhereInput,
    Prisma.ScheduleInclude
  >(prisma.schedule, query, {
    searchableFields: scheduleSearchableFields,
    filterableFields: scheduleFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .sort()
    .pagination()
    .dynamicInclude(ScheduleIncludingConflig)
    .fields()
    .execute();

  return result;
};
const getScheduleByIdHandler = async (id: string) => {
  const result = await prisma.schedule.findUnique({
    where: {
      id,
    },
  });
  return result;
};
const deleteScheduleHandler = async (id: string) => {
  await prisma.schedule.delete({
    where: {
      id,
    },
  });
};
const updateScheduleHandler = async (id: string, payload: IUpdateSchedule) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const startDateTime = new Date(
    addMinutes(
      addHours(
        `${format(startDate, "yyyy-MM-dd")}`,
        Number(startTime.split(":")[0]),
      ),
      Number(startTime.split(":")[1]),
    ),
  );

  const endDateTime = new Date(
    addMinutes(
      addHours(
        `${format(endDate, "yyyy-MM-dd")}`,
        Number(endTime.split(":")[0]),
      ),
      Number(endTime.split(":")[1]),
    ),
  );

  const updateSchedule = await prisma.schedule.update({
    where: {
      id,
    },
    data: {
      startDateTime,
      endDateTime,
    },
  });
  return updateSchedule;
};

export const schedulesService = {
  createScheduleHandler,
  getSchedulesHandler,
  getScheduleByIdHandler,
  deleteScheduleHandler,
  updateScheduleHandler,
};
