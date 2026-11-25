import * as z from "zod";

export const createCategoryFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter category text.")
    .max(150, "Category text must be 150 characters or fewer."),
  /** Optional. It can be added or changed later. */
  scoringDescription: z
    .string()
    .trim()
    .max(500, "Scoring description must be 500 characters or fewer."),
  isGlobal: z.boolean(),
});
