import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../config/env";

export const globalError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // console error in dev mode
  if (envVars.NODE_ENV === "development") {
    console.log("Globar Error", err);
  }

  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let errMessage: string = "Internal server error";

  res.status(statusCode).json({
    ok: false,
    message: errMessage,
    error: err.message,
  });
};
