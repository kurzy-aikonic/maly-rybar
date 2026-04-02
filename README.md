# Maly rybar

Projekt obsahuje:

- `landing/` - landing page pro cekaci listinu
- `api/` - Vercel serverless endpointy (napr. `/api/waitlist`)
- `data/` - obsahove JSON zdroje (ryby, testy, uzly, reviry)
- `app/` - sdilena logika pro mobilni appku (TypeScript)
- `mobile/` - Expo (React Native) aplikace - Faze 2+
- `supabase/migrations/` - SQL migrace

## Rychly start

1. Zkopiruj `.env.example` do `.env.local`.
2. Vypln:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Nasad **cely repozitar** na Vercel (root projektu). Korenova URL `/` presmeruje na `/landing/`.
   Otevri tedy `https://tvuj-projekt.vercel.app/landing/` nebo jen `https://tvuj-projekt.vercel.app/` (redirect).
4. Aplikuj SQL migraci v Supabase SQL editoru.

## Lokalne

Pro lokalni preview landingu muze stacit staticky server, ale pro test `/api/waitlist`
je nejjednodussi pouzit Vercel CLI:

```bash
vercel dev
```

Pak otevrej `http://localhost:3000/landing/`.

## Mobilni aplikace (Expo)

```bash
cd mobile
npm install
npm run start
```

Metro nacita JSON z korenoveho `data/` (sdileny obsah s webem).

### Kontrola obsahu (atlas, kviz, reviry, PDF karet, mobilni obrazky)

```bash
cd mobile
npm run audit-data
```

Spusti `scripts/audit-app-data.mjs`: overi strukturu `data/*.json`, odkazy `similar_species` a `regions.target_species`, otazky v kvizu, volitelne parovani `source_cards/ryby.pdf` s atlasem (vyzaduje `pypdf` v `.pdf_tools` / PYTHONPATH) a nakonec `check-fish-assets` (mapa obrazku v mobilu).

### Bez App Store / bez Xcode (nahled v prohlizeci)

Kdyz ti nejde App Store nebo nechces instalovat Xcode, spust Metro a v terminalu zmackni **`w`** (web),
nebo:

```bash
cd mobile
npm run web
```

Balicky `react-dom` a `react-native-web` uz jsou v projektu. Kdyby `npx expo install ...` u tebe
padalo na siti, pouzij jen `npm install` v `mobile/`.

Kompletni mobilni chovani je nejblizsi na **Androidu / iPhonu**; web staci na rychly nahled UI.

### Supabase pro mobil (auth + denik)

1. V Supabase SQL editoru spust migrace z `supabase/migrations/` (vcetne
   `20260401_profiles_and_diary.sql` pro `profiles` a `diary_entries`).
2. V `mobile/` zkopiruj `.env.example` do `.env` a dopln URL + **anon** klic (ne service role).
3. V Supabase: **Authentication → URL configuration → Redirect URLs** pridej:
   - `malyrybar://auth/callback` (scheme z `mobile/app.json`) — **telefon / Expo development build**
   - **`http://localhost:8081/**`** — **Expo web (`w`)**: magic link v e-mailu presmeruje do prohlizece na localhost (port si over v terminalu u Metro, typicky 8081). Bez tohoto Supabase odkaz zamitne.
   - pro Expo Go: `exp://127.0.0.1:8081/--/auth/callback` s **tvym** portem (nebo `exp://**` jen pokud ti to bezpecnostne vyhovuje)

Magic link v profilu aplikace; po prihlaseni se denik slouci mistni + vzdaleny. **Lokalni web** auth po upravach v kodu funguje; drive chybelo nacist tokeny z URL a casto i redirect whitelist pro localhost.

### Web: „Failed to fetch“ pri magic linku

Neni to kodova chyba v Expo, ale **sit / konfigurace**:

