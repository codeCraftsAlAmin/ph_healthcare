import z from "zod";
import { BloodGroup, Gender } from "../../../generated/prisma/enums";

const updatePatientProfileZodSchema = z.object({
  // profile info
  patientInfo: z
    .object({
      name: z
        .string("Name must be a string")
        .min(3, "Name must be at least 3 characters long")
        .max(100, "Name must be at most 100 characters long")
        .optional(),
      contactNumber: z
        .string("Contact number must be a string")
        .min(11, "Contact number must be at least 11 digits long")
        .max(11, "Contact number must be at most 11 digits long")
        .optional(),
      profilePhoto: z.url("Profile photo must be a valid URL").optional(),
      address: z
        .string("Address must be a string")
        .min(1, "Address is required")
        .max(100, "Address must be at most 100 characters long")
        .optional(),
    })
    .optional(),

  // health data
  patientHealthData: z
    .object({
      gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
      dateOfBirth: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "Invalid date of birth",
        })
        .optional(),
      bloodGroup: z
        .enum([
          BloodGroup.AB_NEGATIVE,
          BloodGroup.AB_POSITIVE,
          BloodGroup.A_NEGATIVE,
          BloodGroup.A_POSITIVE,
          BloodGroup.B_NEGATIVE,
          BloodGroup.B_POSITIVE,
          BloodGroup.O_NEGATIVE,
          BloodGroup.O_POSITIVE,
        ])
        .optional(),
      hasAllergies: z.boolean().optional(),
      hasDiabetes: z.boolean().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      smokingStatus: z.boolean().optional(),
      dietaryPreferences: z.string().optional(),
      pregnancyStatus: z.boolean().optional(),
      mentalHealthHistory: z.string().optional(),
      immunizationStatus: z.string().optional(),
      hasPastSurgeries: z.boolean().optional(),
      recentAnxiety: z.boolean().optional(),
      recentDepression: z.boolean().optional(),
      maritalStatus: z.string().optional(),
    })
    .optional(),

  // medical report
  medicalReport: z
    .array(
      z.object({
        reportName: z.string().optional(),
        reportLink: z.url().optional(),
        shouldDelete: z.boolean().optional(),
        reportId: z.uuid().optional(),
      }),
    )
    .optional()
    .refine(
      (reports) => {
        if (!reports || reports.length === 0) return true;

        for (const report of reports) {
          if (report.shouldDelete === true && !report.reportId) {
            return false; // If shouldDelete is true, reportId must be provided
          }

          if (!report.shouldDelete && report.reportId) {
            return false; // If reportId is provided, shouldDelete must be true
          }

          if (report.reportName && !report.reportLink) {
            return false; // If reportName is provided, reportLink must be provided
          }

          if (!report.reportName && report.reportLink) {
            return false; // If reportLink is provided, reportName must be provided
          }
          return true; // If none of the above conditions are violated, it's valid
        }
      },
      {
        message:
          "Invalid medical report data. If shouldDelete is true, reportId must be provided. If reportId is provided, shouldDelete must be true. If reportName is provided, reportLink must also be provided and vice versa.",
      },
    ),
});

export const PatientValidation = {
  updatePatientProfileZodSchema,
};
