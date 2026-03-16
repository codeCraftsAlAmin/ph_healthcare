import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
  try {
    // find super admin
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    if (superAdmin) {
      console.log("Super admin already exists");
      return;
    }

    // create user
    const userData = await auth.api.signUpEmail({
      body: {
        name: envVars.SUPER_ADMIN_NAME,
        email: envVars.SUPER_ADMIN_EMAIL,
        password: envVars.SUPER_ADMIN_PASS,
        needPasswordChange: false,
        rememberMe: false,
        role: Role.SUPER_ADMIN,
      },
    });

    // create super admin
    await prisma.$transaction(async (tx) => {
      await tx.superAdmin.create({
        data: {
          userId: userData.user.id,
          name: envVars.SUPER_ADMIN_NAME,
          email: envVars.SUPER_ADMIN_EMAIL,
        },
      });

      await tx.user.update({
        where: {
          id: userData.user.id,
        },
        data: {
          emailVerified: true,
        },
      });
    });

    // return super admin data
    const superAdminData = await prisma.superAdmin.findFirst({
      where: {
        id: userData.user.id,
      },
      include: {
        user: true,
      },
    });

    console.log("Super admin created successfully ~ ✨🎉", superAdminData);
  } catch (error) {
    console.log("Super admin creation failed ~ 💔", error);
    await prisma.superAdmin.delete({
      where: {
        email: envVars.SUPER_ADMIN_EMAIL,
      },
    });
  }
};
