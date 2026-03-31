# Analytics Events - Maly rybar

## Naming

- Eventy zapisovat v `snake_case`.
- Posilat konzistentni parametry.
- Kazdy event musi obsahovat `platform` a `app_version`.

## Landing events

- `landing_view`
  - params: `source`, `campaign`
- `cta_click`
  - params: `placement`, `cta_text`
- `waitlist_submit`
  - params: `role`, `child_age`, `exam_horizon`
- `waitlist_submit_success`
  - params: `role`

## App events

- `onboarding_started`
  - params: `entry_point`
- `onboarding_completed`
  - params: `child_age`, `goal_exam_month`
- `quiz_started`
  - params: `mode`, `category`
- `quiz_finished`
  - params: `mode`, `score`, `duration_sec`
- `xp_earned`
  - params: `amount`, `source`
- `streak_updated`
  - params: `days`
- `atlas_fish_opened`
  - params: `fish_id`
- `diary_entry_created`
  - params: `has_photo`, `fish_id`
- `premium_paywall_viewed`
  - params: `placement`
- `premium_purchase_started`
  - params: `plan`
- `premium_purchase_success`
  - params: `plan`, `price`

## KPI mapovani

- Aktivace: `onboarding_completed`
- Engagement: `quiz_started`, `quiz_finished`, `atlas_fish_opened`
- Retence: `streak_updated`
- Monetizace: `premium_paywall_viewed`, `premium_purchase_success`
