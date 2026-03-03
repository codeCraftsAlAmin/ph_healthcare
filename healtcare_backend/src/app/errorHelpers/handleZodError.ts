import z from "zod";
import { TErrorResponse, TErrorSource } from "../interface/error.interface";
import status from "http-status";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod Validation Error";
  const errorSource: TErrorSource[] = [];

  // result.error!.issues;
  err.issues.forEach((issue) => {
    errorSource.push({
      path: issue.path.join("."),
      message: issue.message,
    });
  });

  return {
    ok: false,
    message,
    errorSource,
    statusCode,
  };
};
