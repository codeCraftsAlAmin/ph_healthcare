export interface ICreatePrescriptionPayload {
  followUpDate: Date;
  instructions: string;
  appointmentId: string;
}

export interface IUpdatePrescriptionPayload {
  followUpDate?: Date;
  instructions?: string;
}
