export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ url: null, message: "Payment coming soon" });
  const { mark, email, product = "report", price = 99 } = req.body;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const unitAmount = parseInt(price) * 100 || 9900;
    const names = { report: { name: `Trademark Search Report — ${mark}` }, memo: { name: `Attorney Memo — ${mark}` } };
    const session = await stripe.checkout.sessions.create({ payment_method_types: ["card"], mode: "payment", customer_email: email || undefined, line_items: [{ price_data: { currency: "usd", unit_amount: unitAmount, product_data: names[product] || names.report }, quantity: 1 }], success_url: `${req.headers.origin}/?paid=true`, cancel_url: `${req.headers.origin}/`, metadata: { mark } });
    return res.status(200).json({ url: session.url });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
