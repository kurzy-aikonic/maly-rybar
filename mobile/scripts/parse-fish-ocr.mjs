#!/usr/bin/env node
/**
 * Parsuje mobile/ocr_text/*.txt (výstup z Tesseract) a vytáhne orientační údaje
 * pro kontrolu / ruční sloučení do data/fish.json.
 *
 * Spusť z adresáře mobile: node scripts/parse-fish-ocr.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, "..");
const ocrDir = path.join(mobileRoot, "ocr_text");
const outPath = path.join(mobileRoot, "..", "data", "fish_ocr_parsed.json");

function norm(s) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function linesNorm(text) {
  return text.split(/\r?\n/).map((line) => norm(line));
}

function extractClosedSeason(text) {
  const Ls = linesNorm(text);
  for (const L of Ls) {
    if (!L.includes("DOBA") || !L.includes("HAJEN")) continue;
    if (L.includes("TREN") && !L.includes("HAJEN")) continue;
    if (/\bNEM\b|NEMA/.test(L)) return "Nehajena";
    if (/CELEROCN|CELOROCN|CELOROCNI/.test(L)) return "Celoroční hájení";
    const m = L.match(
      /(\d{1,2})\s*[.,]\s*\d{1,2}[^A-Z0-9]{0,8}15\s*[.,]\s*\d{1,2}/
    );
    if (m) return m[0].replace(/\s+/g, "").replace(/,/g, ".");
  }
  for (let i = 0; i < Ls.length; i++) {
    const chunk = [Ls[i], Ls[i + 1] || ""].join(" ");
    if (!chunk.includes("DOBA") || !chunk.includes("HAJEN")) continue;
    const m = chunk.match(
      /(\d{1,2})\s*[.,]\s*\d{1,2}[^A-Z0-9]{0,8}15\s*[.,]\s*\d{1,2}/
    );
    if (m) return m[0].replace(/\s+/g, "").replace(/,/g, ".");
  }
  for (const L of Ls) {
    const m = L.match(
      /(\d{1,2})\s*[.,]\s*\d{1,2}\s*[-–.]+\s*15\s*[.,]\s*\d{1,2}/
    );
    if (m) return m[0].replace(/\s+/g, "").replace(/,/g, ".");
  }
  return null;
}

function extractMinCm(text) {
  for (const L of linesNorm(text)) {
    if (!L.includes("ZAKONNA") || !L.includes("MIRA")) continue;
    if (/NEM\b|NEMA/.test(L)) return 0;
    const m = L.match(/(\d{2,3})\s*CM/);
    if (m) return parseInt(m[1], 10);
  }
  for (const L of linesNorm(text)) {
    if (!/MIRA\s*=+/.test(L) && !/MIRA\s*==/.test(L)) continue;
    const m = L.match(/(\d{2,3})\s*CM/);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function extractRecordLine(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const u = norm(line);
    if (
      (u.includes("REKORD") || u.includes("REKOR")) &&
      (u.includes("CR") || u.includes("VCR") || u.includes("VC R"))
    )
      return line.trim();
  }
  return null;
}

function extractMethodsLine(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const u = norm(line);
    if (u.includes("ZPUSOB") && u.includes("LOVU")) return line.trim();
  }
  return null;
}

function main() {
  if (!fs.existsSync(ocrDir)) {
    console.error("Chybí složka:", ocrDir);
    process.exit(1);
  }
  const files = fs
    .readdirSync(ocrDir)
    .filter((f) => f.endsWith(".txt"))
    .sort();
  const rows = [];
  for (const f of files) {
    const slug = f.replace(/\.txt$/i, "");
    const raw = fs.readFileSync(path.join(ocrDir, f), "utf8");
    rows.push({
      slug,
      closed_season_guess: extractClosedSeason(raw),
      min_size_cm_guess: extractMinCm(raw),
      record_line_ocr: extractRecordLine(raw),
      zpusob_lovu_line_ocr: extractMethodsLine(raw),
      line_count: raw.split(/\r?\n/).filter((l) => l.trim()).length
    });
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
  console.log("Hotovo:", rows.length, "souborů →", outPath);
}

main();
