import { Prisma } from "../../../generated/prisma/client";

const doctorSearchedFields = [
  "name",
  "email",
  "qualification",
  "designation",
  "currentWorkingplace",
  "registrationNumber",
  "specialities.speciality.title",
];

const doctorFilterableFields = [
  "gender",
  "isDeleted",
  "appointmentFee",
  "experience",
  "registrationNumber",
  "specialities.specialityId",
  "currentWorkingplace",
  "designation",
  "qualification",
  "specialities.speciality.title",
  "user.role",
];

const doctorIncludingConfig: Partial<
  Record<
    keyof Prisma.DoctorInclude,
    Prisma.DoctorInclude[keyof Prisma.DoctorInclude]
  >
> = {
  user: true,
  specialities: {
    include: {
      speciality: true,
    },
  },
  appointments: {
    include: {
      patient: true,
      doctor: true,
    },
  },
  doctorSchedules: {
    include: {
      schedule: true,
    },
  },

  prescriptions: true,
  reviews: true,
};
export { doctorFilterableFields, doctorSearchedFields, doctorIncludingConfig };
