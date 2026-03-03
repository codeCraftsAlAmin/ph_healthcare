import status from "http-status";
import { Speciality } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  ICreateAdminPayload,
  ICreateDoctorPayload,
  ICreateSuperAdminPayload,
} from "./user.interface";

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
      throw new AppError(
        status.NOT_FOUND,
        `Specialty with id ${specialityId} not found`,
      );
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
    throw new AppError(status.CONFLICT, "User with this email already exists");
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

const createAdminHandler = async (payload: ICreateAdminPayload) => {
  // find the user first
  const findUser = await prisma.user.findUnique({
    where: {
      email: payload.admin.email,
    },
  });

  if (findUser) {
    throw new AppError(status.CONFLICT, "User with this email already exists");
  }

  // create user data
  const userData = await auth.api.signUpEmail({
    body: {
      name: payload.admin.name,
      email: payload.admin.email,
      password: payload.password,
      role: Role.ADMIN,
      needPasswordChange: true,
    },
  });

  // create admin data
  try {
    const adminData = await prisma.$transaction(async (tx) => {
      const createAdmin = await tx.admin.create({
        data: {
          userId: userData.user.id,
          ...payload.admin,
        },
      });

      // return admin data
      const adminInfor = await tx.admin.findUnique({
        where: {
          id: createAdmin.id,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });

      return adminInfor;
    });
    return adminData;
  } catch (error: any) {
    await prisma.user.delete({
      where: {
        id: userData.user.id,
      },
    });
    throw error;
  }
};

const createSuperAdminHandler = async (payload: ICreateSuperAdminPayload) => {
  // find the super admin
  const findSuperAdmin = await prisma.user.findUnique({
    where: {
      email: payload.super_admin.email,
    },
  });

  if (findSuperAdmin) {
    throw new AppError(
      status.CONFLICT,
      "Super admin with this email already exists",
    );
  }

  // create super admin
  const userData = await auth.api.signUpEmail({
    body: {
      name: payload.super_admin.name,
      email: payload.super_admin.email,
      password: payload.password,
      role: Role.SUPER_ADMIN,
      needPasswordChange: true,
    },
  });

  // create super admin data
  try {
    const superAdminData = await prisma.$transaction(async (tx) => {
      const createSuperAdmin = await tx.superAdmin.create({
        data: {
          userId: userData.user.id,
          ...payload.super_admin,
        },
      });

      // return super admin data
      const superAdminInfo = await tx.superAdmin.findUnique({
        where: {
          id: createSuperAdmin.id,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });

      return superAdminInfo;
    });
    return superAdminData;
  } catch (error: any) {
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
  createAdminHandler,
  createSuperAdminHandler,
};
