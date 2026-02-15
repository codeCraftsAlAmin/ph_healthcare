import { prisma } from "../../lib/prisma";

const getSpecialitiesHandler = async () => {
  return await prisma.speciality.findMany();
};

const createSpecialitiesHandler = async (title: string) => {
  const findTitle = await prisma.speciality.findUnique({
    where: {
      title,
    },
  });

  if (findTitle) {
    throw new Error(`Title with this name: ${title} already exists in DB`);
  }

  const result = await prisma.speciality.create({
    data: {
      title: title,
    },
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
