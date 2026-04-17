import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "path";

const SYSTEM_PROMPT = `You are an intelligent inventory and sales assistant for a Pakistani textile/goods inventory management system.

You have access to real-time data through tools. Always call a tool before answering any data question.

## Data integrity rules (CRITICAL — never break these)
- Only show numbers and values that were explicitly returned by a tool. Never estimate, round differently, or calculate values yourself.
- If a tool does not return a field (e.g. supplier name), leave that column out entirely. Do not call extra tools just to fill in a missing column.
- Never mix data from two different tool calls into the same table row. Each row must come from a single source record.
- If no single tool can answer the question accurately, say: "I don't have enough data to answer this accurately" and explain what is missing. Never approximate or substitute unrelated data.
- Do not call multiple tools and combine their results unless the user's question explicitly requires comparing two separate datasets (e.g. purchases vs sales).
- Never perform your own calculations on top of tool results except for simple formatting (e.g. converting to millions for display). All aggregations must come from the tool.

## Response rules
- Respond in the same language the user writes in (English, Urdu, or Hinglish/Roman Urdu)
- Format lists and comparisons as clean markdown tables
- Use PKR (Pakistani Rupees ₨) for all monetary values
- Keep all responses under 500 words. Show the data, one brief insight, done.
- When creating ranked tables, always embed the rank/medal inside the first data column cell — never add rank as a separate leading cell. Use "🥇 Product Name", "4. Product Name" — all in the same column.
- For profit/margin analysis, use get_item_profitability — never compare total purchase spend to total sales revenue directly.`;

class ClaudeService {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.mcpClient = null;
    this.tools = [];
    this.initialized = false;
    this.initPromise = null;
    // Active onProgress callback for the current chat() call
    this._progressCallback = null;
  }

  async initialize() {
    if (this.initialized) return;
    // Deduplicate concurrent init calls
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const serverPath = path.join(process.cwd(), "mcp-server/index.js");

      const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
      });

      this.mcpClient = new Client({ name: "inventory-nextjs-client", version: "1.0.0" }, { capabilities: {} });

      await this.mcpClient.connect(transport);

      const { tools } = await this.mcpClient.listTools();
      this.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));

      // Forward MCP server log messages to the active chat's onProgress callback
      this.mcpClient.setNotificationHandler(LoggingMessageNotificationSchema, async (notification) => {
        this._progressCallback?.({ text: String(notification.params.data) });
      });

      this.initialized = true;
      console.log(`[Claude] MCP connected — ${this.tools.length} tools loaded`);
    })().catch((err) => {
      // Reset so the next request retries initialization
      this.initPromise = null;
      throw err;
    });

    return this.initPromise;
  }

  // Call a tool with a timeout so a hung MCP subprocess never blocks forever.
  // onprogress receives { progress, total?, message? } from the MCP server's context.report_progress().
  async callToolWithTimeout(toolName, toolInput, timeoutMs = 20000, onprogress = undefined) {
    return Promise.race([
      this.mcpClient.callTool(
        { name: toolName, arguments: toolInput },
        undefined,
        onprogress ? { onprogress } : undefined
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool "${toolName}" timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  // Reset and reconnect — called when a tool error suggests the MCP process died
  async reconnect() {
    console.warn("[Claude] Reconnecting MCP client…");
    this.initialized = false;
    this.initPromise = null;
    this.mcpClient = null;
    this.tools = [];
    await this.initialize();
  }

  async chat(messages, onProgress = null) {
    await this.initialize();

    // Expose onProgress so the MCP notification handler (context.info) can reach it
    this._progressCallback = onProgress;

    const runMessages = [...messages];

    onProgress?.({ text: "Thinking…" });

    let response = await this.client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: this.tools,
      messages: runMessages,
    });

    // Agentic loop — keep going while Claude wants to use tools (max 10 iterations)
    let iterations = 0;
    while (response.stop_reason !== "end_turn") {
      if (++iterations > 10) {
        throw new Error("Agentic loop exceeded 10 iterations — possible infinite loop.");
      }
      if (response.stop_reason === "max_tokens") {
        throw new Error("Response was cut off — max_tokens limit reached.");
      }
      if (response.stop_reason !== "tool_use") {
        throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
      }
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

      const toolLabel = toolUseBlocks
        .map((t) => t.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(", ");
      onProgress?.({ text: `Calling: ${toolLabel}…` });

      // Append assistant turn (may include text + tool_use blocks)
      runMessages.push({ role: "assistant", content: response.content });

      // Call each tool and collect results
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          let resultText;
          // Forward context.report_progress() notifications from the MCP server
          const onprogress = onProgress
            ? ({ progress, total, message }) => {
                const text = message ?? (total ? `${Math.round((progress / total) * 100)}%` : null);
                onProgress({ progress, total, ...(text ? { text } : {}) });
              }
            : undefined;
          try {
            const result = await this.callToolWithTimeout(toolUse.name, toolUse.input, 20000, onprogress);
            resultText = result.content?.[0]?.text ?? "No result returned";
          } catch (err) {
            console.error(`[Claude] Tool "${toolUse.name}" failed:`, err.message);
            // If the subprocess appears dead, reconnect for the next request
            if (err.message.includes("timed out") || err.message.includes("closed")) {
              this.reconnect().catch(() => {});
            }
            resultText = `Tool error: ${err.message}`;
          }
          return {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: resultText,
          };
        })
      );

      runMessages.push({ role: "user", content: toolResults });

      onProgress?.({ text: "Analyzing results…" });

      response = await this.client.messages.create({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: this.tools,
        messages: runMessages,
      });
    }

    onProgress?.({ text: "Generating response…" });

    // stop_reason === "end_turn" — Claude is done
    const textBlock = response.content.find((b) => b.type === "text");

    // Append final assistant turn so caller can persist the full history
    runMessages.push({ role: "assistant", content: response.content });

    this._progressCallback = null;

    return {
      reply: textBlock?.text ?? "Sorry, I couldn't generate a response.",
      updatedMessages: runMessages,
    };
  }
}

// Singleton — survives Next.js hot reloads in dev via globalThis
export function getClaudeService() {
  if (!globalThis._claudeServiceInstance) {
    globalThis._claudeServiceInstance = new ClaudeService();
  }
  return globalThis._claudeServiceInstance;
}
