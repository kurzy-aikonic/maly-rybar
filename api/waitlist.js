function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: "Server is missing Supabase env vars" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "Invalid JSON payload" });
    }
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const role = String(body?.role || "").trim();
  const childAgeRaw = body?.childAge;
  const childAge =
    childAgeRaw === "" || childAgeRaw === null || typeof childAgeRaw === "undefined"
      ? null
      : Number(childAgeRaw);

  if (!isValidEmail(email)) {
    return json(res, 400, { error: "Invalid email" });
  }
  if (!["parent", "child"].includes(role)) {
    return json(res, 400, { error: "Invalid role" });
  }
  if (childAge !== null && (!Number.isInteger(childAge) || childAge < 8 || childAge > 15)) {
    return json(res, 400, { error: "Invalid childAge" });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation,resolution=merge-duplicates"
    },
    body: JSON.stringify({
      email,
      role,
      child_age: childAge
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return json(res, 500, { error: "Supabase insert failed", detail: errorText });
  }

  return json(res, 200, { ok: true });
}
