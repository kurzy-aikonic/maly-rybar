(function () {
  var STORAGE_KEY = "maly_rybar_cookie_v1";
  var FONT_LINK_ID = "maly-rybar-fonts";

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setConsent(level) {
    var payload = { level: level, t: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* private mode */
    }
    applyConsent(level);
    hideBanner();
    if (level === "all") {
      track("landing_view", { source: "direct", after_consent: true });
    }
  }

  function loadGoogleFonts() {
    if (document.getElementById(FONT_LINK_ID)) return;
    var link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Outfit:wght@600;700;800&display=swap";
    document.head.appendChild(link);
    document.documentElement.classList.add("fonts-loaded");
  }

  function applyConsent(level) {
    if (level === "all") {
      loadGoogleFonts();
    } else {
      document.documentElement.classList.remove("fonts-loaded");
    }
  }

  function showBanner() {
    var b = document.getElementById("cookieBanner");
    if (b) {
      b.classList.add("is-visible");
    }
  }

  function hideBanner() {
    var b = document.getElementById("cookieBanner");
    if (b) {
      b.classList.remove("is-visible");
    }
  }

  function initCookieUi() {
    var existing = getConsent();
    if (existing && (existing.level === "necessary" || existing.level === "all")) {
      applyConsent(existing.level);
      return;
    }
    showBanner();
    var btnNec = document.getElementById("cookieNecessary");
    var btnAll = document.getElementById("cookieAll");
    if (btnNec) btnNec.addEventListener("click", function () { setConsent("necessary"); });
    if (btnAll) btnAll.addEventListener("click", function () { setConsent("all"); });
  }

  function track(eventName, payload) {
    var c = getConsent();
    if (!c || c.level !== "all") return;
    // Po zapojení GA4 / Plausible sem vlož gtag nebo analytics.track
    if (typeof console !== "undefined" && console.log) {
      console.log("[track]", eventName, payload || {});
    }
  }

  initCookieUi();

  var consentForView = getConsent();
  if (consentForView && consentForView.level === "all") {
    track("landing_view", { source: "returning" });
  }

  document.querySelectorAll("a.btn, button.btn").forEach(function (button) {
    button.addEventListener("click", function () {
      track("cta_click", { cta_text: (button.textContent || "").trim() || "unknown" });
    });
  });

  var form = document.getElementById("waitlistForm");
  var formMessage = document.getElementById("formMessage");

  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    var formData = new FormData(form);
    var email = String(formData.get("email") || "").trim();
    var role = String(formData.get("role") || "").trim();
    var childAge = String(formData.get("childAge") || "").trim();
    var consentPrivacy = formData.get("consentPrivacy");

    if (!email || !role) {
      if (formMessage) formMessage.textContent = "Vyplňte e-mail a roli.";
      return;
    }

    if (!consentPrivacy) {
      if (formMessage) {
        formMessage.textContent = "Pro odeslání je potřeba souhlas se zpracováním údajů (zaškrtněte políčko u zásad).";
      }
      return;
    }

    track("waitlist_submit", {
      role: role,
      child_age: childAge || null
    });

    try {
      var response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, role: role, childAge: childAge })
      });

      if (!response.ok) {
        if (formMessage) formMessage.textContent = "Odeslání se nepovedlo. Zkuste to prosím znovu.";
        return;
      }

      if (formMessage) {
        formMessage.textContent =
          "Děkujeme! Jste na čekací listině. Ozveme se před spuštěním.";
        formMessage.classList.add("ok");
      }
      form.reset();
      track("waitlist_submit_success", { role: role });
    } catch (err) {
      if (formMessage) formMessage.textContent = "Došlo k chybě spojení. Zkuste to prosím znovu.";
    }
  });
})();
