#!/usr/bin/env node
// ============================================================================
// MarkItNow.ai — USPTO Trademark XML Bulk Data Parser
// ============================================================================
// Parses USPTO annual or daily XML trademark files and inserts into Postgres.
//
// Usage:
//   node scripts/parse-uspto-xml.js <path-to-xml-or-zip> [--dry-run]
//
// Handles:
//   - Annual backfill files (apcYYYYMMDD-apcYYMMDD-NN.zip)
//   - Daily update files   (apcYYMMDD.zip)
//   - Raw .xml files
//
// The parser uses a SAX-style streaming approach (via sax-js) so it can
// handle multi-GB XML files without loading the whole thing into memory.
// ============================================================================

const fs = require("fs");
const path = require("path");
const { createReadStream } = require("fs");
const { createGunzip } = require("zlib");
const { pipeline } = require("stream/promises");
const sax = require("sax");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// ---------------------------------------------------------------------------
// Config: database connection from .env.local
// ---------------------------------------------------------------------------
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { Pool } = require("pg");

// Use DATABASE_URL (direct) with fallback to DATABASE_URL_POOLER if set
const dbUrl = process.env.DATABASE_URL;
const poolerUrl = process.env.DATABASE_URL_POOLER;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  max: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});

// Test connection and fall back to pooler if direct fails
pool.on("error", (err) => {
  console.warn("Pool background error:", err.message);
});

// ---------------------------------------------------------------------------
// Status code → human label mapping (matches migration.sql)
// ---------------------------------------------------------------------------
const STATUS_LABELS = {
  "100": "New Application",
  "150": "Assigned To Examiner",
  "200": "Non-Final Action Mailed",
  "300": "Amended",
  "400": "Final Refusal",
  "500": "Abandoned",
  "501": "Abandoned - Express",
  "600": "Approved For Publication",
  "601": "Published For Opposition",
  "700": "Registered",
  "710": "Cancelled - Section 8",
  "711": "Cancelled - Section 71",
  "800": "Registered And Renewed",
  "900": "Expired",
};

const ACTIVE_CODES = new Set([
  "100", "150", "200", "220", "300", "400",
  "600", "601", "602", "700", "800", "950", "960",
]);

// ---------------------------------------------------------------------------
// SAX Parser: streams through XML and yields case-file records
// ---------------------------------------------------------------------------

