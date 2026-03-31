# Malý rybář - Master plán (aplikace + landing page)

Tento dokument je hlavní zdroj pravdy pro realizaci projektu.  
Cíl: mít přesný postup po fázích, souborech a obrazovkách tak, aby se dalo dodávat bez chaosu.

## 1) Produktový cíl

- Vytvořit nejlepší českou dětskou aplikaci pro přípravu na rybářské zkoušky a praxi u vody.
- Spojit výuku a zábavu: dítě se učí, testuje, sbírá XP a odznaky, používá aplikaci i během sezony.
- Monetizace přes model Free/Premium tak, aby Free byla užitečná, ale Premium jasně výhodnější.

## 2) Cílové skupiny

- Děti 8-15 let (hlavní uživatel aplikace).
- Rodiče (hlavní rozhodovatel o instalaci a platbě).

## 3) Scope verzí

## 3.1 MVP (must-have)

- Onboarding (věk, úroveň, cíl zkoušek).
- Atlas ryb (základní sada + detail).
- Testy (trénink + základ simulace).
- XP, level, streak.
- Základní deník úlovků.
- Free/Premium paywall.
- Landing page + čekací listina.

## 3.2 V1 (po MVP)

- Pokročilý simulátor testu s vysvětlením chyb.
- Režim "Moje slabiny" (adaptivní opakování).
- Rozšířený deník a statistiky.
- Revíry mapa.
- Rozšířené uzly/montáže (animace nebo krokové návody).

## 3.3 V2 (scale)

- Offline režim.
- Audio čtení otázek.
- Sezónní eventy a výzvy.
- Rodičovský dashboard/reporty.

## 4) Informační architektura aplikace

Spodní navigace:
- Domů
- Atlas
- Testy
- U vody
- Profil

## 4.1 Obrazovky a účel

- `HomeScreen`
  - denní mise
  - rychlé pokračování v učení
  - progress bar "Připravenost na zkoušku"
- `AtlasListScreen`
  - seznam ryb, filtry, vyhledávání
- `FishDetailScreen`
  - míra, hájení, poznávačka, podobné druhy, tipy
- `QuizModeSelectScreen`
  - trénink / simulace / moje chyby
- `QuizScreen`
  - otázky, timer (u simulace), feedback
- `QuizResultsScreen`
  - skóre, slabá témata, doporučená lekce
- `KnotsListScreen`
  - uzly podle typu lovu
- `KnotDetailScreen`
  - krokový návod + chyba při vázání
- `DiaryListScreen`
  - přehled úlovků
- `DiaryEntryScreen`
  - detail úlovku (foto, lokalita, ryba, délka, poznámka)
- `MapScreen` (V1)
  - revíry a základní informace
- `ProfileScreen`
  - XP, odznaky, streak, členství
- `PaywallScreen`
  - přehled výhod Premium + CTA

## 5) Free vs Premium

## 5.1 Free

- Omezený atlas (např. 20 druhů).
- Krátký test bez detailního vysvětlení.
- 3 základní uzly.
- 3 poslední záznamy v deníku.
- Reklamní slot.

## 5.2 Premium

- Plný atlas + detailní obsah.
- Simulátor testu, historie, vysvětlení chyb.
- Kompletní knihovna uzlů/montáží.
- Neomezený deník + statistiky.
- Revíry mapa + filtry.
- Bez reklam.

## 6) Datový model a struktura souborů

Nejdřív vytvořit datový základ, pak UI.

Navržená struktura:

- `docs/`
  - `product-requirements.md`
  - `content-guidelines.md`
  - `analytics-events.md`
- `data/`
  - `fish.json`
  - `quiz_questions.json`
  - `knots.json`
  - `regulations_summary.json`
  - `regions.json`
- `app/`
  - `screens/`
  - `components/`
  - `navigation/`
  - `services/`
  - `store/`
- `landing/`
  - `index.html` (nebo framework varianta)
  - `styles.css`
  - `waitlist-form.js`
  - `privacy-policy.md`
  - `terms.md`

### 6.1 Minimální schema dat

`fish.json`:
- `id`
- `name_cz`
- `name_lat`
- `image`
- `min_size_cm`
- `closed_season`
- `identification_marks`
- `similar_species`
- `tips`
- `is_premium`

`quiz_questions.json`:
- `id`
- `category` (fish, rules, biology, practice)
- `question`
- `options[]`
- `correct_index`
- `explanation`
- `difficulty`
- `is_premium`

