import { z } from "zod";

export const optionOutputSchema = z
  .object({
    outDir: z.string().optional().default("./mysqlToZod"),
    fileName: z.string().optional().default("schema.ts"),
  })
  .optional()
  .default({
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
  });

export type OptionOutput = z.infer<typeof optionOutputSchema>;
