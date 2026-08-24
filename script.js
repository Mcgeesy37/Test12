/* ==========================================================================
   Greenglanz - Interaktivitaet
   Mobiles Menue, Theme-Umschalter, Scroll-Reveal, FAQ-Akkordeon,
   Kontaktformular (Client-Validierung + Formspree).
   Kein Framework, keine Build-Schritte: laeuft direkt so, wie sie ist.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Erst jetzt (JS läuft) darf CSS Inhalte für die Scroll-Reveal-Animation
     überhaupt ausblenden. Siehe styles.css, Abschnitt "Scroll reveal". */
  document.documentElement.classList.add("js");

  /* ---------- Jahr im Footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky Header Schatten beim Scrollen ----------
     Bewusst kein scroll-Listener (feuert bei jedem Frame). Stattdessen
     beobachtet ein IntersectionObserver einen 1px-Sensor ganz oben:
     verlässt er den sichtbaren Bereich, wurde gescrollt. */
  var header = document.querySelector(".site-header");
  var sentinel = document.getElementById("scroll-sentinel");
  if (header && sentinel && "IntersectionObserver" in window) {
    var headerObserver = new IntersectionObserver(
      function (entries) {
        header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
      },
      { threshold: 0 }
    );
    headerObserver.observe(sentinel);
  }

  /* ---------- Mobiles Menü ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMobileNav() {
    if (!mobileNav || !navToggle) return;
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Menü öffnen");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    if (!mobileNav || !navToggle) return;
    mobileNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Menü schließen");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.contains("is-open");
      if (isOpen) closeMobileNav();
      else openMobileNav();
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) closeMobileNav();
    });
  }

  /* ---------- Theme-Umschalter (hell / dunkel) ---------- */
  var themeToggle = document.getElementById("theme-toggle");
  var root = document.documentElement;
  var THEME_KEY = "greenglanz-theme";

  function getSystemPrefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) {
      var isDark = theme === "dark" || (!theme && getSystemPrefersDark());
      themeToggle.setAttribute("aria-pressed", String(isDark));
    }
  }

  try {
    var stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored);
  } catch (err) {
    applyTheme(null);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var isDarkNow = current === "dark" || (!current && getSystemPrefersDark());
      var next = isDarkNow ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* Speicher nicht verfügbar, kein Problem */ }
    });
  }

  /* ---------- Scroll-Reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });

    /* Sicherheitsnetz: Sollte der Observer aus irgendeinem Grund für ein
       Element nie auslösen (z. B. ungewöhnliche Layouts, PDF-Export,
       sehr kurze Seitenaufrufe), spätestens nach 2.5s trotzdem einblenden. */
    window.setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }, 2500);
  }

  /* ---------- FAQ Akkordeon ---------- */
  document.querySelectorAll(".acc-item").forEach(function (item) {
    var trigger = item.querySelector(".acc-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  /* ---------- Kontaktformular ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var statusEl = document.getElementById("form-status");
    var submitBtn = form.querySelector(".btn-submit");

    function setFieldError(row, hasError) {
      if (!row) return;
      row.classList.toggle("has-error", hasError);
    }

    function validate() {
      var valid = true;
      var name = form.querySelector("#f-name");
      var email = form.querySelector("#f-email");
      var message = form.querySelector("#f-message");

      var nameRow = name.closest(".form-row");
      var emailRow = email.closest(".form-row");
      var messageRow = message.closest(".form-row");

      var nameOk = name.value.trim().length > 1;
      setFieldError(nameRow, !nameOk);
      if (!nameOk) valid = false;

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setFieldError(emailRow, !emailOk);
      if (!emailOk) valid = false;

      var messageOk = message.value.trim().length > 4;
      setFieldError(messageRow, !messageOk);
      if (!messageOk) valid = false;

      return valid;
    }

    ["f-name", "f-email", "f-message"].forEach(function (id) {
      var field = form.querySelector("#" + id);
      if (field) field.addEventListener("input", function () { validate(); });
    });

    form.addEventListener("submit", function (e) {
      if (!validate()) {
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = "Bitte die markierten Felder prüfen.";
          statusEl.className = "form-status is-error";
        }
        return;
      }

      var actionUrl = form.getAttribute("action") || "";
      if (actionUrl.indexOf("DEIN-FORMSPREE-ID") !== -1) {
        /* Formspree ist noch nicht eingerichtet, siehe README.md */
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = "Formular ist noch nicht verbunden. Bitte Formspree-ID in index.html eintragen (siehe README.md).";
          statusEl.className = "form-status is-error";
        }
        return;
      }

      e.preventDefault();
      if (submitBtn) submitBtn.setAttribute("disabled", "true");
      if (statusEl) {
        statusEl.textContent = "Wird gesendet ...";
        statusEl.className = "form-status";
      }

      fetch(actionUrl, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            if (statusEl) {
              statusEl.textContent = "Danke! Wir melden uns innerhalb eines Werktages.";
              statusEl.className = "form-status is-success";
            }
          } else {
            throw new Error("Formspree-Fehler");
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = "Senden hat nicht geklappt. Bitte rufen Sie uns direkt an oder schreiben Sie eine E-Mail.";
            statusEl.className = "form-status is-error";
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.removeAttribute("disabled");
        });
    });
  }
})();
