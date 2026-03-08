import { Prisma } from "../../../generated/prisma/client";

export const appointmentFilterableFields = [
  "id",
  "patientId",
  "doctorId",
  "scheduleId",
  "status",
  "createdAt",
];
export const appointmentSearchableFields = ["id", "patientId", "doctorId"];

export const appointmentIncludeConfig: Partial<
  Record<
    keyof Prisma.AppointmentInclude,
    Prisma.AppointmentInclude[keyof Prisma.AppointmentInclude]
  >
> = {
  patient: {
    include: {
      user: true,
    },
  },
  doctor: {
    include: {
      user: true,
      specialities: true,
    },
  },
  schedule: true,
};
