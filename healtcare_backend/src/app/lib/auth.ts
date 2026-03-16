import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // google login
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLOUDE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLOUDE_CLIENT_SECRET,

      // to map login data or include additional fields to social login
      mapProfileToUser: () => {
        return {
          role: Role.PATIENT,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          isDeleted: false,
          deletedAt: null,
          emailVerified: true,
        };
      },
    },
  },

  // Email verification configuration
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  // User configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.PATIENT,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      needPasswordChange: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },

  // This plugin allows you to use the bearer token to authenticate requests.
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        // console.log(`Sending verification OTP for type: ${type} to: ${email}`);
        if (type === "email-verification") {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            throw new AppError(status.NOT_FOUND, "User not found");
          }

          // no need to send verify email for super admin
          if (user.role === Role.SUPER_ADMIN) return;

          if (!user.emailVerified) {
            await sendEmail({
              to: email,
              subject: "Email Verification",
              templateName: "otp",
              templateData: {
                name: user.name,
                otp: otp,
              },
            });
          }
        } else if (type === "forget-password") {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            await sendEmail({
              to: email,
              subject: "Forget Password",
              templateName: "otp",
              templateData: {
                name: user.name,
                otp: otp,
              },
            });
          }
        }
      },
      expiresIn: 60 * 2, // 2 minutes
      otpLength: 6,
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 60 * 24, // 1d
    updateAge: 60 * 60 * 60 * 24, // 1d -- This defines how often the expiresIn timestamp in your database should be updated.
    // This allows the session data to be temporarily stored in a cookie.
    cookieCache: {
      enabled: true, // This enables the cookie cache feature.
      maxAge: 60 * 60 * 60 * 24, // 1d
    },
  },

  redirectUrls: {
    sign: `${envVars.BETTER_AUTH_URL}/api/auth/google/success`,
  },
  trustedOrigins: [envVars.BETTER_AUTH_URL || "http://localhost:5000"],

  // handle cross origin for social login
  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
});
