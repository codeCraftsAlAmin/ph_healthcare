import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

// Configuration
cloudinary.config({
  cloud_name: envVars.CLOUDINARY_KEY_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
});

// upload file manually to cloudinary
export const uploadFileToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse> => {
  // Check if buffer and fileName are provided
  if (!buffer || !fileName) {
    throw new Error("Invalid file data");
  }

  // Extract file extension and name
  const extension = fileName.split(".").pop()?.toLocaleLowerCase();

  const fileNameWithoutExtension = fileName
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  // Generate unique file name
  const uniqueName =
    Math.random().toString(36).substring(2) +
    "_" +
    Date.now() +
    "_" +
    fileNameWithoutExtension;

  // Determine folder based on file type
  const folder = extension === "pdf" ? "pdfs" : "images";

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ph_healthcare/${folder}`,
        public_id: `ph_healthcare/${folder}/${uniqueName}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError(
              status.INTERNAL_SERVER_ERROR,
              "Failed to upload file to Cloudinary",
            ),
          );
        } else {
          resolve(result as UploadApiResponse);
        }
      },
    );
    uploadStream.end(buffer);
  });
};

// delete file from cloudinary
export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

      // console.log(`File ${publicId} deleted successfully`);
    }
  } catch (error) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to delete file from Cloudinary",
    );
  }
};

export const cloudinaryUpload = cloudinary;
