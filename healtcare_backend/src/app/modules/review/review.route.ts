import express from "express";
import { reviewController } from "./review.controller";
import { reviewValidation } from "./review.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// create review
router.post(
  "/create-review",
  checkAuth(Role.PATIENT),
  validateRequest(reviewValidation.createReviewZodSchema),
  reviewController.createReview,
);

// get all reviews
router.get("/", reviewController.getAllReviews);

// get my reviews
router.get(
  "/my-reviews",
  checkAuth(Role.PATIENT),
  reviewController.getMyReviews,
);

// update review
router.patch(
  "/:id",
  checkAuth(Role.PATIENT),
  validateRequest(reviewValidation.updateReviewSchema),
  reviewController.updateReview,
);

// delete review
router.delete("/:id", checkAuth(Role.PATIENT), reviewController.deleteReview);

export const reviewRouter = router;
