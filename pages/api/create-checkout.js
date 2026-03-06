// pages/api/create-checkout.js
// Creates a Stripe Checkout session for report/memo purchases.
// Returns the user to the search page with a session_id on success.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, message: "Payment coming soon" });
  }

  const { mark, email, product = "report", price = 99 } = req.body;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const unitAmount = parseInt(price) * 100 || 9900;

    const names = {
      report: { name: `Trademark Client Report — "${mark}"`, description: "AI conflict analysis, risk score, DuPont factors" },
      memo: { name: `Attorney Memo — "${mark}"`, description: "Full legal memorandum with case citations and prosecution strategy" },
    };

    const productData = names[product] || names.report;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: productData,
          },
          quantity: 1,
        },
      ],
      // Return to search page with session ID for verification
      success_url: `${req.headers.origin}/search?mark=${encodeURIComponent(mark)}&paid=${product}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/search?mark=${encodeURIComponent(mark)}`,
      metadata: {
        mark,
        product,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
