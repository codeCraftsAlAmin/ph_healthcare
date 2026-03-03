import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateAdminPayload } from "./admin.interface";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { UserStatus } from "../../../generated/prisma/enums";
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


export const adminService = {
  getAdminsHandler,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler,
};
