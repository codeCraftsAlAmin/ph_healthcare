import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateSuperAdminPayload } from "./superAdmin.interface";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { UserStatus } from "../../../generated/prisma/enums";

const getSuperAdminsHandler = async () => {
  const superAdmins = await prisma.superAdmin.findMany({
    include: { user: true },
  });

  return superAdmins;
};

const getSuperAdminByIdHandler = async (superAdminId: string) => {
  const findSuperAdmin = await prisma.superAdmin.findUniqueOrThrow({
    where: { id: superAdminId },
  });

  return findSuperAdmin;
};

const updateSuperAdminHandler = async (
  superAdminId: string,
  payload: IUpdateSuperAdminPayload,
) => {
  // find the super admin first
  const findSuperAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!findSuperAdmin) {
    throw new AppError(status.NOT_FOUND, "Super Admin not found");
  }

  const updateSuperAdmin = await prisma.$transaction(async (tx) => {
    // update super admin data
    await tx.superAdmin.update({
      where: { id: superAdminId },
      data: {
        ...payload.super_admin,
      },
    });

    // update user data
    await tx.user.update({
      where: {
        id: findSuperAdmin.userId,
      },
      data: {
        name: payload.super_admin.name,
      },
    });

    // return super admin data
    const superAdminData = await tx.superAdmin.findUnique({
      where: { id: superAdminId },
    });
    return superAdminData;
  });

  return updateSuperAdmin;
};

const deleteSuperAdminHandler = async (
  superAdminId: string,
  user: IRequestUserInterface,
) => {
  // find the admin first
  const findSuperAdmin = await prisma.superAdmin.findUniqueOrThrow({
    where: { id: superAdminId },
  });

  if (!findSuperAdmin) {
    throw new AppError(status.NOT_FOUND, "Super Admin not found");
  }

  if (findSuperAdmin.id === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You can't delete yourself");
  }
  // soft delete
  const deletedResult = await prisma.$transaction(async (tx) => {
    // update isDeleted status at super admin table
    await tx.superAdmin.update({
      where: {
        id: superAdminId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // update isDeleted status at user table
    await tx.user.update({
      where: {
        id: findSuperAdmin.userId,
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
        userId: findSuperAdmin.userId,
      },
    });

    // delete acccount data
    await tx.account.deleteMany({
      where: {
        userId: findSuperAdmin.userId,
      },
    });

    // return super admin id
    const superAdminData = getSuperAdminByIdHandler(superAdminId);
    return superAdminData;
  });

  return deletedResult;
};

export const superAdminService = {
  getSuperAdminsHandler,
  getSuperAdminByIdHandler,
  updateSuperAdminHandler,
  deleteSuperAdminHandler,
};
