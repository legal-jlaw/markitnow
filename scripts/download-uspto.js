#!/usr/bin/env node
/**
 * Download USPTO trademark bulk data via the Open Data Portal API.
 *
 * Usage:
 *   node scripts/download-uspto.js                   # downloads last 30 days of daily files
 *   node scripts/download-uspto.js --from 2024-01-01 # downloads from a specific date
 *   node scripts/download-uspto.js --annual           # downloads the latest annual file
 *
 * Requires USPTO_API_KEY in .env.local
 * Get your free key at: https://developer.uspto.gov → "Obtain an API key"
 */

require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.USPTO_API_KEY;
const DATASET = "TRTDXFAP"; // Trademark Daily XML Full Applications
const API_BASE = "https://api.uspto.gov/api/v1/datasets/products";
const DOWNLOAD_DIR = path.join(__dirname, "..", "data");

if (!API_KEY) {
  console.error("❌ USPTO_API_KEY is not set in .env.local");
  console.error("   Get your free key at: https://developer.uspto.gov");
  console.error('   Then add: USPTO_API_KEY=your-key-here to .env.local');
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const isAnnual = args.includes("--annual");
const fromIdx = args.indexOf("--from");
const fromDate = fromIdx !== -1 ? args[fromIdx + 1] : null;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, {
      headers: { "x-api-key": API_KEY },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        // Read the error body for debugging
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => reject(new Error(`Download failed: HTTP ${res.statusCode} — ${body.slice(0, 200)}`)));
        return;
      }

      const totalBytes = parseInt(res.headers["content-length"] || "0");
      let downloadedBytes = 0;

      res.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
          process.stdout.write(`\r   ↓ ${mb} MB (${pct}%)`);
        } else {
          const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
          process.stdout.write(`\r   ↓ ${mb} MB`);
        }
      });

      res.pipe(file);
      file.on("finish", () => {
        console.log("  ✓");
        file.close(resolve);
      });
    });
    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    req.setTimeout(600000); // 10 min timeout for large files
  });
}

async function listFiles(fromDate, toDate) {
  const dataset = isAnnual ? "TRTYRAP" : DATASET;

  // Try the /files sub-endpoint first (works for large datasets with many files)
  const filesParams = new URLSearchParams({
    fileDataFromDate: fromDate,
    fileDataToDate: toDate,
  });
  const filesUrl = `${API_BASE}/${dataset}/files?${filesParams}`;
  console.log(`🔍 Querying USPTO API for ${dataset} files...`);
  console.log(`   Date range: ${fromDate} → ${toDate}`);
  console.log(`   Trying: ${filesUrl}`);

  let result;
  let usedFilesEndpoint = false;
  try {
    result = await fetch(filesUrl);
    usedFilesEndpoint = true;
    console.log(`   /files endpoint response keys: ${Object.keys(result || {}).join(", ")}`);
  } catch (err) {
    console.log(`   /files endpoint failed (${err.message}), falling back to product endpoint...`);
  }

  // Fallback: product endpoint with includeFiles=true
  if (!usedFilesEndpoint || !result) {
    const params = new URLSearchParams({
      fileDataFromDate: fromDate,
      fileDataToDate: toDate,
      includeFiles: "true",
    });
    const url = `${API_BASE}/${dataset}?${params}`;
    console.log(`   Trying: ${url}`);
    result = await fetch(url);
  }

  // Debug: show full response structure
  console.log(`   Response keys: ${Object.keys(result || {}).join(", ")}`);

  // Handle various response shapes from USPTO API
  let files = [];

  // Shape 0: direct array (from /files endpoint)
  if (Array.isArray(result) && result.length > 0) {
    files = result;
  }
  // Shape 0b: { count, fileDataBag: [...] } (from /files endpoint)
  else if (result?.fileDataBag?.length) {
    files = result.fileDataBag;
  }
  // Shape 1: { productFiles: [...] }
  else if (result?.productFiles?.length) {
    files = result.productFiles;
  }
  // Shape 2: { bulkDataProductBag: [{ productFileBag: {...} }] }
  else if (result?.bulkDataProductBag?.length) {
    const product = result.bulkDataProductBag[0];
    console.log(`   Product keys: ${Object.keys(product || {}).join(", ")}`);

    // productFileBag is an object with { count, fileDataBag: [...] }
    const fileBag = product.productFileBag;
    if (fileBag) {
      if (Array.isArray(fileBag)) {
        files = fileBag;
      } else if (fileBag?.fileDataBag?.length) {
        files = fileBag.fileDataBag;
      } else if (fileBag?.count > 0) {
        const nested = Object.values(fileBag).find(v => Array.isArray(v));
        if (nested) files = nested;
      }
    }

    // If no fileBag, look for files directly in the product object
    if (files.length === 0) {
      // Some datasets put files in other keys
      for (const key of Object.keys(product)) {
        const val = product[key];
        if (Array.isArray(val) && val.length > 0 && val[0].fileName) {
          files = val;
          break;
        }
        if (val && typeof val === "object" && !Array.isArray(val)) {
          for (const subKey of Object.keys(val)) {
            if (Array.isArray(val[subKey]) && val[subKey].length > 0) {
              files = val[subKey];
              break;
            }
          }
          if (files.length > 0) break;
        }
      }
    }

    // For annual datasets, the API doesn't return file listings inline.
    // Construct file list from known naming pattern if we have the product metadata.
    if (files.length === 0 && product.productFileTotalQuantity > 0 && dataset === "TRTYRAP") {
      const totalFiles = product.productFileTotalQuantity;
      const toDate = (product.productToDate || "").replace(/-/g, "");
      console.log(`   Annual dataset: constructing ${totalFiles} file URLs (toDate: ${toDate})...`);

      for (let i = 1; i <= totalFiles; i++) {
        const num = String(i).padStart(2, "0");
        const fileName = `apc18840407-${toDate}-${num}.zip`;
        files.push({
          fileName: fileName,
          fileDownloadURI: `https://api.uspto.gov/api/v1/datasets/products/files/TRTYRAP/${fileName}`,
          fileSizeNumber: Math.round((product.productTotalFileSize || 0) / totalFiles),
          fileDataFromDate: product.productFromDate,
        });
      }
    }

    if (files.length === 0) {
      console.log(`   Could not find files automatically. Dumping product structure:`);
      console.log(`   ${JSON.stringify(product).slice(0, 2000)}`);
    }
  }
  // Unknown shape — dump it
  else {
    console.log(`   Full response (first 1000 chars):`);
    console.log(`   ${JSON.stringify(result).slice(0, 1000)}`);
  }

  console.log(`   Found ${files.length} file(s)`);
  if (files.length > 0) {
    console.log(`   Sample file keys: ${Object.keys(files[0]).join(", ")}`);
    console.log(`   Sample: ${JSON.stringify(files[0]).slice(0, 300)}`);
  }

  if (files.length === 0) return [];

  // Normalize file objects — different API versions use different key names
  return files.map(f => {
    const name = f.fileName || f.fileNameText || f.name || "unknown.zip";
    // Build download URL: try explicit URL fields, then construct from API base
    const dlUrl = f.fileDownloadURI || f.fileDownloadUrl || f.downloadUrl || f.url || f.fileURI
      || `https://api.uspto.gov/api/v1/datasets/products/files/${dataset}/${name}`;
    return {
      fileName: name,
      fileSize: f.fileSize || f.fileSizeBytes || f.fileSizeNumber || f.size || 0,
      fileDownloadUrl: dlUrl,
      fileFromDate: f.fileDataFromDate || f.fileFromDate || f.fromDate || "",
    };
  });
}

