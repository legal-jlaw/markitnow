-- ============================================================================
-- MarkItNow.ai — USPTO Trademark Database Schema
-- ============================================================================
-- Run this in Supabase SQL Editor (or psql) to set up the trademark database.
-- Requires: pg_trgm extension (for fuzzy / phonetic search)
-- ============================================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy trigram matching
CREATE EXTENSION IF NOT EXISTS unaccent;  -- strip diacritics for search

-- ============================================================================
-- 2. Core tables
-- ============================================================================

-- Main trademark records (one row per serial number)
CREATE TABLE IF NOT EXISTS trademarks (
  serial_number       TEXT PRIMARY KEY,          -- USPTO serial number (e.g. "90123456")
  registration_number TEXT,                       -- Registration number if granted
  mark_identification TEXT,                       -- The actual word mark (e.g. "STARBUCKS")
  mark_drawing_code   TEXT,                       -- 1=typed, 2=design+words, 3=design only, etc.

  -- Status
  status_code         TEXT,                       -- USPTO numeric status code (e.g. "800")
  status_date         DATE,                       -- Date of last status change
  status_label        TEXT,                       -- Human-readable: "Live/Registered", "Dead/Abandoned"

  -- Key dates
  filing_date         DATE,
  registration_date   DATE,
  abandonment_date    DATE,
  cancellation_date   DATE,
  republished_date    DATE,

  -- Attorney
  attorney_name       TEXT,

  -- Mark metadata
  mark_type           TEXT,                       -- "TRADEMARK", "SERVICE MARK", "COLLECTIVE MARK", etc.
  register_type       TEXT,                       -- "PRINCIPAL", "SUPPLEMENTAL"

  -- Search helpers (computed on insert/update)
  mark_identification_normalized TEXT,            -- lowercase, unaccented, stripped punctuation
  search_vector       tsvector,                   -- full-text search vector

  -- Bookkeeping
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  source_file         TEXT                        -- which XML file this came from
);

-- Owners (many-to-one → trademarks)
CREATE TABLE IF NOT EXISTS owners (
  id                  SERIAL PRIMARY KEY,
  serial_number       TEXT NOT NULL REFERENCES trademarks(serial_number) ON DELETE CASCADE,
  entry_number        TEXT,                       -- owner sequence within the mark
  party_type          TEXT,                       -- "10"=original applicant, "20"=current owner, etc.
  party_name          TEXT NOT NULL,
  legal_entity_type   TEXT,                       -- "01"=individual, "03"=corporation, etc.
  entity_statement    TEXT,
  address_1           TEXT,
  address_2           TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT,
  postcode            TEXT,
  nationality         TEXT,
  dba_aka_text        TEXT
);

-- International (Nice) classifications + goods & services descriptions
CREATE TABLE IF NOT EXISTS classifications (
  id                  SERIAL PRIMARY KEY,
  serial_number       TEXT NOT NULL REFERENCES trademarks(serial_number) ON DELETE CASCADE,
  international_code  TEXT,                       -- Nice class (e.g. "025" for clothing)
  us_code             TEXT,                       -- US classification code
  status_code         TEXT,                       -- classification-level status
  status_date         DATE,
  first_use_date      DATE,
  first_use_commerce  DATE,
  primary_code        TEXT                        -- "Y" if this is the primary class
);

-- Goods & Services text (from case-file-statements with type GS)
CREATE TABLE IF NOT EXISTS goods_services (
  id                  SERIAL PRIMARY KEY,
  serial_number       TEXT NOT NULL REFERENCES trademarks(serial_number) ON DELETE CASCADE,
  type_code           TEXT,                       -- "GS0421" = G&S for class 021, etc.
  description         TEXT NOT NULL,              -- Full goods/services text
  description_vector  tsvector                    -- full-text search on G&S
);

-- Design search codes (for logo/design marks)
CREATE TABLE IF NOT EXISTS design_searches (
  id                  SERIAL PRIMARY KEY,
  serial_number       TEXT NOT NULL REFERENCES trademarks(serial_number) ON DELETE CASCADE,
  design_code         TEXT NOT NULL               -- Vienna classification code
);

