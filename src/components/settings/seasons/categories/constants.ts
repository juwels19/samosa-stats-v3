import * as z from "zod";

export const createCategoryFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter category text.")
    .max(150, "Category text must be 150 characters or fewer."),
  isGlobal: z.boolean(),
});
