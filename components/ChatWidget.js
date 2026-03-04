import { useState, useRef, useEffect } from "react";

const SUGGESTED = [
  "How much does it cost to trademark a name?",
  "What's the difference between DIY and attorney filing?",
  "How long does trademark registration take?",
  "What is an Office Action?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setShowSuggested(false);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, something went wrong. Please try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again in a moment." }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Tooltip bubble */}
      {!open && messages.length === 0 && (
        <div style={{ position: "fixed", bottom: 96, right: 28, zIndex: 1001, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#333", fontFamily: "Poppins, sans-serif", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
          Questions? Ask MarkitBot ✨
        </div>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 1000,
          width: 380, height: 560,
          background: "#fff", borderRadius: 20,
          boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", border: "1px solid #e8e8e8",
          fontFamily: "Poppins, sans-serif",
          animation: "slideUp 0.2s ease",
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} @keyframes blink{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>

          {/* Header */}
          <div style={{ background: "#111", padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>MarkitBot</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Trademark support · Instant answers</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Online</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ background: "#fff8e6", borderBottom: "1px solid #f0d080", padding: "8px 16px", fontSize: 11, color: "#b8860b", flexShrink: 0 }}>
            ⚠️ AI assistant only — not legal advice. For legal counsel, use our <strong>Attorney Filing</strong> service.
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Welcome message */}
            {messages.length === 0 && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                <div style={{ background: "#f4f4f4", borderRadius: "4px 16px 16px 16px", padding: "12px 14px", maxWidth: "85%", fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                  Hi! I'm MarkitBot 👋 I can answer questions about trademark registration, USPTO fees, the filing process, and MarkItNow's services. What can I help you with?
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggested && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, paddingLeft: 38 }}>SUGGESTED</div>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ textAlign: "left", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "9px 14px", fontSize: 12, color: "#444", cursor: "pointer", fontFamily: "Poppins, sans-serif", lineHeight: 1.4 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                )}
                <div style={{
                  background: msg.role === "user" ? "#111" : "#f4f4f4",
                  color: msg.role === "user" ? "#fff" : "#333",
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "12px 14px", maxWidth: "85%", fontSize: 13, lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚖️</div>
                <div style={{ background: "#f4f4f4", borderRadius: "4px 16px 16px 16px", padding: "14px 18px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#aaa", animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ borderTop: "1px solid #e8e8e8", padding: "12px 14px", display: "flex", gap: 8, flexShrink: 0, background: "#fff" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a trademark question..."
              disabled={loading}
              style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "Poppins, sans-serif", outline: "none", color: "#111", background: loading ? "#fafafa" : "#fff" }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: input.trim() && !loading ? "#c9a84c" : "#e8e8e8",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#fff" : "#aaa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1002,
        width: 56, height: 56, borderRadius: "50%",
        background: open ? "#111" : "#c9a84c",
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s, transform 0.2s",
        transform: open ? "scale(0.95)" : "scale(1)",
      }}>
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </button>
    </>
  );
}
