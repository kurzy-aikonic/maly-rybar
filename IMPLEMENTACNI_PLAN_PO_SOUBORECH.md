# Malý rybář - Implementační plán po souborech

Tento dokument navazuje na `MASTER_PLAN_MALY_RYBAR.md` a převádí strategii do exekučního pořadí souborů.

## 1) Pravidla realizace

- Pracovat po malých dodávkách (max 2-3 dny na jeden balík).
- Každý balík musí mít měřitelný výstup (soubor/funkce/obrazovka).
- Neřešit "nice-to-have", dokud není hotové MVP jádro.
- Každý týden vyhodnotit KPI a upravit priority.

## 2) Cílová adresářová struktura

```text
/
  docs/
    product-requirements.md
    content-guidelines.md
    analytics-events.md
    release-checklist.md
  data/
    fish.json
    quiz_questions.json
    knots.json
    regulations_summary.json
    regions.json
  app/
    navigation/
      tabs.tsx
      routes.ts
    screens/
      HomeScreen.tsx
      AtlasListScreen.tsx
      FishDetailScreen.tsx
      QuizModeSelectScreen.tsx
      QuizScreen.tsx
      QuizResultsScreen.tsx
      DiaryListScreen.tsx
      DiaryEntryScreen.tsx
      ProfileScreen.tsx
      PaywallScreen.tsx
    components/
      ProgressCard.tsx
      XPBadge.tsx
      FishCard.tsx
      QuizOption.tsx
      StreakWidget.tsx
      PremiumGate.tsx
    services/
      contentService.ts
      quizService.ts
      progressService.ts
      paywallService.ts
      analyticsService.ts
    store/
      userStore.ts
      progressStore.ts
      premiumStore.ts
  landing/
    index.html
    styles.css
    script.js
    privacy-policy.md
    terms.md
```

## 3) Fáze A - Dokumentace a pravidla (Den 1)

Vytvořit soubory:

- `docs/product-requirements.md`
  - definice MVP a V1
  - přesné uživatelské scénáře (dítě, rodič)
- `docs/content-guidelines.md`
  - styl textů pro děti 8-15
  - šablona pro rybu, otázku, uzel
- `docs/analytics-events.md`
  - seznam eventů + parametry
- `docs/release-checklist.md`
  - checklist před beta/launch

Definition of done:
- tým má jednotná pravidla pro obsah, tracking a release.

## 4) Fáze B - Datové jádro (Den 2-4)

Vytvořit soubory:

- `data/fish.json`
  - minimálně 20 ryb (MVP)
- `data/quiz_questions.json`
  - minimálně 150 otázek (kategorie + obtížnost)
- `data/knots.json`
  - minimálně 10 uzlů/montáží
- `data/regulations_summary.json`
  - přehled nejdůležitějších pravidel
- `data/regions.json`
  - základní data pro revíry (MVP placeholder)

Kontrola kvality dat:
- každá položka má `id`
- žádná prázdná povinná pole
- premium obsah má `is_premium: true`

Definition of done:
- aplikace má co zobrazovat i bez backendu.

## 5) Fáze C - Kostra aplikace (Den 5-8)

Vytvořit soubory:

- `app/navigation/routes.ts`
- `app/navigation/tabs.tsx`
- všechny obrazovky v `app/screens/` (prázdné skeletony)

Postup:
1. nejdřív rozchodit navigaci mezi obrazovkami
2. pak přidat základní komponenty
3. potom napojit na data ze `data/`

Definition of done:
- uživatel projde hlavní flow bez pádu aplikace.

## 6) Fáze D - Funkční MVP flow (Den 9-15)

Vytvořit/naplnit soubory:

- `app/services/contentService.ts`
  - načítání atlasu, uzlů, pravidel
- `app/services/quizService.ts`
  - generování otázek, vyhodnocení, score
- `app/services/progressService.ts`
  - XP, level, streak, progress
- `app/store/userStore.ts`
- `app/store/progressStore.ts`
- `app/components/ProgressCard.tsx`
- `app/components/StreakWidget.tsx`

Hotové MVP scénáře:
- dítě dokončí test
- dostane XP
- vidí pokrok na domovské obrazovce
- otevře atlas a detail ryby
- přidá záznam do deníku

