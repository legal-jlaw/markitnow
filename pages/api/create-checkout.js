// pages/api/create-checkout.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, message: "Payment coming soon" });
  }

  const { mark, email, product = "report", price = 99, goodsServices, classCode } = req.body;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const unitAmount = parseInt(price) * 100 || 9900;
    const productNames = {
      report: { name: `Trademark Search Report - ${mark}`, description: "Full AI analysis PDF" },
      memo: { name: `Attorney Memo - ${mark}`, description: "Full legal memo PDF with DuPont analysis" },
    };
    const productInfo = productNames[product] || productNames.report;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email || undefined,
      line_items: [{ price_data: { currency: "usd", unit_amount: unitAmount, product_data: { name: productInfo.name, description: productInfo.description } }, quantity: 1 }],
      success_url: `${req.headers.origin}/report?mark=${encodeURIComponent(mark)}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/report?mark=${encodeURIComponent(mark)}`,
      metadata: { mark, product, goodsServices: goodsServices || "", classCode: classCode || "" },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
}
