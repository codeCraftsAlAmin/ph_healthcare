import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { StatsService } from "./stats.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const getDashboardStatsData = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await StatsService.getDashboardStatsData(user!);
    sendResponse(res, {
      ok: true,
      statusCode: status.OK,
      message: "Dashboard stats fetched successfully",
      data: result,
    });
  },
);

export const StatsController = {
  getDashboardStatsData,
};
