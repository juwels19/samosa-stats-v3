import * as z from "zod";

export const createCategoryFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter category text.")
    .max(150, "Category text must be 150 characters or fewer."),
  scoringDescription: z
    .string()
    .trim()
    .min(1, "Enter a scoring description.")
    .max(500, "Scoring description must be 500 characters or fewer."),
  isGlobal: z.boolean(),
});
