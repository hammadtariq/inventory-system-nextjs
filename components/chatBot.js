"use client";
import { useState, useRef, useEffect } from "react";
import { Drawer, Input, Button, Typography, Avatar } from "antd";
import { MessageOutlined, ArrowUpOutlined, RobotOutlined, UserOutlined, CloseOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const { Text } = Typography;

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "Hi! I'm your inventory assistant. How can I help you today?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPct, setProgressPct] = useState(null);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("chatSessionId") || null;
    return null;
  });
  const msgCounter = useRef(100);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMessage = {
      id: ++msgCounter.current,
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);
    setProgressText("");
    setProgressPct(null);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reply = null;
      let newSessionId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep any incomplete chunk

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const event = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              if (event.text) setProgressText(event.text);
              if (event.progress !== undefined && event.total) {
                setProgressPct(Math.round((event.progress / event.total) * 100));
              }
            } else if (event.type === "complete") {
              reply = event.reply;
              newSessionId = event.sessionId;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }
      }

      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
        sessionStorage.setItem("chatSessionId", newSessionId);
      }

      if (reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: ++msgCounter.current,
            role: "assistant",
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: ++msgCounter.current,
          role: "assistant",
          text: `Error: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setProgressText("");
      setProgressPct(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "#1677ff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0, 145, 255, 0.5)",
          zIndex: 1000,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(72, 95, 245, 0.65)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 98, 255, 0.5)";
        }}
      >
        <MessageOutlined style={{ fontSize: 22, color: "#fff" }} />
      </button>

      {/* Chat Drawer */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        width={1000}
        closable={false}
        styles={{
          body: { padding: 0, display: "flex", flexDirection: "column", backgroundColor: "#f5f5f5" },
          header: { display: "none" },
          wrapper: { boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" },
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#001529",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #1677ff",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar size={36} icon={<RobotOutlined />} style={{ backgroundColor: "#1677ff", flexShrink: 0 }} />
            <div style={{ lineHeight: 1.3 }}>
              <Text strong style={{ color: "#fff", display: "block", fontSize: 14 }}>
                AI Assistant
              </Text>
              <Text style={{ color: "#52c41a", fontSize: 11 }}>● Online</Text>
            </div>
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} style={{ color: "#aaa" }} />
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <Avatar
                  size={28}
                  icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: isUser ? "#1677ff" : "#001529",
                    flexShrink: 0,
                  }}
                />
                <div style={{ maxWidth: isUser ? "72%" : "90%" }}>
                  <div
                    style={{
                      backgroundColor: isUser ? "#1677ff" : "#fff",
                      color: isUser ? "#fff" : "#1a1a1a",
                      padding: "9px 13px",
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      wordBreak: "break-word",
                    }}
                  >
                    {isUser ? (
                      msg.text
                    ) : (
                      <div className="chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: (props) => (
                              <table
                                style={{
                                  borderCollapse: "collapse",
                                  width: "100%",
                                  fontSize: 12,
                                  marginTop: 6,
                                  marginBottom: 6,
                                  tableLayout: "auto",
                                }}
                                {...props}
                              />
                            ),
                            th: (props) => (
                              <th
                                style={{
                                  border: "1px solid #b0b0b0",
                                  borderBottom: "2px solid #999",
                                  padding: "6px 10px",
                                  backgroundColor: "#e8e8e8",
                                  textAlign: "left",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                  color: "#222",
                                }}
                                {...props}
                              />
                            ),
                            td: (props) => (
                              <td
                                style={{ border: "1px solid #d0d0d0", padding: "5px 10px", whiteSpace: "nowrap" }}
                                {...props}
                              />
                            ),
                            p: (props) => <p style={{ margin: "4px 0" }} {...props} />,
                            h1: (props) => (
                              <h1 style={{ fontSize: 15, fontWeight: 700, margin: "8px 0 4px" }} {...props} />
                            ),
                            h2: (props) => (
                              <h2 style={{ fontSize: 14, fontWeight: 700, margin: "8px 0 4px" }} {...props} />
                            ),
                            h3: (props) => (
                              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 3px" }} {...props} />
                            ),
                            ul: (props) => <ul style={{ paddingLeft: 18, margin: "4px 0" }} {...props} />,
                            ol: (props) => <ol style={{ paddingLeft: 18, margin: "4px 0" }} {...props} />,
                            li: (props) => <li style={{ marginBottom: 2 }} {...props} />,
                            strong: (props) => <strong style={{ fontWeight: 600 }} {...props} />,
                            hr: () => (
                              <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "8px 0" }} />
                            ),
                            code: ({ inline, ...props }) =>
                              inline ? (
                                <code
                                  style={{
                                    backgroundColor: "#f0f0f0",
                                    padding: "1px 4px",
                                    borderRadius: 3,
                                    fontSize: 12,
                                  }}
                                  {...props}
                                />
                              ) : (
                                <pre
                                  style={{
                                    backgroundColor: "#f5f5f5",
                                    padding: 8,
                                    borderRadius: 6,
                                    overflowX: "auto",
                                    fontSize: 12,
                                  }}
                                >
                                  <code {...props} />
                                </pre>
                              ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#999",
                      display: "block",
                      marginTop: 3,
                      textAlign: isUser ? "right" : "left",
                    }}
                  >
                    {msg.time}
                  </Text>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <Avatar size={28} icon={<RobotOutlined />} style={{ backgroundColor: "#1677ff", flexShrink: 0 }} />
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  minWidth: 120,
                  maxWidth: 260,
                }}
              >
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#bbb",
                        display: "inline-block",
                        animation: "bounce 1.2s infinite",
                        animationDelay: `${i * 0.2}s`,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  {progressText && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 12,
                        color: "#555",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {progressText}
                    </span>
                  )}
                </div>
                {progressPct !== null && progressPct < 100 && (
                  <div
                    style={{
                      marginTop: 7,
                      height: 3,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progressPct}%`,
                        backgroundColor: "#1677ff",
                        borderRadius: 2,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "12px 14px 16px",
            backgroundColor: "#f5f5f5",
            borderTop: "1px solid #c3c3c3",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#e3e3e3",
              borderRadius: 14,
              padding: "6px 6px 6px 14px",
              gap: 8,
            }}
          >
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              autoSize={{ minRows: 1, maxRows: 5 }}
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                boxShadow: "none",
                color: "#000000",
                fontSize: 16,
                resize: "none",
                padding: 0,
              }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: "none",
                cursor: inputValue.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                visibility: inputValue.trim() ? "visible" : "hidden",
              }}
            >
              <ArrowUpOutlined style={{ fontSize: 14, color: "#1a1a1a" }} />
            </button>
          </div>
        </div>
      </Drawer>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        .chat-markdown table {
          display: block;
          overflow-x: auto;
        }
        .chat-markdown tr:nth-child(even) td {
          background-color: #fafafa;
        }
      `}</style>
    </>
  );
}
