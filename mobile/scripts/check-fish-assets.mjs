#!/usr/bin/env node
/**
 * Kontrola konzistence atlasu: fish.json ↔ soubory v assets/fish ↔ fishImages.ts
 * Spusť z adresáře mobile: npm run check-fish-assets
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fishJsonPath = path.join(root, "..", "data", "fish.json");
const assetsDir = path.join(root, "assets", "fish");
const fishImagesPath = path.join(root, "src", "lib", "fishImages.ts");

function loadFish() {
  const raw = fs.readFileSync(fishJsonPath, "utf8");
  return JSON.parse(raw);
}

function listAssetFiles() {
  if (!fs.existsSync(assetsDir)) return [];
  return fs.readdirSync(assetsDir).filter((f) => !f.startsWith("."));
}

function extractFishImageMapBody(tsSource) {
  const start = tsSource.indexOf("const fishImageMap");
  if (start === -1) return null;
  const brace = tsSource.indexOf("{", start);
  if (brace === -1) return null;
  let depth = 0;
  for (let i = brace; i < tsSource.length; i++) {
    const c = tsSource[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return tsSource.slice(brace + 1, i);
    }
  }
  return null;
}

function parseImageMapKeys(tsSource) {
  const body = extractFishImageMapBody(tsSource) ?? "";
  const re = /"([^"]+\.(?:png|jpg|jpeg|webp))"\s*:/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(body)) !== null) keys.add(m[1]);
  return keys;
}

const fish = loadFish();
const assetFiles = new Set(listAssetFiles());
const ts = fs.readFileSync(fishImagesPath, "utf8");
const mappedKeys = parseImageMapKeys(ts);

const imageRefs = new Set(fish.map((f) => f.image).filter(Boolean));

let errors = 0;
let warnings = 0;

console.log("=== Kontrola atlasu (fish.json / assets / fishImages.ts) ===\n");
console.log(
  "Tvrdá chyba = fishImages.ts odkazuje na neexistující soubor (build by spadl).\n"
);

for (const ref of imageRefs) {
  if (!assetFiles.has(ref)) {
    console.warn(
      `[TODO soubor] assets/fish/${ref} — v JSON je odkaz, soubor ještě není v repu`
    );
    warnings++;
  } else if (!mappedKeys.has(ref)) {
    console.warn(
      `[TODO mapování] ${ref} je na disku i v JSON, ale chybí řádek v fishImages.ts — v app se neukáže`
    );
    console.warn(
      `  → fishImageMap:  "${ref}": require("../../assets/fish/${ref}"),`
    );
    warnings++;
  }
}

for (const f of assetFiles) {
  if (!imageRefs.has(f)) {
    console.warn(
      `[INFO] assets/fish/${f} není v žádném záznamu fish.json`
    );
    warnings++;
  }
}

for (const k of mappedKeys) {
  if (!assetFiles.has(k)) {
    console.error(
      `[CHYBA] fishImages.ts mapuje "${k}", ale assets/fish/${k} chybí — oprav mapu nebo přidej soubor`
    );
    errors++;
  }
}

console.log(
  `\nShrnutí: ${errors} tvrdých chyb, ${warnings} upozornění, ${fish.length} druhů v JSON.`
);
if (errors > 0) process.exit(1);