`knots.json`:
- `id`
- `name`
- `type` (háček, obratlík, spojovací, montáž)
- `steps[]`
- `common_mistakes[]`
- `is_premium`

## 7) Landing page blueprint

## 7.1 Cíl

- Primární: sběr e-mailů do čekací listiny.
- Sekundární: validace poptávky a prvních zájemců o Premium.

## 7.2 Povinné sekce

1. Hero (hlavní benefit + CTA)
2. Problém rodiče (co je na zkouškách těžké)
3. Řešení: atlas + testy + u vody
4. Jak to funguje ve 3 krocích
5. Free vs Premium srovnání
6. Ukázky obrazovek (mockupy)
7. FAQ
8. Závěrečný CTA blok

## 7.3 CTA a formulář

- Pole: e-mail, role (rodič/dítě), věk dítěte, plánovaný termín zkoušky.
- Nabídka: sleva při spuštění + early access.
- Po odeslání: potvrzovací obrazovka + e-mail sekvence.

## 8) Gamifikace (core loop)

Hlavní smyčka:
1. Krátká lekce nebo kvíz.
2. Okamžitá zpětná vazba.
3. XP + progress + odměna.
4. Nová mise na další den.

Povinné prvky:
- XP
- Levely
- Streak
- Odznaky
- Týdenní výzvy (V1)

## 9) Analytika a KPI

## 9.1 Landing KPI

- návštěva -> submit formuláře (konverze)
- cena za lead
- zdroj leadu (organik, social, referral)

## 9.2 App KPI

- dokončení onboardingu
- D1 / D7 retence
- počet testů na uživatele týdně
- dokončení simulace testu
- konverze Free -> Premium

## 10) Roadmapa po fázích

## Fáze 0 (Týden 1): Strategický základ

- finalizace scope MVP
- vytvoření datových JSON struktur
- napsání prvních 20 ryb, 150 otázek, 10 uzlů

Výstup:
- první obsahový balík připravený pro appku

## Fáze 1 (Týden 2): Landing + validace trhu

- nasazení landing page
- napojení formuláře a e-mail nástroje
- základní analytika (eventy)

Výstup:
- sběr prvních leadů

## Fáze 2 (Týden 3-6): MVP aplikace

- implementace hlavních obrazovek
- napojení na lokální/remote data
- gamifikace v základní verzi
- paywall + nákup

Výstup:
- funkční MVP pro interní test

## Fáze 3 (Týden 7-8): Beta test

- 20-50 rodin v pilotu
- sběr zpětné vazby
- ladění UX, obsahu, motivace

Výstup:
- stabilní release kandidát

## Fáze 4 (Týden 9-10): Launch

- store listing
- aktivace čekací listiny
- launch kampaň

Výstup:
- veřejná verze V1

## 11) Backlog priorit (MoSCoW)

## Must

- Atlas + detail ryb
- Testy + základ simulace
- XP/level/streak
- Základní deník
- Landing + waitlist

## Should

- Vysvětlení chyb v testech
- Rozšířená knihovna uzlů
- Rodičovský přehled pokroku

## Could

- Offline
- Audio režim
- Sezónní eventy

## Won't (teď)

- Sociální síť/chat mezi dětmi
- Složité AR funkce

## 12) Týmové role a odpovědnosti

- Produkt: scope, roadmapa, KPI.
- Obsah: ryby, otázky, pravidla, kontrola správnosti.
- Design: UI kit, dark mode, UX testy.
- Vývoj: app + landing + analytika.
- Marketing: waitlist, e-mailing, launch kampaně.

## 13) Rizika a prevence

- Riziko: moc široké MVP.
  - Prevence: striktní must-have seznam.
- Riziko: nízká retence dětí.
  - Prevence: krátké lekce + gamifikace + denní mise.
- Riziko: slabá důvěra rodičů.
  - Prevence: report pokroku, transparentní obsah, bezpečnost.

## 14) Akční checklist pro nejbližších 14 dní

1. Zamknout scope MVP.
2. Připravit schema JSON.
3. Naplnit první obsah.
4. Nakreslit wireframy 5 hlavních obrazovek.
5. Vytvořit landing copy + grafický koncept.
6. Spustit waitlist formulář.
7. Sledovat první data a upravit messaging.

---

## Poznámka k realizaci

Po schválení tohoto dokumentu se vytvoří:
- technický implementační plán po repozitářových souborech,
- konkrétní backlog tiketů,
- první verze copy pro landing page,
- návrh datových JSON souborů pro okamžité naplnění.
