# Úkoly až po finálním kroku (release / dokončení obsahu)

Tento seznam doplň podle toho, co pro tebe znamená „finální krok“ (např. vypuštění do obchodů, dokončení fotek ryb, ostrá doména). **Nic z toho není nutné dělat před spuštěním**, jde o údržbu a doladění potom.

## Refaktoring a kód

- [ ] **Rozdělit `mobile/src/screens/WaterScreen.tsx`** na menší části (komponenty / hooky podle režimů: hub, deník, revíry, úvazy, výbava, náčiní…) — stejné chování pro uživatele, přehlednější kód pro tebe.
- [ ] **Složka `app/` vs `mobile/src/`** — rozhodnout, zda starší `app/` ještě potřebuješ, nebo dokumentovat jako nepoužívané, aby nevznikaly dva zdroje pravdy.

## Web a SEO (po známé produkční URL)

- [ ] V `landing/index.html` doplnit **`link rel="canonical"`** a **`og:url`** na ostrý adresář landingu.
- [ ] Přidat **`og:image`** (a případně `twitter:image`) — jeden obrázek cca 1200×630 px do `landing/` a odkaz v meta značkách.
- [ ] V `landing/script.js` nahradit `console.log` v `track()` reálným měřením (např. GA4 / Plausible) pro odeslání čekací listiny.

## Mobil — volitelné doladění

- [ ] Po stabilním buildu na zařízeních zvážit znovu **`enableScreens(true)`** v `App.tsx` (dnes vypnuto kvůli stabilitě v Expo Go).
- [ ] Po doplnění všech fotek ryb změřit **čas startu** appky; podle výsledku zvážit štěpení nebo lazy načítání velkého `fish.json`.

## Obsah (může být součást finále)

- [ ] Dokončit **fotky a `fishImages.ts`** podle `DODELANI_POZOR.md` a `npm run check-fish-assets`.

---

*Poslední úprava: interní checklist projektu Malý rybář.*
