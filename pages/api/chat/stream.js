import nextConnect from "next-connect";
import { auth } from "@/middlewares/auth";
import { getClaudeService } from "@/lib/claude-service";

export const config = { api: { responseLimit: false } };

// Per-session conversation history (same TTL/eviction policy as message.js)
const sessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 200;

function evictStaleSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.lastAccess < cutoff) sessions.delete(id);
  }
  if (sessions.size > MAX_SESSIONS) {
    const sorted = [...sessions.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    sorted.slice(0, sessions.size - MAX_SESSIONS).forEach(([id]) => sessions.delete(id));
  }
}

function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (typeof res.flush === "function") res.flush();
}

export default nextConnect()
  .use(auth)
  .post(async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }
    if (message.length > 5000) {
      return res.status(400).json({ message: "message too long (max 5000 characters)" });
    }

    evictStaleSessions();

    const userId = req.user.id;
    const rawSid = sessionId || crypto.randomUUID();
    const sid = `${userId}:${rawSid}`;
    const session = sessions.get(sid) ?? { messages: [], lastAccess: Date.now() };
    const history = session.messages;

    history.push({ role: "user", content: message.trim() });

    // Switch to SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const claudeService = getClaudeService();
      const { reply, updatedMessages } = await claudeService.chat(history, ({ text, progress, total }) => {
        sendEvent(res, { type: "progress", text, progress, total });
      });

      sessions.set(sid, { messages: updatedMessages, lastAccess: Date.now() });

      sendEvent(res, { type: "complete", reply, sessionId: rawSid });
    } catch (err) {
      console.error("[/api/chat/stream] Error:", err);
      sendEvent(res, { type: "error", message: "Failed to get AI response. Check ANTHROPIC_API_KEY." });
    }

    res.end();
  });
