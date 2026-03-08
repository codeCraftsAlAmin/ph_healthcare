import { Prisma } from "../../../generated/prisma/client";

export const doctorScheduleFilterableFields = [
  "id",
  "doctorId",
  "scheduleId",
  "createdAt",
  "updatedAt",
  "isBooked",
  "schedule.startDateTime",
  "schedule.endDateTime",
];
export const doctorScheduleSearchableFields = ["id", "doctorId", "scheduleId"];

export const doctorScheduleIncludeConfig: Partial<
  Record<
    keyof Prisma.DoctorScheduleInclude,
    Prisma.DoctorScheduleInclude[keyof Prisma.DoctorScheduleInclude]
  >
> = {
  doctor: {
    include: {
      user: true,
      appointments: true,
      specialities: true,
    },
  },
  schedule: true,
};
