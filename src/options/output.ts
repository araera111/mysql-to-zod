import { z } from "zod";

export const outputSchema = z.object({
  outDir: z.string().optional().default("./mysqlToZod"),
  fileName: z.string().optional().default("schema.ts"),
});
