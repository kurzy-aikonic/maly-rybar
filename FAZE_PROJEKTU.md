# Malý rybář — fáze vývoje (sekvenční, od nejnutnějších)

Tento dokument je **pořadník práce**. Každá fáze má výstupy a „bránu“ — pokračuj dál, až je předchozí fáze **hotová a otestovaná**.

**Tvůj stack:** Git · Supabase · Vercel · (mobilní appka — doporučení níže: **Expo**)

---

## Fáze 0 — Repozitář a struktura (den 0–1)

**Cíl:** Jedno místo pravdy, bez chaosu ve složkách.

**Úkoly**

- Inicializovat Git v kořeni projektu (pokud ještě není).
- Rozdělit jasně:
  - `landing/` → jen web, nasazení na Vercel
  - `app/` → sdílená logika (služby, typy) + později `app-mobile/` nebo `mobile/` pro Expo
- Přidat `.env.example` (bez tajných hodnot): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- Krátký `README.md`: jak spustit landing lokálně, kam co patří

**Hotovo když**

- Repo je na GitHubu (nebo jinde), clone funguje, struktura je srozumitelná.

**Brána do Fáze 1:** commit + push struktury.

---

## Fáze 1 — Landing na Vercelu + čekací listina (den 1–3)

**Cíl:** Měřitelný zájem — reálný sběr e-mailů, ne simulace ve `console.log`.

**Úkoly**

- Nasadit `landing/` na Vercel (root build nebo root `landing/` dle tvé konfigurace).
- V Supabase vytvořit tabulku např. `waitlist`:
  - `id` (uuid), `email` (text, unique kde dává smysl), `role` (text), `child_age` (int nullable), `created_at` (timestamptz default now())
- **RLS zapnuté** — politika: **anon může jen INSERT** na `waitlist` (ne SELECT cizích řádků).
- Upravit `landing/script.js` nebo malý serverless endpoint:
  - **Varianta A (nejjednodušší):** přímý `fetch` na Supabase REST z klienta s **anon key** (pouze pokud RLS striktně drží insert-only).
  - **Varianta B (bezpečnější):** Vercel Serverless Function → volá Supabase **service role** a validuje e-mail; anon key v klientovi nemusí psát do DB.
- GDPR: na `landing/` link na `privacy-policy.md` už máš jako návrh — před ostrým sběrem **doručit finální text** (právník / šablona).

**Hotovo když**

- Z ostrého webu pošleš testovací e-mail a **vidíš řádek v Supabase**.
- Vercel preview + production fungují.

**Brána do Fáze 2:** waitlist end-to-end funguje.

---

## Fáze 2 — Mobilní kostra (Expo) (den 3–7)

**Cíl:** Funkční „prázdná“ appka s navigací — vidíš ji na telefonu.

**Úkoly**

- `npx create-expo-app@latest` → např. složka `mobile/` v tomto repu.
- Spodní navigace: **Domů · Atlas · Testy · U vody · Profil**
- Přenést / importovat datovou logiku:
  - buď zatím **import lokálních JSON** z `data/` (nejrychlejší),
  - nebo připravit načítání z Supabase (až Fáze 4)
- Základní design (dark mode může být až v Fázi 3)

**Hotovo když**

- Build běží na fyzickém zařízení (Expo Go nebo dev client).
- Přepínání tabů bez pádu.

**Brána do Fáze 3:** mobilní shell existuje.

---

## Fáze 3 — MVP funkce offline (den 7–14)

**Cíl:** Dítě použije smyčku **kvíz → výsledek → XP** a **atlas**.

**Úkoly**

- **Atlas:** seznam + detail ryby (z `fish.json` nebo duplikovaného zdroje v `mobile/assets/data`).
- **Testy:** 10 náhodných otázek z `quiz_questions.json`, vyhodnocení, zobrazení skóre.
- **Pokrok lokálně:** AsyncStorage — `xp`, `level`, `streak`, `lastActiveDate` (logika máš koncepčně v `app/services/progressService.ts` — přenést do mobilu nebo sdílet přes workspace package později).
- **Paywall UI:** obrazovka „Premium“ + zamykání `is_premium` obsahu (zatím přepínač v Profilu „jsem Premium“ pro test).