Definition of done:
- MVP learning loop je hotový: lekce/test -> feedback -> odměna -> další krok.

## 7) Fáze E - Premium vrstva (Den 16-19)

Vytvořit soubory:

- `app/services/paywallService.ts`
- `app/store/premiumStore.ts`
- `app/components/PremiumGate.tsx`
- `app/screens/PaywallScreen.tsx`

Pravidla:
- obsah s `is_premium: true` ve Free ukáže teaser + lock
- Paywall vždy vysvětluje konkrétní benefit, ne obecné fráze

Definition of done:
- Free/Premium hranice je funkční a srozumitelná.

## 8) Fáze F - Landing page (paralelně Den 5-10)

Vytvořit soubory:

- `landing/index.html`
- `landing/styles.css`
- `landing/script.js`
- `landing/privacy-policy.md`
- `landing/terms.md`

Obsah `index.html`:
- Hero + hlavní benefit
- problém rodiče
- jak funguje appka
- Free vs Premium
- FAQ
- formulář čekací listiny

Obsah `script.js`:
- validace formuláře
- odeslání do nástroje (placeholder endpoint)
- event tracking (`waitlist_submit`, `cta_click`)

Definition of done:
- veřejně dostupná stránka sbírá leady a měří konverzi.

## 9) Fáze G - Analytika a měření (Den 11-16)

Vytvořit/naplnit:

- `app/services/analyticsService.ts`
- `docs/analytics-events.md` (finální verze)

Povinné eventy aplikace:
- `onboarding_completed`
- `quiz_started`
- `quiz_finished`
- `xp_earned`
- `premium_paywall_viewed`
- `premium_purchase_started`
- `premium_purchase_success`

Povinné eventy landing:
- `landing_view`
- `cta_click`
- `waitlist_submit`
- `waitlist_submit_success`

Definition of done:
- vidíme funnel landing i appky.

## 10) Fáze H - Beta a iterace (Den 20-30)

Soubor pro řízení:
- `docs/beta-feedback-log.md` (vytvořit při startu bety)

Každý feedback zapsat:
- role (rodič/dítě)
- problém
- dopad (1-5)
- priorita (P0/P1/P2)
- navržené řešení

Definition of done:
- 2-3 kola oprav, stabilní build na launch.

## 11) Minimální backlog (prvních 20 tiketů)

1. Vytvořit `docs/product-requirements.md`
2. Vytvořit `docs/content-guidelines.md`
3. Vytvořit `data/fish.json` schema
4. Naplnit prvních 20 ryb
5. Vytvořit `data/quiz_questions.json` schema
6. Naplnit 150 otázek
7. Vytvořit `data/knots.json`
8. Navigace tabs + routes
9. Skeleton `HomeScreen.tsx`
10. Skeleton `AtlasListScreen.tsx`
11. Skeleton `FishDetailScreen.tsx`
12. Implementace `quizService.ts`
13. Implementace `progressService.ts`
14. Komponenta `ProgressCard.tsx`
15. Komponenta `StreakWidget.tsx`
16. Paywall screen + premium gate
17. Landing hero + CTA
18. Landing waitlist form + submit
19. Analytics eventy v appce
20. Analytics eventy na landingu

## 12) Kvalitativní standard "Top app"

- Každá obrazovka odpoví na otázku "co mám udělat dál?".
- Dítě je odměněno do 60 sekund od otevření aplikace.
- Každý test má vysvětlení (u Premium povinně).
- Každý premium lock má jasný důvod a benefit.
- Žádné dlouhé bloky textu bez vizuální opory.

## 13) Co dělat hned teď (první praktický sprint)

Sprint 1 (7 dní):
1. Vytvořit složky `docs/`, `data/`, `landing/`.
2. Napsat první verze souborů v `docs/`.
3. Vytvořit data schema + naplnit první dataset.
4. Postavit landing skeleton s formulářem.
5. Připravit wireframe 5 hlavních obrazovek appky.

Výstup sprintu:
- funkční landing + připravený obsah + jasný základ pro app vývoj.

---

Pokračování po tomto plánu: vytvořit hned konkrétní obsah souborů v `docs/` a základní JSON šablony v `data/`.
