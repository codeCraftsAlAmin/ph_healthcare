import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
  IChangeUserRolePayload,
  IChangeUserStatusPayload,
  IUpdateAdminPayload,
} from "./admin.interface";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";

const getAdminsHandler = async () => {
  const admins = await prisma.admin.findMany({ include: { user: true } });

  return admins;
};

const getAdminByIdHandler = async (adminId: string) => {
  const findAdmin = await prisma.admin.findUniqueOrThrow({
    where: { id: adminId },
  });

  return findAdmin;
};

const updateAdminHandler = async (
  adminId: string,
  payload: IUpdateAdminPayload,
) => {
  // find the admin first
  const findAdmin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!findAdmin) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  // update admin data
  const updateAdmin = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: {
        id: adminId,
      },
      data: {
        ...payload.admin,
      },
    });

    // update user data
    await tx.user.update({
      where: {
        id: findAdmin.userId,
      },
      data: {
        name: payload.admin.name,
      },
    });

    // return admin id
    const adminData = await tx.admin.findUnique({
      where: { id: adminId },
    });
    return adminData;
  });

  return updateAdmin;
};

const deleteAdminHandler = async (
  adminId: string,
  user: IRequestUserInterface,
) => {
  // find the admin first
  const findAdmin = await prisma.admin.findUniqueOrThrow({
    where: { id: adminId },
  });

  if (!findAdmin) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  if (findAdmin.id === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You can't delete yourself");
  }
  // soft delete
  const deletedResult = await prisma.$transaction(async (tx) => {
    // update isDeleted status at admin table
    await tx.admin.update({
      where: {
        id: adminId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // update isDeleted status at user table
    await tx.user.update({
      where: {
        id: findAdmin.userId,
      },
      data: {
        isDeleted: true,
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    // delete session data
    await tx.session.deleteMany({
      where: {
        userId: findAdmin.userId,
      },
    });

    // delete acccount data
    await tx.account.deleteMany({
      where: {
        userId: findAdmin.userId,
      },
    });

    // return admin id
    const adminData = getAdminByIdHandler(adminId);
    return adminData;
  });

  return deletedResult;
};

const changeUserStatusHandler = async (
  user: IRequestUserInterface,
  payload: IChangeUserStatusPayload,
) => {
  // find admin data
  const adminData = await prisma.admin.findUniqueOrThrow({
    where: {
      email: user.email,
    },
    include: { user: true },
  });

  // find user data
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
  });

  const selfChange = adminData.userId === userData.id;

  if (selfChange) {
    throw new AppError(status.BAD_REQUEST, "You can't change your own status");
  }

  if (
    adminData.user.role === Role.ADMIN &&
    userData.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can't change super admin status",
    );
  }

  if (adminData.user.role === Role.ADMIN && userData.role === Role.ADMIN) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the status of another admin. Only super admin can change the status of another admin",
    );
  }

  if (userData.status === UserStatus.DELETED) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can't change deleted user status",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: payload.userId },
    data: { status: payload.status },
  });

  return updatedUser;
};

const changeUserRoleHandler = async (
  user: IRequestUserInterface,
  payload: IChangeUserRolePayload,
) => {
  // find admin data
  const superAdminData = await prisma.admin.findUniqueOrThrow({
    where: {
      email: user.email,
      user: {
        role: Role.SUPER_ADMIN,
      },
    },
    include: { user: true },
  });

  const { userId, role } = payload;

  // find user data
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const selfChange = superAdminData.userId === userData.id;

  if (selfChange) {
    throw new AppError(status.BAD_REQUEST, "You can't change your own role");
  }

  if (userData.role === Role.DOCTOR || userData.role === Role.PATIENT) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the role of doctor or patient user. If you want to change the role of doctor or patient user, you have to delete the user and recreate with new role",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return updatedUser;
};

export const adminService = {
  getAdminsHandler,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler,
  changeUserStatusHandler,
  changeUserRoleHandler,
};
