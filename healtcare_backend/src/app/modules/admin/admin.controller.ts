import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { adminService } from "./admin.service";
import { IRequestUserInterface } from "../../interface/requestUserInterface";

const getAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAdminsHandler();

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Admins fetched successfully",
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await adminService.getAdminByIdHandler(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Admin fetched successfully",
    data: result,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await adminService.updateAdminHandler(id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    ok: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await adminService.deleteAdminHandler(
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

export const adminController = {
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
