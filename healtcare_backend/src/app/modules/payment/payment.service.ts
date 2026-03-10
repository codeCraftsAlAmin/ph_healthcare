import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const handlePaymentWebhook = async (event: Stripe.Event) => {
  // find the payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    return {
      ok: true,
      message: `Event ${event.id} already processed. Skipping`,
    };
  }

  // handle the payment event
  try {
    switch (event.type) {
      // complete payment
      case "checkout.session.completed": {
        const session = event.data.object;

        const appointmentId = session.metadata?.appointmentId;
        const paymentId = session.metadata?.paymentId;

        if (!appointmentId || !paymentId) {
          return {
            message: "Missing appointmentId or paymentId in session metadata",
          };
        }

        // find appointment
        const appointment = await prisma.appointment.findUnique({
          where: {
            id: appointmentId,
          },
        });

        if (!appointment) {
          return {
            message: `Appointment with ${appointmentId} not found`,
          };
        }

        // update appointment and payment status
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: {
              id: appointmentId,
            },
            data: {
              paymentStatus:
                session.payment_status === "paid"
                  ? PaymentStatus.PAID
                  : PaymentStatus.UNPAID,
            },
          });

          await tx.payment.update({
            where: {
              id: paymentId,
            },
            data: {
              status:
                session.payment_status === "paid"
                  ? PaymentStatus.PAID
                  : PaymentStatus.UNPAID,
              stripeEventId: event.id,
              paymentGatewayData: session as any,
            },
          });
        });

        console.info(`✅ Payment processed for Appointment: ${appointmentId}`);

        break;
      }

      // expired or filed to payment
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const session = event.data.object;

        const appointmentId = session.metadata?.appointmentId;
        const paymentId = session.metadata?.paymentId;

        if (!appointmentId || !paymentId) {
          return {
            message: "Missing appointmentId or paymentId in session metadata",
          };
        }

        // find appointment
        const appointment = await prisma.appointment.findUnique({
          where: {
            id: appointmentId,
          },
        });

        if (!appointment) {
          return {
            message: `Appointment with ${appointmentId} not found`,
          };
        }

        // update appointment and payment status
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: {
              id: appointmentId,
            },
            data: {
              paymentStatus: PaymentStatus.UNPAID,
            },
          });

          await tx.payment.update({
            where: {
              id: paymentId,
            },
            data: {
              status: PaymentStatus.UNPAID,
              stripeEventId: event.id,
            },
          });
        });

        break;
      }

      // for unhandled type
      default: {
        return { message: `Unhandled event type ${event.type}` };
      }
    }

    return {
      message: "Payment event processed successfully",
    };
  } catch (error: any) {
    console.log(`❌ Webhook Error [${event.id}]:`, error.message);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Webhook processing failed",
    );
  }
};

export const PaymentService = {
  handlePaymentWebhook,
};
