import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";
import { generateInvoicePdf } from "./payment.utils";
import { sendEmail } from "../../utils/email";

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
          include: {
            patient: true,
            doctor: true,
            schedule: true,
            payment: true,
          },
        });

        if (!appointment) {
          return {
            message: `Appointment with ${appointmentId} not found`,
          };
        }

        // update appointment and payment status
        await prisma.$transaction(async (tx) => {
          const updateAppointment = await tx.appointment.update({
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

          const updatePayment = await tx.payment.update({
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

          return {
            updateAppointment,
            updatePayment,
          };
        });

        // generate invoice pdf
        let invoiceUrl = null;
        let pdfBuffer: Buffer | null = null;

        if (session.payment_status === "paid") {
          try {
            pdfBuffer = await generateInvoicePdf({
              invoiceId: paymentId,
              patientName: appointment.patient.name,
              patientEmail: appointment.patient.email,
              doctorName: appointment.doctor.name,
              appointmentDate: new Date(
                appointment.schedule.startDateTime,
              ).toString(),
              amount: appointment.payment?.amount || 0,
              transactionId: appointment.payment?.transactionId || "",
              paymentDate: new Date().toISOString(),
            });

            // upload invoice pdf to cloudinary
            const cloudinaryResponse = await uploadFileToCloudinary(
              pdfBuffer,
              `ph_healthcare/invoices/invoice-${appointmentId}-${Date.now()}.pdf`,
            );

            invoiceUrl = cloudinaryResponse.secure_url;

            if (invoiceUrl) {
              await prisma.payment.update({
                where: {
                  id: paymentId,
                },
                data: {
                  invoiceUrl,
                },
              });
            }

            console.log(
              `✅ Invoice PDF generated and uploaded for payment ${paymentId}`,
            );
          } catch (error) {
            console.error("❌ Error generating/uploading invoice PDF:", error);
            // Continue with payment update even if PDF generation fails
          }
        }

        // send email to patient
        if (session.payment_status === "paid" && invoiceUrl) {
          try {
            await sendEmail({
              to: appointment.patient.email,
              subject: `Payment Confirmation & Invoice - Appointment with ${appointment.doctor.name}`,
              templateName: "invoice",
              templateData: {
                patientName: appointment.patient.name,
                invoiceId: paymentId,
                transactionId: appointment.payment?.transactionId || "",
                doctorName: appointment.doctor.name,
                appointmentDate: new Date(
                  appointment.schedule.startDateTime,
                ).toISOString(),
                amount: appointment.payment?.amount || 0,
                paymentDate: new Date().toISOString(),
                invoiceUrl: invoiceUrl,
              },
              attachments: [
                {
                  filename: `invoice-${appointmentId}.pdf`,
                  content: pdfBuffer || Buffer.from("Invoice not found"),
                  contentType: "application/pdf",
                },
              ],
            });

            console.log(
              `✅ Invoice email sent to ${appointment.patient.email}`,
            );
          } catch (error) {
            console.error("❌ Error sending email:", error);
            // Log but don't fail the payment if email fails
          }
        }
        console.log(
          `✅ Payment ${session.payment_status} for appointment ${appointmentId}`,
        );
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
