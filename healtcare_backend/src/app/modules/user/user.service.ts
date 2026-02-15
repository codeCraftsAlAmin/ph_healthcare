import { Speciality } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ICreateDoctorPayload } from "./user.interface";

const createDoctorHandler = async (payload: ICreateDoctorPayload) => {
  const specialities: Speciality[] = [];

  // check if speciality exists -- this is not necessary yet, you should register first
  for (const specialityId of payload.specialities) {
    const speciality = await prisma.speciality.findUnique({
      where: {
        id: specialityId,
      },
    });

    if (!speciality) {
      throw new Error(`Specialty with id ${specialityId} not found`);
    }
    specialities.push(speciality); // without this your specialities will always be empty
  }

  // check if user exists
  const existUser = await prisma.user.findUnique({
    where: {
      email: payload.doctor.email,
    },
  });

  if (existUser) {
    throw new Error("User with this email already exists");
  }

  // register docoto as a user
  const userData = await auth.api.signUpEmail({
    body: {
      name: payload.doctor.name,
      email: payload.doctor.email,
      password: payload.password,
      role: Role.DOCTOR,
      needPasswordChange: true,
    },
  });

  // create doctor profile
  try {
    const doctorProfile = await prisma.$transaction(async (tx) => {
      const createDoctor = await tx.doctor.create({
        data: {
          userId: userData.user.id,
          ...payload.doctor,
        },
      });

      // create doctor speciality -- find out the speciality first
      const doctorSpecilaityData = specialities.map((speciality) => {
        return {
          doctorId: createDoctor.id,
          specialityId: speciality.id,
        };
      });

      await tx.doctorSpeciality.createMany({
        data: doctorSpecilaityData,
      });

      // return doctor data
      const doctorInfo = await tx.doctor.findUnique({
        where: {
          id: createDoctor.id,
        },
        include: {
          user: true,
          specialities: {
            include: {
              speciality: true,
            },
          },
        },
      });

      return doctorInfo;
    });

    return doctorProfile;
  } catch (error) {
    await prisma.user.delete({
      where: {
        id: userData.user.id,
      },
    });
    throw error;
  }
};

export const userService = {
  createDoctorHandler,
};
