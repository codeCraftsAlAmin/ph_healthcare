import { BloodGroup, Gender } from "../../../generated/prisma/enums";

export interface IUpdatePatientProfile {
  name?: string;
  profilePhoto?: string;
  contactNumber?: string;
  address?: string;
}

export interface IPatientMedicalReportInterface {
  reportName?: string;
  reportLink?: string;
  shouldDelete?: boolean;
  reportId?: string;
}

export interface IPatientHealthDataInterface {
  gender: Gender;
  dateOfBirth: Date;
  bloodGroup: BloodGroup;
  hasAllergies: boolean;
  hasDiabetes: boolean;
  height: string;
  weight: string;
  smokingStatus: boolean;
  dietaryPreferences?: string;
  pregnancyStatus: boolean;
  mentalHealthHistory?: string;
  immunizationStatus?: string;
  hasPastSurgeries: boolean;
  recentAnxiety: boolean;
  recentDepression: boolean;
  maritalStatus?: string;
}

export interface IUpdatePatientProfilePayload {
  patientInfo?: IUpdatePatientProfile;
  patientHealthData?: IPatientHealthDataInterface;
  medicalReport?: IPatientMedicalReportInterface[];
}
