import { z } from "zod";

export const askSchema = z.object({
  answer: z
    .string()
    .describe(
      "A focused answer to the GM's question, grounded in the campaign bible. " +
        "Clearly separate what is established canon from reasonable inference " +
        "or suggestions. If the bible doesn't cover it, say so plainly. Same " +
        "language as the campaign content.",
    ),
});
