import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../config/env";
import { TErrorResponse, TErrorSource } from "../interface/error.interface";
import z from "zod";
import { handleZodError } from "../errorHelpers/handleZodError";
import AppError from "../errorHelpers/AppError";
import { deleteUploadFilesFromGlobalErrHandler } from "../utils/deleteUploadFilesFromGlobalErrHandler";

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

  // delete uploaded files from cloudinary
  await deleteUploadFilesFromGlobalErrHandler(req);

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