**Hotovo když**

- 3 klíčové user story v mobilu: atlas otevřu, kvíz dokončím, XP se zvýší.

**Brána do Fáze 4:** MVP bez účtu funguje.

---

## Fáze 4 — Supabase pro aplikaci (den 14–21)

**Cíl:** Účet / identita + sync tam, kde to dává smysl.

**Úkoly**

- **Supabase Auth:** e-mail magic link nebo OAuth (co ti vyhovuje); pro děti často řeší rodičovský účet.
- Tabulky (minimálně):
  - `profiles` (`user_id`, `display_name`, `is_premium`, `child_age` nullable)
  - `quiz_runs` (volitelně — historie kvízů)
  - `catch_entries` pro deník (až Fáze 5)
- RLS: uživatel vidí **jen své** řádky.
- Mobil: `@supabase/supabase-js`, session persist.

**Hotovo když**

- Po přihlášení se profil načte a uloží se základní data.

**Brána do Fáze 5:** auth + profil v appce.

---

## Fáze 5 — Deník úlovků + revíry (MVP+) (den 21–28)

**Cíl:** Praktická hodnota u vody.

**Úkoly**

- Deník: vytvoření záznamu (datum, revír textově, druh ryby, délka, foto volitelně do Storage).
- Revíry: zatím **seznam z `regions.json`** nebo tabulka `waters` v Supabase + admin import.
- Mapa (Google/Mapbox) **až jako V1+** — teď nebrzdit MVP.

**Hotovo když**

- Uživatel uloží úlovek a znovu ho uvidí v seznamu (offline-first + sync později v rámci stejné fáze pokud stíháš).

**Brána do Fáze 6:** diary použitelné.

---

## Fáze 6 — Premium „naostro“ (den 28+)

**Cíl:** Platící uživatelé bez hacků.

**Úkoly**

- Rozhodnutí billing: **RevenueCat** (mobile in-app) nebo jiný ověřený flow.
- Server pravdy: `is_premium` v Supabase po ověření platby / webhooku.
- Appka: obnoví stav Premium po loginu.

**Hotovo když**

- Testovací nákup (sandbox) přepne Premium ve profilu.

**Brána do Fáze 7:** platby fungují v testu.

---

## Fáze 7 — Před App Store / Google Play (průběžně + před vydáním)

**Cíl:** Úředně a technicky připravený release.

**Úkoly**

- Ochrana soukromí (mobil + web), obchodní podmínky, věkové hodnocení, GDPR.
- TestFlight / Internal testing.
- Observabilita: crash reporting (Sentry), základní analytika (už máš seznam eventů v `docs/analytics-events.md`).
- Obsahová kontrola: míry, hájení, legislativa — **nutná revize** oproti aktuálním předpisům před marketingem.

**Hotovo když**

- Odevzdáno ke schválení obchodům (nebo připravený interní build pro větší betu).

---

# Doporučené pořadí práce (jedna věc za druhou)

1. **Fáze 0** — struktura + Git  
2. **Fáze 1** — Vercel + Supabase waitlist  
3. **Fáze 2** — Expo shell  
4. **Fáze 3** — atlas + kvíz + lokální XP  
5. **Fáze 4** — Supabase účty  
6. **Fáze 5** — deník + revíry (bez mapy)  
7. **Fáze 6** — Premium platby  
8. **Fáze 7** — release balíček  

---

# Co uděláme jako další konkrétní krok (až řekneš „jdeme“)

**Fáze 0 + 1 v kódu:** `.gitignore`, `README.md`, `.env.example`, úprava landingu pro Supabase insert (nebo Vercel funkci), SQL schéma `waitlist` + RLS politiky jako soubor v repu (např. `supabase/migrations/...`).

Tím pádem máš okamžitě **živý produktový kanál**: web sbírá leady, data jsou v Supabase, repo je připravené na Expo.
