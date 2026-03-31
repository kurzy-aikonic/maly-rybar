# Maly rybar

Projekt obsahuje:

- `landing/` - landing page pro cekaci listinu
- `api/` - Vercel serverless endpointy (napr. `/api/waitlist`)
- `data/` - obsahove JSON zdroje (ryby, testy, uzly, reviry)
- `app/` - sdilena logika pro mobilni appku
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

## Bezpecnost

- `SUPABASE_SERVICE_ROLE_KEY` je pouze server-side tajemstvi.
- Nikdy ho nedavej do klientskych souboru ani do repozitare.
