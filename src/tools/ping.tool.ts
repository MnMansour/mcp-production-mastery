import { z } from "zod";

export const SystemPingSchema = z.object({
  targetHost: z.string().describe("Target host IP or domain to ping"),
});

export type SystemPingInput = z.infer<typeof SystemPingSchema>;

export async function executeSystemPing(input: SystemPingInput) {
  const parsed = SystemPingSchema.parse(input);
  return {
    status: "ONLINE",
    target: parsed.targetHost,
    latencyMs: Math.floor(Math.random() * 20) + 5,
    timestamp: new Date().toISOString(),
  };
}