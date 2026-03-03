import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import tokenUtils from "../../utils/token";
import { IChangePassword, ILoginUser, IRegisterUser } from "./auth.interface";
import { IRequestUserInterface } from "../../interface/requestUserInterface";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { fa } from "zod/locales";

const registerUserHanlder = async (payload: IRegisterUser) => {
  const { name, email, password } = payload;

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!result.user) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to register patient",
    );
  }

  // create a patient profile alogin with sign up
  try {
    const patientProfile = await prisma.$transaction(async (tx) => {
      const profileTx = await tx.patient.create({
        data: {
          userId: result.user.id,
          name: payload.name,
          email: payload.email,
        },
      });

      return profileTx;
    });

    // create acccess token
    const accessToken = tokenUtils.getAccessToken({
      userId: result.user.id,
      role: result.user.role,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
      isDeleted: result.user.isDeleted,
      emailVerified: result.user.emailVerified,
    });
    // create refresh token
    const refreshToken = tokenUtils.getRefreshToken({
      userId: result.user.id,
      role: result.user.role,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
      isDeleted: result.user.isDeleted,
      emailVerified: result.user.emailVerified,
    });

    return {
      ...result,
      accessToken,
      refreshToken,
      patientProfile,
    };
  } catch (error) {
    await prisma.user.delete({
      where: {
        id: result.user.id,
      },
    });
    throw error;
  }
};

const loginUserHanlder = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const result = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (result.user.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }

  if (result.user.status === UserStatus.DELETED) {
    throw new AppError(status.FORBIDDEN, "User is deleted");
  }

  // create acccess token
  const accessToken = tokenUtils.getAccessToken({
    userId: result.user.id,
    role: result.user.role,
    name: result.user.name,
    email: result.user.email,
    status: result.user.status,
    isDeleted: result.user.isDeleted,
    emailVerified: result.user.emailVerified,
  });
  // create refresh token
  const refreshToken = tokenUtils.getRefreshToken({
    userId: result.user.id,
    role: result.user.role,
    name: result.user.name,
    email: result.user.email,
    status: result.user.status,
    isDeleted: result.user.isDeleted,
    emailVerified: result.user.emailVerified,
  });

  return {
    ...result,
    accessToken,
    refreshToken,
  };
};

const myProfileHanlder = async (user: IRequestUserInterface) => {
  const result = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      patient: {
        include: {
          appointments: true,
          reviews: true,
          prescriptions: true,
          medicalReports: true,
          patientHealthData: true,
        },
      },
      doctor: {
        include: {
          specialities: true,
          appointments: true,
          reviews: true,
          prescriptions: true,
        },
      },
      admin: true,
      superAdmin: true,
    },
  });

  return result;
};

const refreshTokenHanlder = async (
  refreshToken: string,
  sessionToken: string,
) => {
  // check if session token exists
  const isSessionTokenExist = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
  });

  if (!isSessionTokenExist) {
    throw new AppError(status.NOT_FOUND, "Session token not found");
  }

  // verify refresh token
  const isRefreshTokenExist = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!isRefreshTokenExist) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  // get data from refresh token
  const refreshTokenData = isRefreshTokenExist.data as JwtPayload;

  // create new acccess token
  const newAccessToken = tokenUtils.getAccessToken({
    userId: refreshTokenData.userId,
    role: refreshTokenData.role,
    name: refreshTokenData.name,
    email: refreshTokenData.email,
    status: refreshTokenData.status,
    isDeleted: refreshTokenData.isDeleted,
    emailVerified: refreshTokenData.emailVerified,
  });

  // create new refresh token
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: refreshTokenData.userId,
    role: refreshTokenData.role,
    name: refreshTokenData.name,
    email: refreshTokenData.email,
    status: refreshTokenData.status,
    isDeleted: refreshTokenData.isDeleted,
    emailVerified: refreshTokenData.emailVerified,
  });

  // update better-auth session expiry date
  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    newAccessToken,
    newRefreshToken,
    token,
  };
};

const changePasswordHandler = async (
  payload: IChangePassword,
  sessionToken: string,
) => {
  // verify session token
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Session not found");
  }

  const { currentPassword, newPassword } = payload;

  const result = await auth.api.changePassword({
    body: {
      newPassword: newPassword,
      currentPassword: currentPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  // update needPasswordChange to false if true
  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  // create new acccess token
  const newAccessToken = tokenUtils.getAccessToken({
    userId: session.session.userId,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  // create new refresh token
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: session.session.userId,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return {
    ...result,
    newAccessToken,
    newRefreshToken,
  };
};

const logoutUserHanlder = async (sessionToken: string) => {
  // verify session token
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Session not found");
  }

  const result = await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  return result;
};

const verifyEmailHandler = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp,
    },
  });

  // update emailVerified status at user table
  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        emailVerified: true,
      },
    });
  }

  return result;
};

const forgetPasswordHandler = async (email: string) => {
  // verify user
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User does not exist with this email");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(status.UNAUTHORIZED, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
    throw new AppError(status.UNAUTHORIZED, "User is deleted");
  }

  const result = await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });

  return result;
};

const resetPasswordHandler = async (
  email: string,
  otp: string,
  password: string,
) => {
  // verify user
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!isUserExist) {
    throw new AppError(status.NOT_FOUND, "User does not exist with this email");
  }

  if (!isUserExist.emailVerified) {
    throw new AppError(status.UNAUTHORIZED, "Email not verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
    throw new AppError(status.UNAUTHORIZED, "User is deleted");
  }

  // reset password
  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password,
    },
  });

  // update needPasswordChange to false
  if (isUserExist.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: isUserExist.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  // delete last session data
  await prisma.session.deleteMany({
    where: {
      userId: isUserExist.id,
    },
  });
};

const googleLoginSuccessHandler = async (session: Record<string, any>) => {
  // find patinet
  const isPatientExist = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  // create patient profile
  if (!isPatientExist) {
    await prisma.patient.create({
      data: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  }

  // create access token
  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });

  // create refresh token
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const authService = {
  registerUserHanlder,
  loginUserHanlder,
  myProfileHanlder,
  refreshTokenHanlder,
  changePasswordHandler,
  logoutUserHanlder,
  verifyEmailHandler,
  forgetPasswordHandler,
  resetPasswordHandler,
  googleLoginSuccessHandler,
};
