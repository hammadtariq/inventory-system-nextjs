import nextConnect from "next-connect";
import { auth } from "@/middlewares/auth";
import { getClaudeService } from "@/lib/claude-service";

// Per-session conversation history: sessionId -> { messages, lastAccess }
const sessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_SESSIONS = 200;

function evictStaleSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions) {
    if (session.lastAccess < cutoff) sessions.delete(id);
  }
  // If still too many, evict oldest
  if (sessions.size > MAX_SESSIONS) {
    const sorted = [...sessions.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    sorted.slice(0, sessions.size - MAX_SESSIONS).forEach(([id]) => sessions.delete(id));
  }
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

    // Scope session key to the authenticated user so users cannot access each other's history
    const userId = req.user.id;
    const rawSid = sessionId || crypto.randomUUID();
    const sid = `${userId}:${rawSid}`;
    const session = sessions.get(sid) ?? { messages: [], lastAccess: Date.now() };
    const history = session.messages;

    history.push({ role: "user", content: message.trim() });

    try {
      const claudeService = getClaudeService();
      const { reply, updatedMessages } = await claudeService.chat(history);

      sessions.set(sid, { messages: updatedMessages, lastAccess: Date.now() });

      return res.status(200).json({ reply, sessionId: rawSid });
    } catch (err) {
      console.error("[/api/chat/message] Error:", err);
      return res.status(500).json({ message: "Failed to get AI response. Check ANTHROPIC_API_KEY." });
    }
  })
  .delete(async (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) {
      sessions.delete(`${req.user.id}:${sessionId}`);
    }
    return res.status(200).json({ success: true });
  });
