import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../config/env";
import { TErrorResponse, TErrorSource } from "../interface/error.interface";
import z from "zod";
import { handleZodError } from "../errorHelpers/handleZodError";
import AppError from "../errorHelpers/AppError";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

export const globalError = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // console error in dev mode
  if (envVars.NODE_ENV === "development") {
    console.log("Globar Error", err);
  }

  // delete file from cloudinary if file is uploaded
  if (req.file) {
    await deleteFileFromCloudinary(req.file.path);
  }

  // delete multiple files from cloudinary
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrl = req.files.map((file) => file.path);

    await Promise.all(imageUrl.map((url) => deleteFileFromCloudinary(url)));
  }

  let errorSource: TErrorSource[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let errMessage: string = "Internal server error";

  if (err instanceof z.ZodError) {
    // throw zod error
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    errMessage = simplifiedError.message;
    errorSource = [...simplifiedError.errorSource];
  } else if (err instanceof AppError) {
    // throw global error from Error
    statusCode = err.statusCode;
    errMessage = err.message;
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    errMessage = err.message;
  }

  const errRseponse: TErrorResponse = {
    ok: false,
    statusCode,
    message: errMessage,
    errorSource,
    error: envVars.NODE_ENV === "development" ? err : undefined,
  };

  res.status(statusCode).json(errRseponse);
};
