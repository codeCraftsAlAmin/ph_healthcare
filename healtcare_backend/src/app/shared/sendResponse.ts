import { Response } from "express";

interface IResponseData<T> {
  statusCode: number;
  ok: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  responseData: IResponseData<T>,
) => {
  const { statusCode, ok, message, data } = responseData;
  res.status(statusCode).json({
    ok,
    message,
    data,
  });
};
