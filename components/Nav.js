import { useState } from "react";
import { useRouter } from "next/router";

const NAV_LINKS = [
  { label: "How It Works", path: "/how-it-works" },
  { label: "Pricing", path: "/pricing" },
  { label: "FAQ", path: "/faq" },
];

export default function Nav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 64, maxWidth: 1200, margin: "0 auto" }}>
        <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5, cursor: "pointer", flexShrink: 0 }}>
          MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {NAV_LINKS.map(l => (
            <button key={l.label} onClick={() => router.push(l.path)} style={{ background: "none", border: "none", color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Poppins, sans-serif", padding: "8px 12px", borderRadius: 8 }}>{l.label}</button>
          ))}
          <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif", marginLeft: 8 }}>File Now</button>
        </div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8 }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>
      {menuOpen && (
        <div style={{ background: "#fff", borderTop: "1px solid #f0f0f0", padding: "12px 24px 20px" }}>
          {NAV_LINKS.map(l => (
            <button key={l.label} onClick={() => { router.push(l.path); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "#333", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "Poppins, sans-serif", padding: "12px 0", borderBottom: "1px solid #f4f4f4" }}>{l.label}</button>
          ))}
          <button onClick={() => { router.push("/file"); setMenuOpen(false); }} style={{ display: "block", width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", marginTop: 12 }}>File Now</button>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