async function main() {
  // Ensure download dir exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const today = new Date().toISOString().split("T")[0];
  let startDate;

  if (isAnnual) {
    // Annual files: look back 2 years to find the latest
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    startDate = twoYearsAgo.toISOString().split("T")[0];
  } else if (fromDate) {
    startDate = fromDate;
  } else {
    // Default: last 30 days
    const d = new Date();
    d.setDate(d.getDate() - 30);
    startDate = d.toISOString().split("T")[0];
  }

  const allFiles = await listFiles(startDate, today);
  // Only download ZIP data files, skip .doc documentation
  const files = allFiles.filter(f => f.fileName.endsWith(".zip"));

  if (files.length === 0) {
    console.log("📭 No ZIP files found for this date range.");
    return;
  }

  console.log(`\n📦 Found ${files.length} file(s):\n`);
  files.forEach((f) => {
    const sizeMB = (f.fileSize / 1024 / 1024).toFixed(1);
    console.log(`   ${f.fileName}  (${sizeMB} MB)  ${f.fileFromDate || ""}`);
  });

  console.log("");

  // Download each file
  let downloaded = [];
  for (const f of files) {
    const destPath = path.join(DOWNLOAD_DIR, f.fileName);

    if (fs.existsSync(destPath)) {
      const existingSize = fs.statSync(destPath).size;
      if (Math.abs(existingSize - f.fileSize) < 1000) {
        console.log(`⏭  ${f.fileName} already downloaded, skipping`);
        downloaded.push(destPath);
        continue;
      }
    }

    console.log(`⬇  Downloading ${f.fileName}...`);
    try {
      await downloadFile(f.fileDownloadUrl, destPath);
      downloaded.push(destPath);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  if (downloaded.length === 0) {
    console.log("\n❌ No files downloaded.");
    return;
  }

  console.log(`\n✅ Downloaded ${downloaded.length} file(s) to ./data/`);
  console.log("\n🚀 To ingest into Supabase, run:");
  downloaded.forEach((p) => {
    console.log(`   npm run ingest -- ${p}`);
  });

  // Offer to auto-ingest
  if (args.includes("--ingest")) {
    console.log("\n🔄 Auto-ingesting...\n");
    const { execSync } = require("child_process");
    for (const p of downloaded) {
      console.log(`📥 Ingesting ${path.basename(p)}...`);
      try {
        execSync(`node scripts/parse-uspto-xml.js "${p}"`, { stdio: "inherit" });
      } catch (err) {
        console.error(`   ❌ Ingest failed for ${path.basename(p)}`);
      }
    }
    console.log("\n🎉 Done! Your database is loaded.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
