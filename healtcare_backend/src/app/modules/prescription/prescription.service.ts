import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { createPrescriptionPdf } from "./prescription.utils";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";
import { sendEmail } from "../../utils/email";

const getAllPrescriptions = async () => {};

const myPrescriptions = async () => {};

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
      const fileName = `Prescription-${Date.now()}.pdf`;
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

const updatePrescription = async () => {};

const deletePrescription = async () => {};

export const PrescriptionService = {
  getAllPrescriptions,
  myPrescriptions,
  givePrescription,
  updatePrescription,
  deletePrescription,
};
