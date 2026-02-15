import * as z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const updateDoctorZodSchema = z.object({
  doctor: z.object({
    name: z
      .string("Name must be string")
      .min(5, "Name must be at least 5 characters")
      .max(30, "Name must be at most 30 characters")
      .optional(),
    profilePhoto: z.url("Profile photo must be a valid URL").optional(),
    contactNumber: z
      .string("Contact number must be string")
      .min(11, "Contact number must be at least 11 characters")
      .max(15, "Contact number must be at most 15 characters")
      .optional(),
    experience: z
      .int("Experience must be an integer")
      .nonnegative("Experience cannot be negative")
      .optional(),
    address: z
      .string("Address must be string")
      .min(10, "Address must be at least 10 characters")
      .max(100, "Address must be at most 100 characters")
      .optional(),
    registrationNumber: z
      .string("Registration number must be string")
      .optional(),
    gender: z
      .enum(
        [Gender.MALE, Gender.FEMALE],
        "Gender must be either MALE or FEMALE",
      )
      .optional(),
    appointmentFee: z
      .number("Appointment fee must be a number")
      .nonnegative("Appointment fee cannot be negative")
      .optional(),
    qualification: z
      .string("Qualification must be string")
      .min(2, "Qualification must be at least 2 characters")
      .max(50, "Qualification must be at most 50 characters")
      .optional(),
    currentWorkingplace: z
      .string("Current working place must be string")
      .min(2, "Current working place must be at least 2 characters")
      .max(50, "Current working place must be at most 50 characters")
      .optional(),
    designation: z
      .string("Designation must be string")
      .min(2, "Designation must be at least 2 characters")
      .max(50, "Designation must be at most 50 characters")
      .optional(),
  }),
  specialities: z
    .array(
      z.object({
        specialityId: z.uuid("Specialty ID must be a valid UUID"),
        shouldDelete: z.boolean("shouldDelete must be a boolean").optional(),
      }),
    )
    .optional(),
});
