import status from "http-status";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { prisma } from "../../lib/prisma";
import { ICreateReview, IUpdateReview } from "./review.interface";

const createReview = async (
  payload: ICreateReview,
  user: IRequestUserInterface,
) => {
  // find patient data
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // find appointment data
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
  });

  // unpaid user isn't allowed to review
  if (appointmentData.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Unpaid user isn't allowed to review",
    );
  }
  // own review
  if (appointmentData.patientId !== patientData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can't review other's appointment",
    );
  }

  // find if the review already exists or not
  const existingReview = await prisma.review.findFirst({
    where: {
      appointmentId: payload.appointmentId,
    },
  });

  if (existingReview) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already reviewed this appointment",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // create review
    const review = await tx.review.create({
      data: {
        ...payload,
        patientId: patientData.id,
        doctorId: appointmentData.doctorId,
      },
    });

    // handle avarage rating
    const avgRating = await tx.review.aggregate({
      where: {
        doctorId: appointmentData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    // update doctor's average rating
    await tx.doctor.update({
      where: {
        id: appointmentData.doctorId,
      },
      data: {
        averageRating: avgRating._avg.rating as number,
      },
    });

    return review;
  });

  return result;
};

const getAllReviews = async () => {
  const result = await prisma.review.findMany({
    include: {
      patient: true,
      doctor: true,
      appointment: true,
    },
  });
  return result;
};

const getMyReviews = async (user: IRequestUserInterface) => {
  // find user
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // doctor review
  if (userData.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });
    const result = await prisma.review.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
    return result;
  }
  // patient review
  if (userData.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });
    const result = await prisma.review.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        appointment: true,
      },
    });
    return result;
  }
};

const updateReview = async (
  id: string,
  payload: IUpdateReview,
  user: IRequestUserInterface,
) => {
  // find the user
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // find review
  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // check if the user is the owner of the review
  if (reviewData.patientId !== patientData.id) {
    throw new AppError(status.BAD_REQUEST, "You can't update other's review");
  }

  // update review
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: {
        id,
      },
      data: payload,
    });

    // handle avarage rating
    const avgRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    // update doctor's average rating
    await tx.doctor.update({
      where: {
        id: reviewData.doctorId,
      },
      data: {
        averageRating: avgRating._avg.rating as number,
      },
    });

    return review;
  });
  return result;
};

const deleteReview = async (id: string, user: IRequestUserInterface) => {
  // find the user
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  // find review
  const reviewData = await prisma.review.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // check if the user is the owner of the review
  if (reviewData.patientId !== patientData.id) {
    throw new AppError(status.BAD_REQUEST, "You can't delete other's review");
  }

  // delete review
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.delete({
      where: {
        id,
      },
    });

    // handle avarage rating
    const avgRating = await tx.review.aggregate({
      where: {
        doctorId: reviewData.doctorId,
      },
      _avg: {
        rating: true,
      },
    });

    // update doctor's average rating
    await tx.doctor.update({
      where: {
        id: reviewData.doctorId,
      },
      data: {
        averageRating: avgRating._avg.rating as number,
      },
    });

    return review;
  });
  return result;
};

export const reviewService = {
  createReview,
  getAllReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
