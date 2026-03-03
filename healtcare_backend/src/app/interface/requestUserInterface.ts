import { Role } from "../../generated/prisma/enums";

export interface IRequestUserInterface {
  userId: string;
  role: Role;
  email: string;
}
