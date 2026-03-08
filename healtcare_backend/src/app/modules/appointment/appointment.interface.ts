export interface IBookAppointment {
  doctorId: string;
  scheduleId: string;
  //   paymentId: string;
}

export interface IUpdateAppointmentPayload {
  doctorId?: string;
  scheduleId?: string;
  status?: string;
}
