import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await reviewService.createReview(payload, user!);

  sendResponse(res, {
    ok: true,
    statusCode: status.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getAllReviews();

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Reviews fetched successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const result = await reviewService.getMyReviews(user!);

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "My reviews fetched successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const id = req.params.id;

  const result = await reviewService.updateReview(id as string, payload, user!);

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;

  const result = await reviewService.deleteReview(id as string, user!);

  sendResponse(res, {
    ok: true,
    statusCode: status.OK,
    message: "Review deleted successfully",
    data: result,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
