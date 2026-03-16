import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import {
  IPatientHealthDataInterface,
  IUpdatePatientProfilePayload,
} from "./patient.interface";
import { convertDateTime } from "./patient.utils";

const updateMyProfile = async (
  user: IRequestUserInterface,
  payload: IUpdatePatientProfilePayload,
) => {
  // verify patient
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
    include: {
      patientHealthData: true,
      medicalReports: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    // update profile
    if (payload.patientInfo) {
      await tx.patient.update({
        where: {
          id: patientData.id,
        },
        data: { ...payload.patientInfo },
      });

      if (payload.patientInfo.profilePhoto || payload.patientInfo.name) {
        const userData = {
          name: payload.patientInfo.name
            ? payload.patientInfo.name
            : patientData.name,
          image: payload.patientInfo.profilePhoto
            ? payload.patientInfo.profilePhoto
            : patientData.profilePhoto,
        };
        await tx.user.update({
          where: {
            id: patientData.userId,
          },
          data: {
            ...userData,
          },
        });
      }
    }

    // update health data
    if (payload.patientHealthData) {
      const healthDataToSave: IPatientHealthDataInterface = {
        ...payload.patientHealthData,
      };

      if (payload.patientHealthData.dateOfBirth) {
        healthDataToSave.dateOfBirth = convertDateTime(
          typeof healthDataToSave.dateOfBirth === "string"
            ? healthDataToSave.dateOfBirth
            : undefined,
        ) as Date;
      }

      await tx.patientHealthData.upsert({
        where: {
          patientId: patientData.id,
        },
        update: healthDataToSave,
        create: { patientId: patientData.id, ...healthDataToSave },
      });
    }

    // update/remove medical report
    if (
      payload.medicalReport &&
      Array.isArray(payload.medicalReport) &&
      payload.medicalReport.length > 0
    ) {
      for (const report of payload.medicalReport) {
        if (report.shouldDelete && report.reportId) {
          const deleteReport = await tx.medicalReport.delete({
            where: {
              id: report.reportId,
            },
          });

          if (deleteReport) {
            await deleteFileFromCloudinary(deleteReport.reportLink);
          }
        } else if (report.reportName && report.reportLink) {
          await tx.medicalReport.create({
            data: {
              patientId: patientData.id,
              reportName: report.reportName,
              reportLink: report.reportLink,
            },
          });
        }
      }
    }
  });

  // return update result
  const result = await prisma.patient.findUnique({
    where: {
      id: patientData.id,
    },
    include: {
      user: true,
      patientHealthData: true,
      medicalReports: true,
    },
  });

  return result;
};

export const PatientService = {
  updateMyProfile,
};
