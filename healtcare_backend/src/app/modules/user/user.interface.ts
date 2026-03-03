import { Gender } from "../../../generated/prisma/enums";

// doctor interface
export interface ICreateDoctorPayload {
  password: string;
  doctor: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
    experience: number;
    gender: Gender;
    appointmentFee: number;
    qualification: string;
    registrationNumber: string;
    currentWorkingplace: string;
    avarageRating: number;
    designation: string;
  };
  specialities: string[];
}

// admin interface
export interface ICreateAdminPayload {
  password: string;
  admin: {
    name: string;
    email: string;
    contactNumber?: string;
    profilePhoto?: string;
  };
  role: "ADMIN" | "SUPER_ADMIN";
}

// super admin interface
export interface ICreateSuperAdminPayload {
  password: string;
  super_admin: {
    name: string;
    email: string;
    contactNumber?: string;
    profilePhoto?: string;
  };
}
