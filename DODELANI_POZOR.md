# Dodělání Atlasu ryb — pozor

Stručný checklist a úskalí. Obsah se týká mobilní aplikace (`mobile/`) a dat v `data/fish.json`.

## Fotky druhů

- **Umístění souborů:** `mobile/assets/fish/` (ne do chatu jako jediný zdroj).
- **Pozor — názvy souborů:** používej **ASCII** (`kapr-obecny.png`), ne diakritiku v názvu souboru (`kapr-obecný.png`). Unicode v cestách umí dělat problémy nástrojům i bundleru.
- **Pozor — Expo / Metro:** dynamické načítání podle řetězce z JSON **nejde**. Každý nový obrázek musí být:
  1. fyzicky ve `mobile/assets/fish/`,
  2. **`image`** v `fish.json` = přesný název souboru (včetně přípony `.png` / `.jpg`),
  3. **ruční řádek** v `mobile/src/lib/fishImages.ts` ve tvaru  
     `"nazev-souboru.ext": require("../../assets/fish/nazev-souboru.ext")`.
- Bez bodu 3 se v atlasu **fotka neukáže** (žádná chyba v konzoli u chybějícího mapování není vždy zřejmá).
- **Velikost souboru:** velké PNG z foťáku zbytečně zvětšují APK/IPA. Před commitem zmenši např. na max. šířku **800–1200 px** nebo použij **WebP** (pak v `fishImages` a JSON konzistentní přípona).

## Obsah karet (odborný detail)

- Bohatá struktura je v `fish.json` v objektu **`detail`** (`sections`, `premium`, řádky, odrážky, metody lovu).
- **Fallback:** ryby **bez** `detail` mají automaticky základ ze starých polí (míra, hájení, znaky, tip, podobné druhy).
- Sekce s **`"premium": true`** jsou bez předplatitele v aplikaci **zamčené** (placeholder).
- Vzorové vyplněné druhy k opisování: **kapr**, **pstruh obecný**. Ostatní druhy dotáhnout stejnou logikou sekční karty.

## Počet druhů (cíl ~65 sladkovodních v ČR)

- Postupně doplňovat `detail` a fotky; každý nový druh = JSON + volitelně obrázek + řádek v `fishImages.ts`.
- Kontrolovat shodu **`id`**, **`image`** a názvu souboru napříč repozitářem.

## Rychlá kontrola po úpravě

- `npx tsc --noEmit` v adresáři `mobile/`.
- `npm run check-fish-assets` v adresáři `mobile/` — sladí `fish.json`, složku `assets/fish/` a `fishImages.ts` (tvrdá chyba jen při rozbitém `require` v mapě).
- V simulátoru: seznam atlasu (náhled), otevření detailu (velká fotka), bez Premium ověřit zamčené sekce.

## Ryby bez pole `detail` v JSON

- V aplikaci se použije **fallback**: tip, právo, rychlé znaky, podobné druhy, krátká poznámka „O této kartě“, poté **tři Premium sekce** se stub textem (po odemčení Premium) nebo zamčení (Free).
- Doplňování obsahu = zkopírovat strukturu `detail` z kapra/pstruha a nahradit texty.

## Premium / RevenueCat (fáze 6) — **nemusíš hned**

- **Teď ne:** Kód už umí RevenueCat + webhook, ale **bez účtu v RevenueCat, bez produktů v App Store / Play a bez nasazeného webhooku na Vercelu** aplikace normálně funguje — v dev je Premium přes přepínač, v ostrém buildu bez platby zůstane **Free**.
- **Až budeš chtít ostré předplatné:** postup je v [docs/FAZE_6_REVENUECAT.md](docs/FAZE_6_REVENUECAT.md) (env v kořeni `.env.example` a v `mobile/.env.example`, endpoint `api/revenuecat-webhook.js`).
- **Priorita:** má smysl až máš **dev build / TestFlight** a jasné produkty v obchodech; dřív často jen trápíš sandbox a účty vývojáře.

---

*Soubor slouží jako vnitřní připomínka; před releasem zkontroluj atlas (`fish.json`, `fishImages.ts`, `assets/fish/`) a až poběží platby i RevenueCat + webhook na Vercelu.*
