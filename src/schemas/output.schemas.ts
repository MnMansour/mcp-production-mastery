import { z } from "zod";

export const AuditLogSchema = z.object({
  action: z.string(),
  timestamp: z.string(),
  success: z.boolean(),
});

export const FinalTaskSummarySchema = z.object({
  taskStatus: z.enum(["COMPLETED", "FAILED"]),
  actionTaken: z.string().describe("Detailed summary of actions executed via MCP tools"),
  rawResult: z.string().describe("Exact string response from tool execution"),
  auditTrace: z.array(AuditLogSchema).describe("Trace history of operations"),
  timestamp: z.string().describe("ISO timestamp"),
});

export type FinalTaskSummary = z.infer<typeof FinalTaskSummarySchema>;