import { z } from "zod";

export const createPrescriptionZodSchema = z.object({
  appointmentId: z.string("Appointment ID is required"),
  instructions: z
    .string("Instructions is required")
    .min(1, "Instructions can not be empty"),
  followUpDate: z.string("Follow-up date must be a valid date").optional(),
});

export const updatePrescriptionZodSchema = z.object({
  followUpDate: z.string("Follow-up date must be a valid date").optional(),
  instructions: z
    .string("Instructions is required")
    .min(1, "Instructions can not be empty")
    .optional(),
});

export const PrescriptionValidation = {
  createPrescriptionZodSchema,
  updatePrescriptionZodSchema,
};
