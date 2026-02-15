import { Gender } from "../../../generated/prisma/enums";

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
