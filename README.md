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
3. Nasad landing na Vercel (root projektu).
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
npx expo start
```

Metro nacita JSON z korenoveho `data/` (sdileny obsah s webem).

### Expo hlasi `TypeError: fetch failed` pri `expo start`

Expo CLI pri startu vola internet (validace verzi). Pokud mas VPN, firemni sif, DNS
blok nebo docasne vypadky, spust:

```bash
cd mobile
npm run start
```

Skript je nastaveny na `expo start --offline`. Online rezim:

```bash
npm run start:online
```

Pfipadne docasne vypni VPN / zmen DNS (napr. 1.1.1.1) a zkus znovu.

### Expo Go pise „Something went wrong“

1. Aktualizuj **Expo Go** v App Store / Google Play (projekt pouziva **Expo SDK 54**).
2. Vypni u projektu **New Architecture** pokud mas problemy — v `mobile/app.json` je
   `newArchEnabled: false`.
3. Podivej se do **terminálu Metro**: pri otevreni projektu casto uvidis cerveny text s presnou chybou.
4. Zkus **Reload** v Expo Go (vytoct menu / potraseni telefonem) nebo `r` v Metro.

## Bezpecnost

- `SUPABASE_SERVICE_ROLE_KEY` je pouze server-side tajemstvi.
- Nikdy ho nedavej do klientskych souboru ani do repozitare.
