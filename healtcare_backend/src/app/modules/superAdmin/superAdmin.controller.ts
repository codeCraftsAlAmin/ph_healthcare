import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { superAdminService } from "./superAdmin.service";
import { IRequestUserInterface } from "../../interface/requestUserInterface";

const getSuperAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await superAdminService.getSuperAdminsHandler();

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Super Admins fetched successfully",
    data: result,
  });
});

const getSuperAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await superAdminService.getSuperAdminByIdHandler(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Super Admin fetched successfully",
    data: result,
  });
});

const updateSuperAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await superAdminService.updateSuperAdminHandler(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Super Admin updated successfully",
    data: result,
  });
});

const deleteSuperAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await superAdminService.deleteSuperAdminHandler(
    id as string,
    user as IRequestUserInterface,
  );

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

export const superAdminController = {
  getSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin,
};
