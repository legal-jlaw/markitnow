// pages/api/verify-payment.js
// Verifies a Stripe Checkout session was actually paid.
// Called from the frontend after redirect back from Stripe.
//
// GET /api/verify-payment?session_id=cs_live_xxx

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "session_id required" });

  if (!process.env.STRIPE_SECRET_KEY) {
    // Dev mode: no Stripe configured, allow access
    return res.status(200).json({ paid: true, product: "report", dev: true });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      return res.status(200).json({
        paid: true,
        product: session.metadata?.product || "report",
        mark: session.metadata?.mark || "",
      });
    }

    return res.status(200).json({ paid: false });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(200).json({ paid: false, error: err.message });
  }
}
