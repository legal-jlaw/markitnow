// pages/api/create-checkout.js
// Creates a Stripe Checkout session for $99 PDF report unlock

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mark, email } = req.body;

  try {
    // Dynamically import Stripe to avoid issues if key not set
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { product = "report", price = 99 } = req.body;
    const unitAmount = parseInt(price) * 100 || 9900;
    const productNames = {
      report: { name: `Trademark Search Report — ${mark}`, description: "Full AI analysis PDF: DuPont factors, risk matrix, prosecution strategy" },
      memo: { name: `Attorney Memo — ${mark}`, description: "Full legal memo PDF: DuPont 13-factor analysis, risk matrix, prosecution strategy, case citations" },
    };
    const productInfo = productNames[product] || productNames.report;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: { name: productInfo.name, description: productInfo.description },
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/report?mark=${encodeURIComponent(mark)}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/report?mark=${encodeURIComponent(mark)}`,
      metadata: { mark },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
}
