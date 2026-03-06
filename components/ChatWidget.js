import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2: impression-agent
// Reads UTM params + referrer on widget open.
// Returns a personalized greeting and suggested questions.
// Pure frontend - no API call needed.
// ─────────────────────────────────────────────────────────────────────────────

function getImpressionContext() {
  if (typeof window === "undefined") return { source: "direct", medium: null, campaign: null, referrer: null };
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || null;
  const medium = params.get("utm_medium") || null;
  const campaign = params.get("utm_campaign") || null;
  const referrer = document.referrer || null;

  // Normalize referrer to domain
  let referrerDomain = null;
  try {
    if (referrer) referrerDomain = new URL(referrer).hostname.replace("www.", "");
  } catch { /* ignore */ }

  return { source, medium, campaign, referrer: referrerDomain };
}

function getPersonalizedGreeting(ctx) {
  const { source, medium, campaign, referrer } = ctx;
  const s = (source || "").toLowerCase();
  const m = (medium || "").toLowerCase();
  const c = (campaign || "").toLowerCase();
  const r = (referrer || "").toLowerCase();

  // Google Ads
  if (s === "google" && m === "cpc") {
    return {
      message: "Looks like you searched for trademark help - good instinct. The biggest mistake people make is filing without checking for conflicts first. Want me to walk you through a free search?",
      suggested: [
        "How do I check if my name is taken?",
        "What does it cost to file a trademark?",
        "How long does trademark registration take?",
        "What is a likelihood of confusion refusal?",
      ],
    };
  }

  // Google organic
  if (s === "google" || r.includes("google")) {
    return {
      message: "Hey - you found us through Google. Most people land here because they're about to file or just got a rejection. Which one is you?",
      suggested: [
        "I want to trademark my brand name",
        "I got an Office Action - what do I do?",
        "How do I search for conflicting trademarks?",
        "What is the USPTO filing fee?",
      ],
    };
  }

  // Instagram / TikTok / social
  if (s === "instagram" || s === "tiktok" || s === "facebook" || m === "social") {
    return {
      message: "Saw us on social? Quick version: you can search the entire USPTO trademark database for free right here. Takes 10 seconds. Want to try it?",
      suggested: [
        "Is my brand name available to trademark?",
        "How much does trademarking actually cost?",
        "Can I trademark a logo?",
        "What happens if I don't trademark my brand?",
      ],
    };
  }

  // Email campaign
  if (m === "email" || s === "email") {
    return {
      message: "Welcome back. If you're here from our email, you're probably looking at next steps for your trademark. I can help with that - what's on your mind?",
      suggested: [
        "What are my next steps after searching?",
        "How do I file a trademark application?",
        "What is the Watch plan and do I need it?",
        "How long until my trademark is registered?",
      ],
    };
  }

  // Referral from legal blog or law-related site
  if (r.includes("avvo") || r.includes("justia") || r.includes("nolo") || r.includes("law") || r.includes("legal") || r.includes("attorney")) {
    return {
      message: "Came from a legal resource? You're already doing your homework - that's the right move. What specific trademark question can I help you with?",
      suggested: [
        "What are the 13 DuPont factors?",
        "What is a Section 2(d) refusal?",
        "Do I need an attorney to file a trademark?",
        "What is TEAS Plus vs TEAS Standard?",
      ],
    };
  }

  // Pricing page
  if (typeof window !== "undefined" && window.location.pathname.includes("pricing")) {
    return {
      message: "Looking at pricing? Happy to help you figure out which service fits your situation. What are you trying to protect?",
      suggested: [
        "What is included in the AI Analysis Report?",
        "What is the difference between Watch and Defend?",
        "Do I need an attorney to file?",
        "What happens after I pay?",
      ],
    };
  }

  // Search results page - they just searched
  if (typeof window !== "undefined" && window.location.pathname.includes("search")) {
    return {
      message: "You just ran a search - want me to explain what those results mean and whether any of them are a real risk to your filing?",
      suggested: [
        "How do I read USPTO search results?",
        "What makes a trademark conflict serious?",
        "Should I be worried about similar marks in other classes?",
        "What is the next step after searching?",
      ],
    };
  }

  // Default generic
  return {
    message: "Hi, I'm MarkitBot. I can answer questions about trademark registration, USPTO fees, deadlines, and MarkItNow's services. What can I help you with?",
    suggested: [
      "Is my brand name available to trademark?",
      "What does an Office Action mean?",
      "How much does it cost to file a trademark?",
      "What happens if I miss a trademark deadline?",
    ],
  };
}

const SUGGESTED = [
  "Is my brand name available to trademark?",
  "What does an Office Action mean?",
  "How much does it cost to file a trademark?",
  "What happens if I miss a trademark deadline?",
];

const BOT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 19V5L12 13L21 5V19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function BotAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {BOT_ICON}
    </div>
  );
}

// Proactive closing card shown after 2nd user message
function ClosingCard({ router }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ margin: "4px 0 4px 38px", background: "#fff", border: "1.5px solid #c9a84c", borderRadius: "4px 16px 16px 16px", padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Based on your question</div>
      <p style={{ fontSize: 12, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
        The fastest way to know exactly where your brand stands is a free USPTO search followed by an AI conflict analysis. Most people have their answer in under 5 minutes.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
          Search Free
        </button>
        <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
          Get AI Report $99
        </button>
        <button onClick={() => setDismissed(true)} style={{ background: "none", color: "#ccc", border: "none", fontSize: 11, cursor: "pointer", fontFamily: "Poppins, sans-serif", padding: "7px 4px" }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const [showClosingCard, setShowClosingCard] = useState(false);
  const [impression, setImpression] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // impression-agent: runs once on first open, reads UTM + referrer
  useEffect(() => {
    if (open && !impression) {
      const ctx = getImpressionContext();
      setImpression(getPersonalizedGreeting(ctx));
    }
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showClosingCard]);

  // Count user messages - show closing card after 2nd
  const userMessageCount = messages.filter(m => m.role === "user").length;
  useEffect(() => {
    if (userMessageCount >= 2 && !showClosingCard) {
      setShowClosingCard(true);
    }
  }, [userMessageCount]);

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
        <div style={{ position: "fixed", bottom: 96, right: 28, zIndex: 1001, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Poppins, sans-serif", boxShadow: "0 2px 12px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          Questions? Ask MarkitBot
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
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {BOT_ICON}
            </div>
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
            AI assistant only - not legal advice. For legal counsel, use our <strong>Attorney Filing</strong> service.
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Welcome message - personalized by impression-agent */}
            {messages.length === 0 && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <BotAvatar />
                <div style={{ background: "#f4f4f4", borderRadius: "4px 16px 16px 16px", padding: "12px 14px", maxWidth: "85%", fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                  {impression?.message || "Hi, I'm MarkitBot. I can answer questions about trademark registration, USPTO fees, deadlines, and MarkItNow's services. What can I help you with?"}
                </div>
              </div>
            )}

            {/* Suggested questions - personalized by impression-agent */}
            {showSuggested && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, paddingLeft: 38 }}>SUGGESTED</div>
                {(impression?.suggested || SUGGESTED).map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ textAlign: "left", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "9px 14px", fontSize: 12, color: "#444", cursor: "pointer", fontFamily: "Poppins, sans-serif", lineHeight: 1.4 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation messages + closing card injection */}
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  {msg.role === "assistant" && <BotAvatar />}
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
                {/* Show closing card after 2nd assistant reply */}
                {msg.role === "assistant" && i === 3 && showClosingCard && (
                  <ClosingCard router={router} />
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <BotAvatar />
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