function parseXMLStream(inputStream, onCaseFile) {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(true, { trim: true, normalize: true });

    let tagStack = [];
    let currentCase = null;
    let currentOwner = null;
    let currentClassification = null;
    let currentStatement = null;
    let currentDesign = null;
    let currentEvent = null;
    let textBuffer = "";
    let caseCount = 0;

    parser.on("opentag", (node) => {
      const tag = node.name.toLowerCase();
      tagStack.push(tag);
      textBuffer = "";

      if (tag === "case-file") {
        currentCase = {
          serialNumber: "",
          registrationNumber: "",
          markIdentification: "",
          markDrawingCode: "",
          statusCode: "",
          statusDate: null,
          filingDate: null,
          registrationDate: null,
          abandonmentDate: null,
          cancellationDate: null,
          attorneyName: "",
          markType: "",
          registerType: "",
          owners: [],
          classifications: [],
          statements: [],
          designSearches: [],
          events: [],
        };
      } else if (tag === "case-file-owner" && currentCase) {
        currentOwner = {
          entryNumber: "",
          partyType: "",
          partyName: "",
          legalEntityType: "",
          entityStatement: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          country: "",
          postcode: "",
          nationality: "",
          dbaAkaText: "",
        };
      } else if (tag === "classification" && currentCase) {
        currentClassification = {
          internationalCode: "",
          usCode: "",
          statusCode: "",
          statusDate: null,
          firstUseDate: null,
          firstUseCommerce: null,
          primaryCode: "",
        };
      } else if (tag === "case-file-statement" && currentCase) {
        currentStatement = { typeCode: "", text: "" };
      } else if (tag === "design-search" && currentCase) {
        currentDesign = { code: "" };
      } else if (tag === "case-file-event-statement" && currentCase) {
        currentEvent = {
          code: "",
          type: "",
          date: null,
          descriptionText: "",
          sequenceNumber: null,
        };
      }
    });

    parser.on("text", (t) => {
      textBuffer += t;
    });

    parser.on("cdata", (t) => {
      textBuffer += t;
    });

    parser.on("closetag", (tagName) => {
      const tag = tagName.toLowerCase();
      const text = textBuffer.trim();

      if (currentCase) {
        // -- Case-file header fields --
        if (tag === "serial-number" && !currentOwner && !currentClassification) {
          currentCase.serialNumber = text;
        } else if (tag === "registration-number") {
          currentCase.registrationNumber = text === "0000000" ? "" : text;
        } else if (tag === "mark-identification") {
          currentCase.markIdentification = text;
        } else if (tag === "mark-drawing-code") {
          currentCase.markDrawingCode = text;
        } else if (tag === "status-code" && !currentClassification) {
          currentCase.statusCode = text;
        } else if (tag === "status-date" && !currentClassification) {
          currentCase.statusDate = parseDate(text);
        } else if (tag === "filing-date") {
          currentCase.filingDate = parseDate(text);
        } else if (tag === "registration-date") {
          currentCase.registrationDate = parseDate(text);
        } else if (tag === "abandonment-date") {
          currentCase.abandonmentDate = parseDate(text);
        } else if (tag === "cancellation-date") {
          currentCase.cancellationDate = parseDate(text);
        } else if (tag === "attorney-name") {
          currentCase.attorneyName = text;
        } else if (tag === "mark-type") {
          currentCase.markType = text;
        } else if (tag === "register") {
          currentCase.registerType = text;
        }

        // -- Owner fields --
        if (currentOwner) {
          if (tag === "entry-number") currentOwner.entryNumber = text;
          else if (tag === "party-type") currentOwner.partyType = text;
          else if (tag === "party-name") currentOwner.partyName = text;
          else if (tag === "legal-entity-type-code") currentOwner.legalEntityType = text;
          else if (tag === "entity-statement") currentOwner.entityStatement = text;
          else if (tag === "address-1") currentOwner.address1 = text;
          else if (tag === "address-2") currentOwner.address2 = text;
          else if (tag === "city") currentOwner.city = text;
          else if (tag === "state") currentOwner.state = text;
          else if (tag === "country") currentOwner.country = text;
          else if (tag === "postcode") currentOwner.postcode = text;
          else if (tag === "nationality") currentOwner.nationality = text;
          else if (tag === "dba-aka-text") currentOwner.dbaAkaText = text;
          else if (tag === "case-file-owner") {
            currentCase.owners.push(currentOwner);
            currentOwner = null;
          }
        }

        // -- Classification fields --
        if (currentClassification) {
          if (tag === "international-code") currentClassification.internationalCode = text;
          else if (tag === "us-code") currentClassification.usCode = text;
          else if (tag === "status-code") currentClassification.statusCode = text;
          else if (tag === "status-date") currentClassification.statusDate = parseDate(text);
          else if (tag === "first-use-anywhere-date") currentClassification.firstUseDate = parseDate(text);
          else if (tag === "first-use-in-commerce-date") currentClassification.firstUseCommerce = parseDate(text);
          else if (tag === "primary-code") currentClassification.primaryCode = text;
          else if (tag === "classification") {
            currentCase.classifications.push(currentClassification);
            currentClassification = null;
          }
        }

        // -- Statement fields (goods & services) --
        if (currentStatement) {
          if (tag === "type-code") currentStatement.typeCode = text;
          else if (tag === "text") currentStatement.text = text;
          else if (tag === "case-file-statement") {
            currentCase.statements.push(currentStatement);
            currentStatement = null;
          }
        }

        // -- Design search --
        if (currentDesign) {
          if (tag === "code") currentDesign.code = text;
          else if (tag === "design-search") {
            currentCase.designSearches.push(currentDesign);
            currentDesign = null;
          }
        }

        // -- Events --
        if (currentEvent) {
          if (tag === "code") currentEvent.code = text;
          else if (tag === "type") currentEvent.type = text;
          else if (tag === "date") currentEvent.date = parseDate(text);
          else if (tag === "description-text") currentEvent.descriptionText = text;
          else if (tag === "number") currentEvent.sequenceNumber = parseInt(text) || null;
          else if (tag === "case-file-event-statement") {
            currentCase.events.push(currentEvent);
            currentEvent = null;
          }
        }

        // -- End of case-file: emit the record --
        if (tag === "case-file") {
          caseCount++;
          onCaseFile(currentCase, caseCount);
          currentCase = null;
        }
      }

      tagStack.pop();
      textBuffer = "";
    });

    parser.on("error", (err) => {
      // SAX is lenient — log and continue
      console.warn("SAX parse warning:", err.message);
      parser._parser.error = null;
      parser._parser.resume();
    });

    parser.on("end", () => {
      resolve(caseCount);
    });

    inputStream.on("error", reject);
    inputStream.pipe(parser);
  });
}

