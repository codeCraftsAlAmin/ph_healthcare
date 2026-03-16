export interface ICreateReview {
  rating: number;
  comment: string;
  appointmentId: string;
}

export interface IUpdateReview {
  rating?: number;
  comment?: string;
}
