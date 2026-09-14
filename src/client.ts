import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { langfuse, flushTelemetry } from "./config/telemetry.js";
import { FinalTaskSummarySchema, FinalTaskSummary } from "./schemas/output.schemas.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runClientAgent(userPrompt: string): Promise<FinalTaskSummary> {
  const trace = langfuse.trace({
    name: "production-mcp-agent-run",
    userId: "sys-admin-prod",
    input: { prompt: userPrompt },
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/server.ts"],
  });

  const mcpClient = new Client(
    { name: "production-agent-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);

  // Dynamic Discovery via MCP Protocol
  const discoveredTools = await mcpClient.listTools();
  const openAiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = discoveredTools.tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.inputSchema as Record<string, unknown>,
    },
  }));

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: "You are a production-grade infrastructure ops agent. Use tools precisely." },
    { role: "user", content: userPrompt },
  ];

  try {
    const generation1 = trace.generation({
      name: "tool-discovery-and-selection",
      model: "gpt-4o",
      input: messages,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: openAiTools,
      tool_choice: "auto",
    });

    const assistantMsg = completion.choices[0].message;
    messages.push(assistantMsg);

    generation1.end({
      output: assistantMsg,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });

    // Handle Tool Execution over Stdio JSON-RPC
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      for (const call of assistantMsg.tool_calls) {
        const toolSpan = trace.span({
          name: `mcp-call:${call.function.name}`,
          input: call.function.arguments,
        });

        const mcpResult = await mcpClient.callTool({
          name: call.function.name,
          arguments: JSON.parse(call.function.arguments),
        });

        toolSpan.end({ output: mcpResult });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(mcpResult.content),
        });
      }
    }

    // Structured Deterministic Output Formatting
    const generation2 = trace.generation({
      name: "final-structured-output",
      model: "gpt-4o",
      input: messages,
    });

    const finalCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: zodResponseFormat(FinalTaskSummarySchema, "final_task_summary"),
    });

    const rawContent = finalCompletion.choices[0].message.content;
    const parsedSummary = FinalTaskSummarySchema.parse(JSON.parse(rawContent || "{}"));

    generation2.end({
      output: parsedSummary,
      usage: {
        promptTokens: finalCompletion.usage?.prompt_tokens,
        completionTokens: finalCompletion.usage?.completion_tokens,
        totalTokens: finalCompletion.usage?.total_tokens,
      },
    });

    trace.update({ output: parsedSummary });
    return parsedSummary;
  } finally {
    await mcpClient.close();
  }
}

async function main() {
  const prompt = "Update user record '550e8400-e29b-41d4-a716-446655440000' in users table. Set 'fieldName' to 'email' and 'newValue' to 'production@mastery.com'.";
  try {
    const result = await runClientAgent(prompt);
    console.log("\n==================================================");
    console.log("FINAL DETERMINISTIC TASK SUMMARY:");
    console.log("==================================================");
    console.dir(result, { depth: null });
  } catch (err) {
    console.error("Client Agent Execution Failed:", err);
  } finally {
    await flushTelemetry();
  }
}

main();