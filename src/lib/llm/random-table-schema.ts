import { z } from "zod";

export const randomTableEntriesSchema = z.object({
  entries: z.array(z.string()).min(6).max(20),
});

export type RandomTableEntries = z.infer<typeof randomTableEntriesSchema>;
