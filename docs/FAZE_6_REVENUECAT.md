# Fáze 6 — Premium přes RevenueCat (IAP) + Supabase

Pravda o předplatném je v **`profiles.is_premium`** (Supabase). Klient ji jen **čte**; po platbě ji mění **webhook z RevenueCat** na Vercelu (`api/revenuecat-webhook.js`) pomocí **service role**.

## 1. RevenueCat projekt

1. Vytvoř projekt a apps pro **iOS** + **Android** v [RevenueCat](https://www.revenuecat.com/).
2. Propoj **App Store Connect** / **Google Play** a produkt předplatného.
3. Vytvoř **Entitlement** (např. `premium`) a přiřaď ho k produktu.
4. Vytvoř **Offering** (např. `default`) s balíčkem — aplikace bere první `availablePackages` z `offerings.current`.

## 2. Identita uživatele

Po přihlášení volá appka **`Purchases.logIn(<supabase_user_uuid>)`**. Stejné UUID musí chodit v webhooku jako **`app_user_id`** — pak webhook bezpečně zapíše `profiles.is_premium` tomu řádku.

## 3. Mobil (.env)

V `mobile/.env` (viz `.env.example`):

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- volitelně `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` (default `premium`)

**Expo Go** native modul pro nákupy typicky neběží — použij **development build** (`expo prebuild` / EAS Build).

## 4. Vercel (webhook)

V projektu je endpoint: **`/api/revenuecat-webhook`**.

Na Vercelu nastav (server-only):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTHORIZATION` — **celá** hodnota hlavičky `Authorization`, kterou RevenueCat pošle (např. přesně `Bearer tajemstvi`)
- `REVENUECAT_ENTITLEMENT_ID` — shodné s RC entitlement (default `premium`)

V RevenueCat **Integrations → Webhooks**:

- URL: `https://tvuj-projekt.vercel.app/api/revenuecat-webhook`
- Authorization header: stejná stringová hodnota jako `REVENUECAT_WEBHOOK_AUTHORIZATION`

Webhook reaguje na události typu nákup/obnova (a `EXPIRATION` → `is_premium = false`). `CANCELLATION` mění stav až po doběhnutí období — dokud nedorazí `EXPIRATION`, uživatel zůstává Premium.

## 5. Kontrola

1. Sandbox nákup na zařízení → v RC vidíš transakci.
2. Webhook v RC „Delivery“ bez chyby.
3. V Supabase `profiles.is_premium = true` pro dané `id`.
4. V app **Profil** → „Obnovit stav účtu ze serveru“ (nebo restart).

## 6. Lokální kontrola assetů ryb

```bash
cd mobile && npm run check-fish-assets
```
