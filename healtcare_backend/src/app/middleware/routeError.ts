import { Request, Response } from "express";
import status from "http-status";

export const routeError = (req: Request, res: Response) => {
  res.status(status.NOT_FOUND).json({
    ok: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
