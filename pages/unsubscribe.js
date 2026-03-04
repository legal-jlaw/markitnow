import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";

export default function Unsubscribe() {
  const router = useRouter();
  const { email } = router.query;
  const [done, setDone] = useState(false);

  async function handleUnsubscribe() {
    // In production, call your email provider's unsubscribe API here
    console.log("Unsubscribe request:", email);
    setDone(true);
  }

  useEffect(() => {
    if (email) handleUnsubscribe();
  }, [email]);

  return (
    <>
      <Head>
        <title>Unsubscribe | MarkItNow.ai</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "48px 40px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {done ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 20 }}>✓</div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 12 }}>You've been unsubscribed.</h1>
                <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 28 }}>We've removed {email} from our email list. You won't receive any more messages from us.</p>
                <button onClick={() => router.push("/")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                  Back to MarkItNow.ai
                </button>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", marginBottom: 12 }}>Processing...</h1>
                <p style={{ fontSize: 14, color: "#888" }}>Removing you from our list.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
