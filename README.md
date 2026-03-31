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

## Bezpecnost

- `SUPABASE_SERVICE_ROLE_KEY` je pouze server-side tajemstvi.
- Nikdy ho nedavej do klientskych souboru ani do repozitare.
