import { Response } from "express";

interface IResponseData<T> {
  statusCode: number;
  ok: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  responseData: IResponseData<T>,
) => {
  const { statusCode, ok, message, data, meta } = responseData;
  res.status(statusCode).json({
    ok,
    message,
    data,
    meta,
  });
};