1. `.env` v `mobile/` — `EXPO_PUBLIC_SUPABASE_URL` musi byt **presne** Project URL z Supabase (napr. `https://xxxxx.supabase.co`), **bez** uvozovek a bez koncoveho `/`. Po zmene **restart Metro** a **tvrdy reload** prohlizece.
2. **VPN, firemni proxy, blokator reklam** — zkus docasne vypnout; v Chrome **F12 → Sit (Network)** udelej znovu odeslani a podivej se, jestli request padá na `*.supabase.co`.
3. **Projekt v Supabase** — nesmi byt paused; v dashboardu vyzkousej, ze API odpovida.

### Expo hlasi `TypeError: fetch failed` pri `expo start`

Expo CLI pri startu vola internet (validace verzi). Pokud mas VPN, firemni sif, DNS
blok nebo docasne vypadky, spust:

```bash
cd mobile
npm run start
```

Skript je nastaveny na `expo start --offline`.

Volitelny **online** rezim (`npm run start:online`) funguje jen pokud Mac **umi HTTPS** na servery Expo.
Kdyz i u tebe pada `TypeError: fetch failed` uz pri startu CLI, **je to normalni na sitich s VPN/firewallem** —
proste pouzivej **`npm run start`** (offline) a Metro pobezi stejne dobre.

Online zkus az pri docasnem vypnuti VPN / jine Wi-Fi / jinem DNS (napr. 1.1.1.1).

### Expo Go pise „Something went wrong“

1. Aktualizuj **Expo Go** v App Store / Google Play (projekt pouziva **Expo SDK 54**).
2. Vypni u projektu **New Architecture** pokud mas problemy — v `mobile/app.json` je
   `newArchEnabled: false`.
3. Podivej se do **terminálu Metro**: pri otevreni projektu casto uvidis cerveny text s presnou chybou.
4. Zkus **Reload** v Expo Go (vytoct menu / potraseni telefonem) nebo `r` v Metro.

### Android: `IOException: failed to download remote update`

Typicky kombinace **blokovane sitove cesty** + toho, ze Expo Go se pokousi stahnout cast manifestu
**z internetu**, zatimco ty spoustis Metro **offline** a/nebo mas problemy s LAN na Wi-Fi.

**Dulezite:** Kdyz na Macu **nefunguje** `npm run start:online` (`fetch failed`), **nepomuze** ani tunnel —
tunnel taky potrebuje, aby Mac dosahoval na Expo.

**Co delat (od nejjistejsiho):**

1. Na Macu spust **`npm run start`** (offline), nech bezet Metro a zapis si **port** (8081 nebo 8082).
2. **Zavres duplicitni Metro** (starsi okno), aby byl jen jeden port — nebo `kill` PID, co Expo vypise.
3. **USB kabel** — na Macu (s Android platform tools) spust:

   ```bash
   adb reverse tcp:8082 tcp:8082
   ```

   (cislo **8082** nahrad tim, co pise Metro — pokud je 8081, pouzij 8081.)

4. V Expo Go: **Enter URL manually** → `exp://127.0.0.1:8082` (opet spravny port).
   Tim jde provoz **pres USB**, obchazi cast problemu Wi-Fi a „remote update“.
5. Bez USB: stejna Wi-Fi, VPN **vypnuta** na telefonu i Macu, rucne `exp://192.168.x.x:PORT` z terminálu.
6. Aktualizuj **Expo Go** z Obchodu Play; pripadne **vymaz dat** u Expo Go.

### Premium — RevenueCat (fáze 6)

- Nákupní logika: `react-native-purchases`, **`Purchases.logIn(uuid)`** = Supabase `user.id`.
- Pravda na serveru: Vercel **`/api/revenuecat-webhook`** zapisuje `profiles.is_premium` (service role).
- Návod krok za krokem: [docs/FAZE_6_REVENUECAT.md](docs/FAZE_6_REVENUECAT.md).
- Na ostrém účtu nefunguje přepínač Premium z dev — stav bere aplikace ze Supabase po webhooku.

## Bezpecnost

- `SUPABASE_SERVICE_ROLE_KEY` je pouze server-side tajemstvi.
- Nikdy ho nedavej do klientskych souboru ani do repozitare.
