(function () {
  const form = document.getElementById("waitlistForm");
  const formMessage = document.getElementById("formMessage");

  function track(eventName, payload) {
    // TODO: napojit na GA4 nebo jiny nastroj.
    console.log("[track]", eventName, payload || {});
  }

  track("landing_view", { source: "direct" });

  document.querySelectorAll(".btn").forEach(function (button) {
    button.addEventListener("click", function () {
      track("cta_click", { cta_text: button.textContent?.trim() || "unknown" });
    });
  });

  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "").trim();
    const childAge = String(formData.get("childAge") || "").trim();

    if (!email || !role) {
      formMessage.textContent = "Vypln e-mail a roli.";
      return;
    }

    track("waitlist_submit", {
      role: role,
      child_age: childAge || null
    });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, childAge })
      });

      if (!response.ok) {
        formMessage.textContent = "Odeslani se nepovedlo. Zkus to prosim znovu.";
        return;
      }

      formMessage.textContent =
        "Diky! Jsi na cekaci listine. Ozveme se pred spustenim.";
      form.reset();
      track("waitlist_submit_success", { role: role });
    } catch (err) {
      formMessage.textContent = "Doslo k chybe spojeni. Zkus to prosim znovu.";
    }
  });
})();
