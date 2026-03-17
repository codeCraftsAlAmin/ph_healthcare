import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateAdminPayload {
  admin: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
  };
}

export interface IChangeUserStatusPayload {
  userId: string;
  status: UserStatus;
}

export interface IChangeUserRolePayload {
  userId: string;
  role: Role;
}
