import { Gender } from "../../../generated/prisma/enums";

export interface IUpdateDoctorSpeciality {
  specialityId: string;
  shouldDelete: boolean;
}

export interface IUpdateDoctorPayload {
  doctor?: {
    name?: string;
    email?: string;
    profilePhoto?: string;
    contactNumber?: string;
    experience?: number;
    address?: string;
    registrationNumber?: string;
    gender?: Gender;
    appointmentFee?: number;
    qualification?: string;
    currentWorkingplace?: string;
    designation?: string;
  };
  specialites?: IUpdateDoctorSpeciality[];
}
