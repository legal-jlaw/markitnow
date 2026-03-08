-- ============================================================================
-- MarkItNow.ai — Payments table migration
-- ============================================================================
-- Run in Supabase SQL Editor after the main migration.
-- Tracks every Stripe checkout completion and delivery status.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                  SERIAL PRIMARY KEY,
  stripe_session_id   TEXT UNIQUE NOT NULL,         -- Stripe checkout session ID (dedup key)
  stripe_payment_intent TEXT,                       -- Payment intent ID for refunds/disputes
  email               TEXT NOT NULL,
  mark                TEXT NOT NULL,
  product             TEXT NOT NULL DEFAULT 'report', -- 'report', 'memo', 'filing'
  amount_cents        INTEGER NOT NULL,              -- Amount in cents (e.g. 9900 = $99)
  currency            TEXT DEFAULT 'usd',

  -- Delivery tracking
  analysis_status     TEXT DEFAULT 'pending',        -- pending, success, failed
  analysis_error      TEXT,
  email_status        TEXT DEFAULT 'pending',        -- pending, success, failed
  email_error         TEXT,
  resend_email_id     TEXT,                          -- Resend email ID for tracking

  -- Retry tracking
  retry_count         INTEGER DEFAULT 0,
  last_retry_at       TIMESTAMPTZ,
  next_retry_at       TIMESTAMPTZ,

  -- Metadata from Stripe session
  goods_services      TEXT,
  class_code          TEXT,
  customer_name       TEXT,

  -- Timestamps
  paid_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at        TIMESTAMPTZ,                   -- When email was successfully sent
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up by email (customer history)
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments (email);

-- Index for retry queue (find failed deliveries that need retrying)
CREATE INDEX IF NOT EXISTS idx_payments_retry ON payments (email_status, next_retry_at)
  WHERE email_status = 'failed' AND next_retry_at IS NOT NULL;

-- Index for Stripe session dedup
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments (stripe_session_id);
