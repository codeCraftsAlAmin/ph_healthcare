import { Request, Response } from "express";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { stripe } from "../../config/stripe.config";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../shared/sendResponse";

const handlePaymentWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const websocketSecret = envVars.WEBHOOK_SECRET_KEY;

  if (!signature || !websocketSecret) {
    throw new AppError(
      status.BAD_REQUEST,
      "Missing signature or websocket secret",
    );
  }
  let event;

  // verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      websocketSecret,
    );
  } catch (error: any) {
    throw new AppError(status.BAD_REQUEST, "Invalid signature");
  }

  // send the event to the service
  try {
    const result = await PaymentService.handlePaymentWebhook(event);

    sendResponse(res, {
      ok: true,
      message: "Payment webhook processed successfully",
      statusCode: status.OK,
      data: result,
    });
  } catch (error) {
    sendResponse(res, {
      ok: false,
      message: "Payment webhook processed failed",
      statusCode: status.INTERNAL_SERVER_ERROR,
    });
  }
};

export const PaymentController = {
  handlePaymentWebhook,
};
