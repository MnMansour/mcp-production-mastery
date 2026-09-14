import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SystemPingSchema, executeSystemPing } from "./tools/ping.tool.js";
import { UpdateDatabaseSchema, executeDatabaseUpdate } from "./tools/database.tool.js";

const server = new McpServer({
  name: "production-mcp-server",
  version: "1.0.0",
});

// Register Tool 1: System Ping Diagnostic
server.tool(
  "system_ping",
  "Check connectivity and system latency metrics for host target.",
  SystemPingSchema.shape,
  async (args) => {
    const result = await executeSystemPing(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

// Register Tool 2: Database Record Update
server.tool(
  "update_database_record",
  "Update a specific field value inside a database record safely.",
  UpdateDatabaseSchema.shape,
  async (args) => {
    const result = await executeDatabaseUpdate(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Production MCP Server listening on Stdio.\n");
}

startServer().catch((err: unknown) => {
  process.stderr.write(`Fatal MCP Server Error: ${String(err)}\n`);
  process.exit(1);
});