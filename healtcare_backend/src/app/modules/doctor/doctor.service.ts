import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IUpdateDoctorPayload } from "./doctor.interface";

const getDoctorsHandler = async () => {
  return await prisma.doctor.findMany({
    include: {
      specialities: {
        select: {
          speciality: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
};

const deleteDoctorsHandler = async (doctorId: string) => {
  // find the doctor
  const findDoctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });

  if (!findDoctor) {
    throw new Error("Data not found");
  }

  // soft delete
  await prisma.$transaction(async (tx) => {
    // update at doctor table
    await tx.doctor.update({
      where: {
        id: doctorId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    // update at user table
    await tx.user.update({
      where: {
        id: findDoctor.userId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });
    // delete from session
    await tx.session.deleteMany({
      where: {
        userId: findDoctor.userId,
      },
    });
    // delete doctor speciality
    await tx.doctorSpeciality.deleteMany({
      where: {
        doctorId,
      },
    });
  });
};

const getDoctorByIdHandler = async (doctorId: string) => {
  const result = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: doctorId,
    },
    include: {
      specialities: {
        select: {
          speciality: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const updateDoctorHandler = async (
  doctorId: string,
  payload: IUpdateDoctorPayload,
) => {
  // find doctor
  const findDoctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });

  if (!findDoctor) {
    throw new Error("Doctor not found with this id");
  }

  const { doctor: doctorData, specialites } = payload;

  // update doctor info and specility
  const result = await prisma.$transaction(async (tx) => {
    let updateDoctor;

    if (doctorData) {
      updateDoctor = await tx.doctor.update({
        where: {
          id: doctorId,
        },
        data: {
          ...doctorData,
        },
      });
    }

    // update doctor speciality
    if (specialites && specialites.length > 0) {
      for (const speciality of specialites) {
        const { specialityId, shouldDelete } = speciality;
        if (shouldDelete) {
          await tx.doctorSpeciality.delete({
            where: {
              doctorId_specialityId: {
                doctorId,
                specialityId,
              },
            },
          });
        } else {
          await tx.doctorSpeciality.upsert({
            where: {
              doctorId_specialityId: {
                specialityId,
                doctorId,
              },
            },
            create: {
              doctorId,
              specialityId,
            },
            update: {}, // no need to change anything if realtion already created
          });
        }
      }
    }

    return updateDoctor;
  });

  return result;
};

export const doctorService = {
  getDoctorsHandler,
  deleteDoctorsHandler,
  getDoctorByIdHandler,
  updateDoctorHandler,
};
