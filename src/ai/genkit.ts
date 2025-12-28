/**
 * Genkit is disabled (local-first, no cloud). This stub prevents accidental usage.
 */
export const ai = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  invoke: async (..._args: unknown[]) => {
    throw new Error("Genkit is disabled in local-first mode.");
  },
};
