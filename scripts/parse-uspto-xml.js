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

// ---------------------------------------------------------------------------
// Config: database connection from .env.local
// ---------------------------------------------------------------------------
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
  max: 5,
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
  const d = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  // Validate it's a real date
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return d;
}

// ---------------------------------------------------------------------------
// Database insert: batch upserts for performance
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;
let batch = [];

async function flushBatch(sourceFile) {
  if (batch.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const c of batch) {
      const statusLabel =
        STATUS_LABELS[c.statusCode] ||
        (ACTIVE_CODES.has(c.statusCode) ? "Live" : "Dead/Unknown");

      // Upsert trademark
      await client.query(
        `INSERT INTO trademarks (
          serial_number, registration_number, mark_identification, mark_drawing_code,
          status_code, status_date, status_label,
          filing_date, registration_date, abandonment_date, cancellation_date,
          attorney_name, mark_type, register_type, source_file
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
          updated_at = NOW()`,
        [
          c.serialNumber, c.registrationNumber, c.markIdentification, c.markDrawingCode,
          c.statusCode, c.statusDate, statusLabel,
          c.filingDate, c.registrationDate, c.abandonmentDate, c.cancellationDate,
          c.attorneyName, c.markType, c.registerType, sourceFile,
        ]
      );

      // Replace child records: delete old, insert new
      await client.query("DELETE FROM owners WHERE serial_number = $1", [c.serialNumber]);
      for (const o of c.owners) {
        await client.query(
          `INSERT INTO owners (serial_number, entry_number, party_type, party_name,
            legal_entity_type, entity_statement, address_1, address_2,
            city, state, country, postcode, nationality, dba_aka_text)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            c.serialNumber, o.entryNumber, o.partyType, o.partyName,
            o.legalEntityType, o.entityStatement, o.address1, o.address2,
            o.city, o.state, o.country, o.postcode, o.nationality, o.dbaAkaText,
          ]
        );
      }

      await client.query("DELETE FROM classifications WHERE serial_number = $1", [c.serialNumber]);
      for (const cl of c.classifications) {
        await client.query(
          `INSERT INTO classifications (serial_number, international_code, us_code,
            status_code, status_date, first_use_date, first_use_commerce, primary_code)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            c.serialNumber, cl.internationalCode, cl.usCode,
            cl.statusCode, cl.statusDate, cl.firstUseDate, cl.firstUseCommerce, cl.primaryCode,
          ]
        );
      }

      // Only insert goods & services statements (type starts with "GS")
      await client.query("DELETE FROM goods_services WHERE serial_number = $1", [c.serialNumber]);
      for (const st of c.statements.filter((s) => s.typeCode.startsWith("GS"))) {
        await client.query(
          `INSERT INTO goods_services (serial_number, type_code, description)
          VALUES ($1,$2,$3)`,
          [c.serialNumber, st.typeCode, st.text]
        );
      }

      await client.query("DELETE FROM design_searches WHERE serial_number = $1", [c.serialNumber]);
      for (const ds of c.designSearches) {
        await client.query(
          `INSERT INTO design_searches (serial_number, design_code) VALUES ($1,$2)`,
          [c.serialNumber, ds.code]
        );
      }

      // Skip events for bulk load (optional, saves time — uncomment if needed)
      // await client.query("DELETE FROM events WHERE serial_number = $1", [c.serialNumber]);
      // for (const ev of c.events) {
      //   await client.query(
      //     `INSERT INTO events (serial_number, event_code, event_type, event_date, description_text, sequence_number)
      //     VALUES ($1,$2,$3,$4,$5,$6)`,
      //     [c.serialNumber, ev.code, ev.type, ev.date, ev.descriptionText, ev.sequenceNumber]
      //   );
      // }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  batch = [];
}

// ---------------------------------------------------------------------------
// ZIP handling: extract XML from zip archives
// ---------------------------------------------------------------------------

async function processZipFile(zipPath, sourceFile) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  let totalRecords = 0;

  for (const entry of entries) {
    if (entry.entryName.endsWith(".xml")) {
      console.log(`  📄 Extracting: ${entry.entryName}`);

      // Write to temp file (streaming from zip buffer)
      const tmpPath = path.join(__dirname, `_tmp_${Date.now()}.xml`);
      fs.writeFileSync(tmpPath, entry.getData());

      try {
        const stream = createReadStream(tmpPath, { encoding: "utf-8" });
        const count = await parseXMLStream(stream, async (caseFile, n) => {
          batch.push(caseFile);
          if (batch.length >= BATCH_SIZE) {
            await flushBatch(sourceFile);
            if (n % 5000 === 0) {
              process.stdout.write(`\r  ✅ ${n.toLocaleString()} records processed...`);
            }
          }
        });

        // Flush remaining
        await flushBatch(sourceFile);
        totalRecords += count;
        console.log(`\n  ✅ ${entry.entryName}: ${count.toLocaleString()} records`);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    }
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

      console.log(`📦 ${file}`);
      const startTime = Date.now();

      try {
        let count = 0;
        if (file.endsWith(".zip")) {
          count = dryRun
            ? await countRecordsInZip(filePath)
            : await processZipFile(filePath, file);
        } else {
          const stream = createReadStream(filePath, { encoding: "utf-8" });
          count = await parseXMLStream(stream, async (caseFile, n) => {
            if (!dryRun) {
              batch.push(caseFile);
              if (batch.length >= BATCH_SIZE) {
                await flushBatch(file);
              }
            }
            if (n % 5000 === 0) {
              process.stdout.write(`\r  ✅ ${n.toLocaleString()} records...`);
            }
          });
          if (!dryRun) await flushBatch(file);
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
      const stream = createReadStream(inputPath, { encoding: "utf-8" });
      totalRecords = await parseXMLStream(stream, async (caseFile, n) => {
        if (!dryRun) {
          batch.push(caseFile);
          if (batch.length >= BATCH_SIZE) {
            await flushBatch(file);
          }
        }
        if (n % 5000 === 0) {
          process.stdout.write(`\r  ✅ ${n.toLocaleString()} records...`);
        }
      });
      if (!dryRun) await flushBatch(file);
    }
  }

  console.log(`\n🎉 Complete! ${totalRecords.toLocaleString()} total records processed.`);

  await pool.end();
}

// Dry-run helper: just count records in a zip without DB writes
async function countRecordsInZip(zipPath) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipPath);
  let total = 0;
  for (const entry of zip.getEntries()) {
    if (entry.entryName.endsWith(".xml")) {
      const tmpPath = path.join(__dirname, `_tmp_${Date.now()}.xml`);
      fs.writeFileSync(tmpPath, entry.getData());
      try {
        const stream = createReadStream(tmpPath, { encoding: "utf-8" });
        const count = await parseXMLStream(stream, () => {});
        total += count;
        console.log(`  📄 ${entry.entryName}: ${count.toLocaleString()} records`);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    }
  }
  return total;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
