import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { Speciality } from "../../../generated/prisma/client";

const getSpecialitiesHandler = async () => {
  return await prisma.speciality.findMany();
};

const createSpecialitiesHandler = async (
  payload: Speciality,
): Promise<Speciality> => {
  const { title } = payload;

  const findTitle = await prisma.speciality.findUnique({
    where: {
      title,
    },
  });

  if (findTitle) {
    throw new AppError(
      status.CONFLICT,
      `Title with this name: ${title} already exists in DB`,
    );
  }

  const result = await prisma.speciality.create({
    data: payload,
  });

  return result;
};

const deleteSpecialityHandler = async (id: string) => {
  await prisma.speciality.delete({
    where: {
      id,
    },
  });
};

export const specialityService = {
  getSpecialitiesHandler,
  createSpecialitiesHandler,
  deleteSpecialityHandler,
};