-- Events / prosecution history
CREATE TABLE IF NOT EXISTS events (
  id                  SERIAL PRIMARY KEY,
  serial_number       TEXT NOT NULL REFERENCES trademarks(serial_number) ON DELETE CASCADE,
  event_code          TEXT,
  event_type          TEXT,
  event_date          DATE,
  description_text    TEXT,
  sequence_number     INTEGER
);

-- Track which files we've already ingested (prevents re-processing)
CREATE TABLE IF NOT EXISTS ingestion_log (
  id                  SERIAL PRIMARY KEY,
  filename            TEXT NOT NULL UNIQUE,        -- e.g. "apc240101.zip"
  file_date           DATE,                        -- date the file covers
  records_processed   INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'pending',      -- pending, processing, done, error
  error_message       TEXT,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. Indexes for search performance
-- ============================================================================

-- Trigram index on mark name — powers fuzzy / "did you mean" search
CREATE INDEX IF NOT EXISTS idx_trademarks_mark_trgm
  ON trademarks USING gin (mark_identification_normalized gin_trgm_ops);

-- Full-text search index on mark name
CREATE INDEX IF NOT EXISTS idx_trademarks_search_vector
  ON trademarks USING gin (search_vector);

-- Full-text search on goods & services
CREATE INDEX IF NOT EXISTS idx_gs_description_vector
  ON goods_services USING gin (description_vector);

-- Status filtering (active vs dead marks)
CREATE INDEX IF NOT EXISTS idx_trademarks_status
  ON trademarks (status_code);

-- Filing date for sorting
CREATE INDEX IF NOT EXISTS idx_trademarks_filing_date
  ON trademarks (filing_date DESC NULLS LAST);

-- Owner name lookup
CREATE INDEX IF NOT EXISTS idx_owners_name_trgm
  ON owners USING gin (party_name gin_trgm_ops);

-- Serial number foreign keys
CREATE INDEX IF NOT EXISTS idx_owners_serial         ON owners (serial_number);
CREATE INDEX IF NOT EXISTS idx_classifications_serial ON classifications (serial_number);
CREATE INDEX IF NOT EXISTS idx_gs_serial             ON goods_services (serial_number);
CREATE INDEX IF NOT EXISTS idx_design_serial         ON design_searches (serial_number);
CREATE INDEX IF NOT EXISTS idx_events_serial         ON events (serial_number);

-- Nice class code filtering
CREATE INDEX IF NOT EXISTS idx_classifications_intl_code
  ON classifications (international_code);

-- ============================================================================
-- 4. Helper function: normalize mark text for search
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_mark(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      unaccent(COALESCE(input, '')),
      '[^a-z0-9 ]', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 5. Trigger: auto-populate search fields on insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION trademarks_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mark_identification_normalized := normalize_mark(NEW.mark_identification);
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.mark_identification, '') || ' ' ||
    COALESCE(NEW.registration_number, '') || ' ' ||
    COALESCE(NEW.serial_number, '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trademarks_search ON trademarks;
CREATE TRIGGER trg_trademarks_search
  BEFORE INSERT OR UPDATE ON trademarks
  FOR EACH ROW EXECUTE FUNCTION trademarks_search_trigger();

-- Trigger for goods_services full-text vector
CREATE OR REPLACE FUNCTION gs_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description_vector := to_tsvector('english', COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gs_search ON goods_services;
CREATE TRIGGER trg_gs_search
  BEFORE INSERT OR UPDATE ON goods_services
  FOR EACH ROW EXECUTE FUNCTION gs_search_trigger();

-- ============================================================================
-- 6. Status code lookup (maps USPTO numeric codes to human labels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS status_codes (
  code   TEXT PRIMARY KEY,
  label  TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false   -- true = live/pending mark
);

-- Populate common status codes
INSERT INTO status_codes (code, label, is_active) VALUES
  ('100', 'New Application - Record Initialized Not Assigned To Examiner', true),
  ('150', 'New Application - Assigned To Examiner', true),
  ('200', 'Non-Final Action - Mailed', true),
  ('220', 'Non-Final Action - Mailed (Image)', true),
  ('300', 'Amended After Non-Final Action', true),
  ('400', 'Final Refusal - Mailed', true),
  ('500', 'Abandoned - Failure To Respond Or Late Response', false),
  ('501', 'Abandoned - Express', false),
  ('502', 'Abandoned After Inter-Partes Decision', false),
  ('600', 'Approved For Publication', true),
  ('601', 'Published For Opposition', true),
  ('602', 'Published For Opposition - Loss Of Jurisdiction', true),
  ('700', 'Registered', true),
  ('710', 'Cancelled - Section 8', false),
  ('711', 'Cancelled - Section 71', false),
  ('712', 'Cancelled - Court Order', false),
  ('800', 'Registered And Renewed', true),
  ('900', 'Expired', false),
  ('950', 'Interference', true),
  ('960', 'Opposition Pending', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. Search function: the main query your API will call
-- ============================================================================

CREATE OR REPLACE FUNCTION search_trademarks(
  query_text TEXT,
  status_filter TEXT DEFAULT 'all',     -- 'all', 'active', 'dead'
  class_filter TEXT DEFAULT NULL,       -- Nice class code, e.g. '025'
  result_limit INTEGER DEFAULT 200,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  serial_number       TEXT,
  registration_number TEXT,
  mark_identification TEXT,
  status_code         TEXT,
  status_label        TEXT,
  is_active           BOOLEAN,
  filing_date         DATE,
  registration_date   DATE,
  owner_name          TEXT,
  class_codes         TEXT,
  description         TEXT,
  similarity_score    REAL
) AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  normalized_query := normalize_mark(query_text);

  RETURN QUERY
  SELECT DISTINCT ON (t.serial_number)
    t.serial_number,
    t.registration_number,
    t.mark_identification,
    t.status_code,
    COALESCE(sc.label, t.status_label, 'Unknown') AS status_label,
    COALESCE(sc.is_active, false) AS is_active,
    t.filing_date,
    t.registration_date,
    (SELECT o.party_name FROM owners o WHERE o.serial_number = t.serial_number ORDER BY o.entry_number LIMIT 1) AS owner_name,
    (SELECT string_agg(DISTINCT c.international_code, ', ' ORDER BY c.international_code)
     FROM classifications c WHERE c.serial_number = t.serial_number) AS class_codes,
    (SELECT string_agg(gs.description, '; ')
     FROM goods_services gs WHERE gs.serial_number = t.serial_number) AS description,
    similarity(t.mark_identification_normalized, normalized_query) AS similarity_score
  FROM trademarks t
  LEFT JOIN status_codes sc ON sc.code = t.status_code
  LEFT JOIN classifications cl ON cl.serial_number = t.serial_number
  WHERE (
    -- Trigram similarity match (fuzzy)
    similarity(t.mark_identification_normalized, normalized_query) > 0.15
    -- OR full-text search match
    OR t.search_vector @@ plainto_tsquery('english', query_text)
    -- OR exact containment
    OR t.mark_identification_normalized LIKE '%' || normalized_query || '%'
  )
  AND (
    status_filter = 'all'
    OR (status_filter = 'active' AND COALESCE(sc.is_active, false) = true)
    OR (status_filter = 'dead' AND COALESCE(sc.is_active, false) = false)
  )
  AND (
    class_filter IS NULL
    OR cl.international_code = class_filter
  )
  ORDER BY t.serial_number, similarity(t.mark_identification_normalized, normalized_query) DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Wrapper to get results sorted by relevance (use this from the API)
CREATE OR REPLACE FUNCTION search_trademarks_ranked(
  query_text TEXT,
  status_filter TEXT DEFAULT 'all',
  class_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 200,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  serial_number       TEXT,
  registration_number TEXT,
  mark_identification TEXT,
  status_code         TEXT,
  status_label        TEXT,
  is_active           BOOLEAN,
  filing_date         DATE,
  registration_date   DATE,
  owner_name          TEXT,
  class_codes         TEXT,
  description         TEXT,
  similarity_score    REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM search_trademarks(query_text, status_filter, class_filter, result_limit, result_offset)
  ORDER BY
    similarity_score DESC,
    is_active DESC,
    filing_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
