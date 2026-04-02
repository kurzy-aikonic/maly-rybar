import crypto from "node:crypto";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function timingSafeAuth(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || "")
  );
}

function computePremiumFromEvent(event, entitlementId) {
  if (!event || typeof event !== "object") return null;
  const type = String(event.type || "");
  const ids = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];

  if (type === "EXPIRATION") return false;

  const grantsPremium =
    ids.includes(entitlementId) ||
    (event.entitlement_id != null && String(event.entitlement_id) === entitlementId);

  const positiveTypes = new Set([
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
    "SUBSCRIPTION_EXTENDED",
    "PRODUCT_CHANGE",
    "TEST"
  ]);

  if (positiveTypes.has(type) && grantsPremium) return true;

  if (type === "CANCELLATION" || type === "BILLING_ISSUE") return null;

  return null;
}

/**
 * RevenueCat → Supabase: profiles.is_premium
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "premium";

  if (!expectedAuth || !supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: "Server missing REVENUECAT_WEBHOOK_AUTHORIZATION or Supabase env" });
  }

  const authHeader = req.headers.authorization || "";
  if (!timingSafeAuth(authHeader, expectedAuth)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }

  const event = body && body.event;
  if (!event) {
    return json(res, 400, { error: "Missing event" });
  }

  const appUserId = event.app_user_id != null ? String(event.app_user_id).trim() : "";
  if (!isUuid(appUserId)) {
    return json(res, 400, { error: "Invalid app_user_id" });
  }

  const nextFlag = computePremiumFromEvent(event, entitlementId);
  if (nextFlag === null) {
    return json(res, 200, { ok: true, skipped: true, reason: "no_change", type: event.type });
  }

  const updatedAt = new Date().toISOString();

  const upsertRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      id: appUserId,
      is_premium: nextFlag,
      updated_at: updatedAt
    })
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text().catch(() => "");
    return json(res, 502, {
      error: "Supabase upsert failed",
      detail: errText.slice(0, 500)
    });
  }

  return json(res, 200, {
    ok: true,
    user: appUserId,
    is_premium: nextFlag,
    event_type: event.type
  });
}
