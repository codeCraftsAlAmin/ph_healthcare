import { z } from "zod";

const createSpecialityZodSchema = z.object({
  title: z.string("Title is required"),
  image: z.string("Image is required").optional(),
});

export const specialityValidation = {
  createSpecialityZodSchema,
};
