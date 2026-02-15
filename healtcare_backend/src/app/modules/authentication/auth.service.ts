import { UserStatus } from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

interface IRegisterUser {
  name: string;
  email: string;
  password: string;
}

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
    throw new Error("Failed to register patient");
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

    return {
      ...result,
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

interface ILoginUser {
  email: string;
  password: string;
}

const loginUserHanlder = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const result = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (result.user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }

  if (result.user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }

  return result;
};

export const authService = {
  registerUserHanlder,
  loginUserHanlder,
};
