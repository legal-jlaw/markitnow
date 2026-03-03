# MarkItNow.ai — Next.js Full Stack

A Trademarkia competitor with live USPTO search, AI analysis reports, and attorney filing.

## Architecture

```
markitnow/
├── pages/
│   ├── index.js          # Landing page
│   ├── search.js         # Search results + AI report
│   ├── file.js           # USPTO filing intake form
│   ├── api/
│   │   ├── trademark-search.js   # Proxies RapidAPI (solves CORS)
│   │   └── create-checkout.js    # Stripe payment
├── lib/
│   ├── uspto.js          # Client calls /api/trademark-search
│   └── ai.js             # Anthropic client reports
├── styles/globals.css
└── .env.local.example
```

## Why This Works (vs. Claude Artifact)

The artifact had CORS errors because browsers block cross-origin requests with custom headers. This Next.js app solves it:

```
Browser → /api/trademark-search  →  RapidAPI USPTO
              (your server)           (real data)
```

Your API key never touches the browser. No CORS. Real results.

---

## Deploy to Vercel in 5 Minutes

### 1. Clone & Install

```bash
cd markitnow
npm install
```

### 2. Set Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your real keys
```

Required keys:
- `RAPIDAPI_KEY` — Get at https://rapidapi.com/pentium10/api/uspto-trademark
- `NEXT_PUBLIC_ANTHROPIC_KEY` — Get at https://console.anthropic.com
- `STRIPE_SECRET_KEY` — Get at https://dashboard.stripe.com (optional, for $99 payments)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Same Stripe dashboard

### 3. Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Search "strange water" — should show Targa Studios LLC result
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel

# When prompted:
# - Link to existing project? No
# - Project name: markitnow
# - Which directory: ./
# - Override settings? No
```

### 5. Add Environment Variables to Vercel

```bash
vercel env add RAPIDAPI_KEY
vercel env add NEXT_PUBLIC_ANTHROPIC_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET

vercel --prod
```

Or add them in the Vercel dashboard: Settings → Environment Variables

### 6. Connect Custom Domain

In Vercel dashboard: Settings → Domains → Add `markitnow.ai`

Update DNS at your registrar:
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

---

## Revenue Model

| Tier | Price | What They Get |
|------|-------|---------------|
| Free | $0 | Live USPTO search, basic AI summary on screen |
| Report | $99 | Full PDF: DuPont analysis, risk matrix, attorney memo |
| File | $399 | Attorney reviews + files TEAS Plus application |

Trademarkia charges $499–$699 for attorney filing. You charge $399.

---

## Stack

- **Frontend**: Next.js 14, React 18
- **USPTO Data**: RapidAPI USPTO Trademark API
- **AI Analysis**: Anthropic Claude Sonnet
- **Payments**: Stripe Checkout
- **Deploy**: Vercel (free hobby tier)
- **Domain**: markitnow.ai

---

## Adding More Results (Like Trademarkia's 29,050)

RapidAPI's active endpoint returns exact/near-exact matches. To get broader results like Trademarkia:

**Option A**: Query multiple variations
```js
// In pages/api/trademark-search.js
const [exact, broader] = await Promise.all([
  fetch(`.../${mark}/active`),
  fetch(`.../${mark.split(' ')[0]}/active`), // first word only
]);
```

**Option B**: Use USPTO TESS directly (free, no API key)
```
https://tmsearch.uspto.gov/search/search-information?query=strange+water&queryOption=ALL
```
Trademarkia scrapes TESS with wildcard searches (`strange*`, `*water`, `str*er`).

**Option C**: Subscribe to USPTO bulk data
USPTO offers full database downloads at https://bulkdata.uspto.gov/
Load into PostgreSQL + ElasticSearch → full-text search → instant results.
This is what Trademarkia built. Takes a weekend to set up.

---

## Pending Items

- [ ] Wire Stripe webhook to mark sessions as paid
- [ ] Implement actual PDF generation (react-pdf or puppeteer)
- [ ] Add wildcard USPTO search for broader results
- [ ] Add email delivery of reports
- [ ] Replace placeholder testimonials
- [ ] Add Google Analytics / PostHog

---

## Security Note

Rotate the RapidAPI key that was exposed in the Claude artifact.
Get a new one at: https://rapidapi.com/pentium10/api/uspto-trademark
