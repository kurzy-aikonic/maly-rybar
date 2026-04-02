#!/usr/bin/env node
/**
 * Jednotná kontrola obsahových dat pro mobilní appku a sdílený atlas.
 *
 * Spusť z kořene repa:  node scripts/audit-app-data.mjs
 * Nebo z mobile/:       npm run audit-data
 *
 * Kontroluje: fish.json (struktura, odkazy), regions.json, quiz_questions.json,
 * platnost JSON souborů v data/, volitelně PDF karet, pak check-fish-assets.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`[CHYBA] ${msg}`);
  errors += 1;
}

function warn(msg) {
  console.warn(`[UPOZORNĚNÍ] ${msg}`);
  warnings += 1;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function auditFish(fishPath) {
  const fish = readJson(fishPath);
  if (!Array.isArray(fish)) {
    fail("fish.json musí být pole záznamů.");
    return;
  }
  if (fish.length !== 63) {
    fail(`fish.json: očekáváno přesně 63 druhů (sada karet), je ${fish.length}.`);
  }

  const ids = new Set();
  const nameCz = new Set();

  for (const f of fish) {
    if (!f.id || typeof f.id !== "string") fail("Záznam bez platného id.");
    if (ids.has(f.id)) fail(`Duplicitní id: ${f.id}`);
    ids.add(f.id);

    if (!f.name_cz || typeof f.name_cz !== "string") fail(`${f.id}: chybí name_cz.`);
    if (nameCz.has(f.name_cz)) fail(`Duplicitní name_cz: ${f.name_cz}`);
    nameCz.add(f.name_cz);

    if (!f.name_lat || typeof f.name_lat !== "string") fail(`${f.id}: chybí name_lat.`);
    if (f.image == null || String(f.image).trim() === "") fail(`${f.id}: chybí image.`);
    if (typeof f.min_size_cm !== "number" || f.min_size_cm < 0) {
      fail(`${f.id}: min_size_cm musí být nezáporné číslo.`);
    }
    if (typeof f.closed_season !== "string") fail(`${f.id}: closed_season musí být řetězec.`);
    if (!Array.isArray(f.identification_marks)) fail(`${f.id}: identification_marks musí být pole.`);
    if (!Array.isArray(f.similar_species)) fail(`${f.id}: similar_species musí být pole.`);
  }

  for (const f of fish) {
    for (const s of f.similar_species) {
      if (!nameCz.has(s)) {
        fail(`${f.id}: similar_species odkazuje na neznámý name_cz: "${s}"`);
      }
    }
  }

  console.log(`[fish.json] ${fish.length} druhů, id a name_cz unikátní, odkazy similar_species OK.`);

  return nameCz;
}

function auditRegions(regionsPath, nameCz) {
  const regions = readJson(regionsPath);
  if (!Array.isArray(regions)) {
    fail("regions.json musí být pole.");
    return;
  }
  for (const r of regions) {
    for (const w of r.waters || []) {
      for (const s of w.target_species || []) {
        if (!nameCz.has(s)) {
          fail(`regions: neznámý target_species "${s}" u ${w.id || w.name || "?"}`);
        }
      }
    }
  }
  console.log("[regions.json] target_species odkazují jen na existující name_cz v atlasu.");
}

function auditQuiz(quizPath) {
  const quiz = readJson(quizPath);
  if (!Array.isArray(quiz)) {
    fail("quiz_questions.json musí být pole.");
    return;
  }
  const seen = new Set();
  for (const q of quiz) {
    if (!q.id || typeof q.id !== "string") fail("Otázka bez id.");
    else if (seen.has(q.id)) fail(`Duplicitní id otázky: ${q.id}`);
    else seen.add(q.id);

    const need = ["category", "question", "options", "correct_index", "difficulty"];
    for (const k of need) {
      if (q[k] === undefined || q[k] === null) fail(`Otázka ${q.id}: chybí ${k}.`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`Otázka ${q.id}: options musí mít aspoň 2 položky.`);
    }
    const ci = q.correct_index;
    if (typeof ci !== "number" || ci < 0 || ci >= q.options.length) {
      fail(`Otázka ${q.id}: correct_index mimo rozsah options.`);
    }
  }
  console.log(`[quiz_questions.json] ${quiz.length} otázek, struktura a unikátní id OK.`);
}

function auditAllDataJson() {
  const names = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  for (const n of names) {
    const p = path.join(dataDir, n);
    try {
      readJson(p);
    } catch (e) {
      fail(`Neplatný JSON: data/${n} — ${e.message || e}`);
    }
  }
  console.log(`[data/*.json] ${names.length} souborů úspěšně parsováno.`);
}

function runPdfAudit() {
  const py = process.env.PYTHON || "python3";
  const script = path.join(root, "scripts", "audit-fish-pdf.py");
  const env = { ...process.env, PYTHONPATH: path.join(root, ".pdf_tools") };
  try {
    execFileSync(py, [script], { cwd: root, env, stdio: "inherit" });
  } catch (e) {
    if (e.status === 1) errors += 1;
    else {
      warn(
        `PDF audit se nespustil (${py}). Pro úplnou kontrolu nainstaluj pypdf do .pdf_tools a měj python3 v PATH.`,
      );
    }
  }
}

function runFishAssetsCheck() {
  const checkScript = path.join(root, "mobile", "scripts", "check-fish-assets.mjs");
  try {
    execFileSync(process.execPath, [checkScript], { cwd: path.join(root, "mobile"), stdio: "inherit" });
  } catch (e) {
    if (e.status === 1) errors += 1;
    else fail(`check-fish-assets selhal: ${e.message || e}`);
  }
}

console.log("=== Audit dat (Malý rybář) ===\n");

auditAllDataJson();
const nameCz = auditFish(path.join(dataDir, "fish.json"));
if (nameCz) {
  auditRegions(path.join(dataDir, "regions.json"), nameCz);
  auditQuiz(path.join(dataDir, "quiz_questions.json"));
}

console.log("");
runPdfAudit();
console.log("");
runFishAssetsCheck();

console.log(
  `\n=== Hotovo: ${errors} tvrdých chyb v audit-app-data.mjs, ${warnings} interních upozornění. ===`,
);
console.log(
  "(Když check-fish-assets vypíše TODO, chybí soubor v assets nebo řádek v fishImages.ts.)",
);

if (errors > 0) process.exit(1);