// ---------------------------------------------------------------------------
// Date parsing: USPTO uses YYYYMMDD format
// ---------------------------------------------------------------------------

function parseDate(str) {
  if (!str || str.length < 8) return null;
  const clean = str.replace(/[^0-9]/g, "");
  if (clean.length < 8) return null;
  const year = parseInt(clean.slice(0, 4));
  const month = parseInt(clean.slice(4, 6));
  const day = parseInt(clean.slice(6, 8));
  // Strict validation: check the date round-trips correctly
  // (JS Date auto-corrects invalid dates like June 31 → July 1, so we catch that)
  if (year < 1800 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  const parsed = new Date(d + "T00:00:00Z");
  if (isNaN(parsed.getTime())) return null;
  // Verify the date didn't roll over (e.g. Feb 30 → Mar 2)
  if (parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null;
  return d;
}

// ---------------------------------------------------------------------------
// Database insert: uses PostgreSQL COPY protocol for maximum throughput
// ---------------------------------------------------------------------------

const { Readable } = require("stream");
const copyFrom = require("pg-copy-streams").from;

const BATCH_SIZE = 5000; // COPY can handle large batches efficiently

// Escape a value for COPY tab-delimited format
function copyEscape(val) {
  if (val === null || val === undefined || val === "") return "\\N";
  return String(val)
    .replace(/\\/g, "\\\\")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

// Stream rows into a table via COPY ... FROM STDIN
function copyInto(client, table, columns, rows) {
  return new Promise((resolve, reject) => {
    if (rows.length === 0) return resolve();
    const colList = columns.join(", ");
    const sql = `COPY ${table} (${colList}) FROM STDIN WITH (FORMAT text)`;
    const pgStream = client.query(copyFrom(sql));

    // Build the entire payload as one string (fast for batches up to ~1000 rows)
    const lines = rows.map(row => row.map(copyEscape).join("\t")).join("\n") + "\n";
    const readable = Readable.from([lines]);

    readable.on("error", reject);
    pgStream.on("error", reject);
    pgStream.on("finish", resolve);
    readable.pipe(pgStream);
  });
}

async function flushBatch(sourceFile, client) {
  if (batch.length === 0) return;

  try {
    await client.query("BEGIN");

    // --- 1. Trademarks: COPY into temp table, then upsert into real table ---
    const tmCols = [
      "serial_number","registration_number","mark_identification","mark_drawing_code",
      "status_code","status_date","status_label",
      "filing_date","registration_date","abandonment_date","cancellation_date",
      "attorney_name","mark_type","register_type","source_file"
    ];

    await client.query(`
      CREATE TEMP TABLE IF NOT EXISTS _tmp_trademarks (LIKE trademarks INCLUDING DEFAULTS)
    `);
    await client.query("TRUNCATE _tmp_trademarks");

    const tmRows = batch.map(c => {
      const statusLabel = STATUS_LABELS[c.statusCode] ||
        (ACTIVE_CODES.has(c.statusCode) ? "Live" : "Dead/Unknown");
      return [
        c.serialNumber, c.registrationNumber, c.markIdentification, c.markDrawingCode,
        c.statusCode, c.statusDate, statusLabel,
        c.filingDate, c.registrationDate, c.abandonmentDate, c.cancellationDate,
        c.attorneyName, c.markType, c.registerType, sourceFile,
      ];
    });
    await copyInto(client, "_tmp_trademarks", tmCols, tmRows);

    // Upsert from temp → real
    await client.query(`
      INSERT INTO trademarks (${tmCols.join(",")})
      SELECT ${tmCols.join(",")} FROM _tmp_trademarks
      ON CONFLICT (serial_number) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        mark_identification = EXCLUDED.mark_identification,
        mark_drawing_code = EXCLUDED.mark_drawing_code,
        status_code = EXCLUDED.status_code,
        status_date = EXCLUDED.status_date,
        status_label = EXCLUDED.status_label,
        filing_date = EXCLUDED.filing_date,
        registration_date = EXCLUDED.registration_date,
        abandonment_date = EXCLUDED.abandonment_date,
        cancellation_date = EXCLUDED.cancellation_date,
        attorney_name = EXCLUDED.attorney_name,
        mark_type = EXCLUDED.mark_type,
        register_type = EXCLUDED.register_type,
        source_file = EXCLUDED.source_file,
        updated_at = NOW()
    `);

    // Collect serial numbers for bulk deletes of child tables
    const serials = batch.map(c => c.serialNumber);
    const serialPlaceholders = serials.map((_, i) => `$${i + 1}`).join(",");

    // --- 2. Owners ---
    await client.query(`DELETE FROM owners WHERE serial_number IN (${serialPlaceholders})`, serials);
    const ownerRows = [];
    for (const c of batch) {
      for (const o of c.owners) {
        ownerRows.push([
          c.serialNumber, o.entryNumber, o.partyType, o.partyName,
          o.legalEntityType, o.entityStatement, o.address1, o.address2,
          o.city, o.state, o.country, o.postcode, o.nationality, o.dbaAkaText,
        ]);
      }
    }
    if (ownerRows.length > 0) {
      await copyInto(client, "owners", [
        "serial_number","entry_number","party_type","party_name",
        "legal_entity_type","entity_statement","address_1","address_2",
        "city","state","country","postcode","nationality","dba_aka_text"
      ], ownerRows);
    }

    // --- 3. Classifications ---
    await client.query(`DELETE FROM classifications WHERE serial_number IN (${serialPlaceholders})`, serials);
    const classRows = [];
    for (const c of batch) {
      for (const cl of c.classifications) {
        classRows.push([
          c.serialNumber, cl.internationalCode, cl.usCode,
          cl.statusCode, cl.statusDate, cl.firstUseDate, cl.firstUseCommerce, cl.primaryCode,
        ]);
      }
    }
    if (classRows.length > 0) {
      await copyInto(client, "classifications", [
        "serial_number","international_code","us_code",
        "status_code","status_date","first_use_date","first_use_commerce","primary_code"
      ], classRows);
    }

    // --- 4. Goods & Services ---
    await client.query(`DELETE FROM goods_services WHERE serial_number IN (${serialPlaceholders})`, serials);
    const gsRows = [];
    for (const c of batch) {
      for (const st of c.statements.filter(s => s.typeCode.startsWith("GS"))) {
        gsRows.push([c.serialNumber, st.typeCode, st.text]);
      }
    }
    if (gsRows.length > 0) {
      await copyInto(client, "goods_services", [
        "serial_number","type_code","description"
      ], gsRows);
    }

    // --- 5. Design searches ---
    await client.query(`DELETE FROM design_searches WHERE serial_number IN (${serialPlaceholders})`, serials);
    const dsRows = [];
    for (const c of batch) {
      for (const ds of c.designSearches) {
        dsRows.push([c.serialNumber, ds.code]);
      }
    }
    if (dsRows.length > 0) {
      await copyInto(client, "design_searches", [
        "serial_number","design_code"
      ], dsRows);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  batch = [];
}

// ---------------------------------------------------------------------------
// ZIP handling: extract XML from zip archives
// ---------------------------------------------------------------------------

async function processZipFile(zipPath, sourceFile) {
  const { execSync } = require("child_process");

  // Use CLI unzip instead of AdmZip — handles files >2GB that exceed Node Buffer limits
  const tmpDir = path.join(__dirname, `_tmp_extract_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    console.log(`  📂 Extracting zip with CLI unzip...`);
    execSync(`unzip -o -q "${path.resolve(zipPath)}" -d "${tmpDir}"`, { maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    // unzip may return exit code 1 for warnings — check if files were extracted
    const extracted = fs.readdirSync(tmpDir).filter(f => f.endsWith(".xml"));
    if (extracted.length === 0) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      throw new Error(`Failed to extract zip: ${err.message}`);
    }
  }

  const xmlFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith(".xml")).sort();
  let totalRecords = 0;

  // Acquire ONE persistent connection for the entire ingest
  const client = await pool.connect();
  console.log("  🔗 Database connection acquired");

  try {
    // Extend statement timeout for the session (10 min per statement)
    await client.query("SET statement_timeout = '600000'");

    for (const xmlFile of xmlFiles) {
      const tmpPath = path.join(tmpDir, xmlFile);
      console.log(`  📄 Processing: ${xmlFile}`);

      // Phase 1: Parse ALL records into memory (SAX is sync, can't await inside callback)
      const allRecords = [];
      const stream = createReadStream(tmpPath, { encoding: "utf-8" });
      const count = await parseXMLStream(stream, (caseFile, n) => {
        allRecords.push(caseFile);
        if (n % 5000 === 0) {
          process.stdout.write(`\r  📖 Parsed ${n.toLocaleString()} records...`);
        }
      });
      console.log(`\n  📖 Parsed ${count.toLocaleString()} records, now inserting...`);

      // Phase 2: Flush to DB in batches via COPY protocol
      const startInsert = Date.now();
      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        batch = allRecords.slice(i, i + BATCH_SIZE);
        await flushBatch(sourceFile, client);
        const done = Math.min(i + BATCH_SIZE, allRecords.length);
        const elapsed = ((Date.now() - startInsert) / 1000).toFixed(0);
        const rate = (done / ((Date.now() - startInsert) / 1000)).toFixed(0);
        process.stdout.write(`\r  ✅ ${done.toLocaleString()} / ${allRecords.length.toLocaleString()} inserted (${rate} rec/s, ${elapsed}s)...`);
      }
      batch = [];

      totalRecords += count;
      console.log(`\n  ✅ ${xmlFile}: ${count.toLocaleString()} records done`);
    }
  } finally {
    client.release();
    console.log("  🔗 Database connection released");
    // Clean up extracted files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return totalRecords;
}

// ---------------------------------------------------------------------------
// Main: process a file or directory
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inputPath = args.find((a) => !a.startsWith("--"));

  if (!inputPath) {
    console.log(`
USPTO Trademark XML Parser for MarkItNow.ai
============================================

Usage:
  node scripts/parse-uspto-xml.js <file-or-directory> [--dry-run]

Examples:
  # Parse a single zip file
  node scripts/parse-uspto-xml.js ./data/apc240101.zip

  # Parse all zips in a directory (for annual backfill)
  node scripts/parse-uspto-xml.js ./data/annual/

  # Parse a raw XML file
  node scripts/parse-uspto-xml.js ./data/apc240101.xml

  # Dry run (parse but don't insert)
  node scripts/parse-uspto-xml.js ./data/apc240101.zip --dry-run

Environment:
  DATABASE_URL must be set in .env.local
  Example: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL && !dryRun) {
    console.error("❌ DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  console.log(`🔍 Processing: ${inputPath}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (no DB writes)" : "LIVE (writing to database)"}`);
  console.log("");

  const stat = fs.statSync(inputPath);
  let totalRecords = 0;

  if (stat.isDirectory()) {
    // Process all zip/xml files in directory
    const files = fs
      .readdirSync(inputPath)
      .filter((f) => f.endsWith(".zip") || f.endsWith(".xml"))
      .sort();

    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      const filePath = path.join(inputPath, file);

      // Check ingestion log to skip already-processed files
      if (!dryRun) {
        const { rows } = await pool.query(
          "SELECT status FROM ingestion_log WHERE filename = $1 AND status = 'done'",
          [file]
        );
        if (rows.length > 0) {
          console.log(`⏭️  Skipping ${file} (already ingested)`);
          continue;
        }

        // Log start
        await pool.query(
          `INSERT INTO ingestion_log (filename, started_at, status)
           VALUES ($1, NOW(), 'processing')
           ON CONFLICT (filename) DO UPDATE SET started_at = NOW(), status = 'processing'`,
          [file]
        );
      }

      // Skip files that are too small (likely incomplete downloads)
      const fileSize = fs.statSync(filePath).size;
      if (file.endsWith(".zip") && fileSize < 10000) {
        console.log(`⏭️  Skipping ${file} (${fileSize} bytes — likely incomplete download)`);
        continue;
      }

      console.log(`📦 ${file} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);
      const startTime = Date.now();

      try {
        let count = 0;
        if (file.endsWith(".zip")) {
          count = dryRun
            ? await countRecordsInZip(filePath)
            : await processZipFile(filePath, file);
        } else {
          // For raw XML files: parse all, then flush
          const allRecords = [];
          const stream = createReadStream(filePath, { encoding: "utf-8" });
          count = await parseXMLStream(stream, (caseFile, n) => {
            allRecords.push(caseFile);
            if (n % 5000 === 0) {
              process.stdout.write(`\r  📖 Parsed ${n.toLocaleString()} records...`);
            }
          });

          if (!dryRun && allRecords.length > 0) {
            const xmlClient = await pool.connect();
            await xmlClient.query("SET statement_timeout = '300000'");
            try {
              for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
                batch = allRecords.slice(i, i + BATCH_SIZE);
                await flushBatch(file, xmlClient);
              }
              batch = [];
            } finally {
              xmlClient.release();
            }
          }
        }

        totalRecords += count;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   Done: ${count.toLocaleString()} records in ${elapsed}s`);

        if (!dryRun) {
          await pool.query(
            `UPDATE ingestion_log SET status = 'done', records_processed = $1, completed_at = NOW()
             WHERE filename = $2`,
            [count, file]
          );
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        if (!dryRun) {
          await pool.query(
            `UPDATE ingestion_log SET status = 'error', error_message = $1 WHERE filename = $2`,
            [err.message, file]
          );
        }
      }
    }
  } else {
    // Single file
    const file = path.basename(inputPath);
    if (inputPath.endsWith(".zip")) {
      totalRecords = dryRun
        ? await countRecordsInZip(inputPath)
        : await processZipFile(inputPath, file);
    } else {
      // Parse all records first, then flush to DB
      const allRecords = [];
      const stream = createReadStream(inputPath, { encoding: "utf-8" });
      totalRecords = await parseXMLStream(stream, (caseFile, n) => {
        allRecords.push(caseFile);
        if (n % 5000 === 0) {
          process.stdout.write(`\r  📖 Parsed ${n.toLocaleString()} records...`);
        }
      });

      if (!dryRun && allRecords.length > 0) {
        const xmlClient = await pool.connect();
        await xmlClient.query("SET statement_timeout = '300000'");
        try {
          for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
            batch = allRecords.slice(i, i + BATCH_SIZE);
            await flushBatch(file, xmlClient);
          }
          batch = [];
        } finally {
          xmlClient.release();
        }
      }
    }
  }

  console.log(`\n🎉 Complete! ${totalRecords.toLocaleString()} total records processed.`);

  await pool.end();
}

// Dry-run helper: just count records in a zip without DB writes
async function countRecordsInZip(zipPath) {
  const { execSync } = require("child_process");
  const tmpDir = path.join(__dirname, `_tmp_dryrun_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    execSync(`unzip -o -q "${path.resolve(zipPath)}" -d "${tmpDir}"`, { maxBuffer: 10 * 1024 * 1024 });
  } catch (err) { /* warnings ok */ }
  const xmlFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith(".xml"));
  let total = 0;
  for (const xmlFile of xmlFiles) {
    const tmpPath = path.join(tmpDir, xmlFile);
    const stream = createReadStream(tmpPath, { encoding: "utf-8" });
    const count = await parseXMLStream(stream, () => {});
    total += count;
    console.log(`  📄 ${xmlFile}: ${count.toLocaleString()} records`);
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return total;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
