import { NextFunction, Request, Response } from "express";
import {
  IUpdatePatientProfile,
  IUpdatePatientProfilePayload,
} from "./patient.interface";

export const uploadPatientProfileMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // handle data
  if (req.body.data) {
    req.body = JSON.parse(req.body.data);
  }

  const payload: IUpdatePatientProfilePayload = req.body;

  // handle image-file
  const files = req.files as {
    [fieldName: string]: Express.Multer.File[] | undefined;
  };

  // profile photo
  if (files?.profilePhotos?.[0]) {
    if (!payload.patientInfo) {
      payload.patientInfo = {} as IUpdatePatientProfile;
    }
    payload.patientInfo.profilePhoto = files.profilePhotos[0].path;
  }

  // pdf
  if (files?.medicalReports && files?.medicalReports.length > 0) {
    const newReport = files.medicalReports.map((file) => ({
      reportName: file.originalname,
      reportLink: file.path,
    }));

    if (payload.medicalReport && Array.isArray(payload.medicalReport)) {
      payload.medicalReport = [...payload.medicalReport, ...newReport];
    } else {
      payload.medicalReport = newReport;
    }
  }

  req.body = payload;
  next();
};
