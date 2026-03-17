import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import {
  ICreatePrescriptionPayload,
  IUpdatePrescriptionPayload,
} from "./prescription.interface";
import { createPrescriptionPdf } from "./prescription.utils";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../config/cloudinary.config";
import { sendEmail } from "../../utils/email";
import { Role } from "../../../generated/prisma/enums";

const getAllPrescriptions = async () => {
  const prescriptions = await prisma.prescription.findMany({
    include: {
      patient: true,
      doctor: true,
      appointment: true,
    },
  });
  return prescriptions;
};

const myPrescriptions = async (user: IRequestUserInterface) => {
  // check if user exists
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  let prescriptions = {};
  // show doctor data
  if (userData.role === Role.DOCTOR) {
    prescriptions = await prisma.prescription.findMany({
      where: {
        doctor: {
          email: userData.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
  }
  // show patient data
  if (userData.role === Role.PATIENT) {
    prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          email: userData.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
  }
  return prescriptions;
};

const givePrescription = async (
  user: IRequestUserInterface,
  payload: ICreatePrescriptionPayload,
) => {
  // find doctor data
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
    include: {
      specialities: true,
    },
  });

  // find appointment data
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          specialities: true,
        },
      },
      schedule: {
        include: {
          doctorSchedules: true,
        },
      },
    },
  });

  // check if appointment belongs to the doctor
  if (appointmentData.doctorId !== doctorData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "Appointment does not belong to the doctor",
    );
  }

  // check if appointment is already given
  const isGiven = await prisma.prescription.findUnique({
    where: {
      appointmentId: payload.appointmentId,
    },
  });

  if (isGiven) {
    throw new AppError(status.BAD_REQUEST, "Appointment is already given");
  }

  // hanlde date
  const followUpDate = new Date(payload.followUpDate);

  const result = await prisma.$transaction(
    async (tx) => {
      // create prescription
      const prescription = await tx.prescription.create({
        data: {
          ...payload,
          followUpDate,
          doctorId: doctorData.id,
          patientId: appointmentData.patientId,
        },
      });
      // create pdf of prescription
      const pdfBuffer = await createPrescriptionPdf({
        doctorName: doctorData.name,
        patientName: appointmentData.patient.name,
        appointmentDate: appointmentData.schedule.startDateTime,
        instructions: payload.instructions,
        followUpDate,
        doctorEmail: doctorData.email,
        patientEmail: appointmentData.patient.email,
        prescriptionId: prescription.id,
        createdAt: new Date(),
      });

      // upload to cloudinary
      const fileName = `prescription-${Date.now()}.pdf`;
      const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
      const pdfUrl = uploadedFile.secure_url;

      // update prescription
      const updatePrescription = await tx.prescription.update({
        where: {
          id: prescription.id,
        },
        data: {
          pdfUrl,
        },
      });

      // send email to patient
      try {
        await sendEmail({
          to: appointmentData.patient.email,
          subject: `You have received a new prescription from Dr. ${doctorData.name}`,
          templateName: "prescription",
          templateData: {
            doctorName: doctorData.name,
            patientName: appointmentData.patient.name,
            specialization: doctorData.specialities
              .map((s: any) => s.title)
              .join(", "),
            appointmentDate: new Date(
              appointmentData.schedule.startDateTime,
            ).toLocaleString(),
            instructions: payload.instructions,
            followUpDate: followUpDate.toLocaleString(),
            prescriptionId: prescription.id,
            issueDate: new Date().toLocaleString(),
            pdfUrl,
          },
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (error) {
        console.log(
          "Failed To send email notification for prescription",
          error,
        );
      }

      return updatePrescription;
    },
    {
      maxWait: 15000,
      timeout: 20000,
    },
  );

  return result;
};

const updatePrescription = async (
  user: IRequestUserInterface,
  id: string,
  payload: IUpdatePrescriptionPayload,
) => {
  // find user
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // find prescription
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });

  // check if prescription belongs to the user
  if (prescriptionData.doctorId !== userData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "Prescription does not belong to the user",
    );
  }

  // generate new pdf with updated data
  const pdfBuffer = await createPrescriptionPdf({
    doctorName: prescriptionData.doctor.name,
    patientName: prescriptionData.patient.name,
    doctorEmail: prescriptionData.doctor.email,
    patientEmail: prescriptionData.patient.email,
    appointmentDate: prescriptionData.appointment.schedule.startDateTime,
    instructions: payload.instructions || prescriptionData.instructions,
    followUpDate: payload.followUpDate
      ? new Date(payload.followUpDate)
      : prescriptionData.followUpDate,

    prescriptionId: prescriptionData.id,
    createdAt: prescriptionData.createdAt,
  });

  // upload to cloudinary
  const fileName = `prescription-${Date.now()}.pdf`;
  const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
  const newPdfUrl = uploadedFile.secure_url;

  // delete old pdf
  if (prescriptionData.pdfUrl) {
    await deleteFileFromCloudinary(prescriptionData.pdfUrl);
  }

  const updatedInstructions =
    payload.instructions || prescriptionData.instructions;
  const updatedFollowUpDate = payload.followUpDate
    ? new Date(payload.followUpDate)
    : prescriptionData.followUpDate;

  // update prescription
  const result = await prisma.prescription.update({
    where: {
      id,
    },
    data: {
      instructions: updatedInstructions,
      followUpDate: updatedFollowUpDate,
      pdfUrl: newPdfUrl,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });

  // send email to patient
  try {
    await sendEmail({
      to: result.patient.email,
      subject: `You have received a new prescription from Dr. ${userData.name}`,
      templateName: "prescription",
      templateData: {
        doctorName: result.doctor.name,
        patientName: result.patient.name,
        specialization: "Healthcare Provider",
        appointmentDate: new Date(
          result.appointment.schedule.startDateTime,
        ).toLocaleString(),
        instructions: payload.instructions,
        followUpDate: result.followUpDate.toLocaleString(),
        prescriptionId: result.id,
        issueDate: new Date().toLocaleString(),
        pdfUrl: newPdfUrl,
      },
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    console.log("Failed To send email notification for prescription", error);
  }

  return result;
};

const deletePrescription = async (id: string, user: IRequestUserInterface) => {
  // find user
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // find prescription
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // check if prescription belongs to the user
  if (prescriptionData.doctorId !== userData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "Prescription does not belong to the user",
    );
  }

  // delete file from cloudinary
  if (prescriptionData.pdfUrl) {
    await deleteFileFromCloudinary(prescriptionData.pdfUrl);
  }

  // delete prescription
  const result = await prisma.prescription.delete({
    where: {
      id,
      doctorId: userData.id,
    },
  });

  return result;
};

export const PrescriptionService = {
  getAllPrescriptions,
  myPrescriptions,
  givePrescription,
  updatePrescription,
  deletePrescription,
};
