/* ==========================================================================
   AryaAI — site.js
   Progressive enhancement only. With JavaScript unavailable the navigation is
   a plain link list, every accordion is a native <details>, and all content is
   already in the HTML. Nothing here is required to read the site.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */

  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // A resize that leaves the mobile breakpoint must not strand the panel open.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ----------------------------------------------------------------------
     Header border on scroll
     ---------------------------------------------------------------------- */

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  /* ----------------------------------------------------------------------
     Active navigation row
     ---------------------------------------------------------------------- */

  function initActiveNav() {
    var here = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav__link").forEach(function (link) {
      var target = link.getAttribute("href");
      if (!target) return;
      if (target.split("#")[0] === here) link.setAttribute("aria-current", "page");
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // No observer, or the reader asked for less motion: show everything now.
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Copy buttons on code blocks
     ---------------------------------------------------------------------- */

  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (button) {
      button.addEventListener("click", function () {
        var source = button.closest(".code");
        var code = source ? source.querySelector("pre") : null;
        if (!code) return;

        var text = code.innerText;

        function done(ok) {
          button.textContent = ok ? "Copied" : "Press Ctrl+C";
          button.classList.toggle("is-copied", ok);
          window.setTimeout(function () {
            button.textContent = "Copy";
            button.classList.remove("is-copied");
          }, 1800);
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () {
              done(true);
            },
            function () {
              done(false);
            }
          );
          return;
        }

        // file:// has no secure context, so fall back to a selection the reader copies.
        var range = document.createRange();
        range.selectNodeContents(code);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        done(false);
      });
    });
  }

  /* ----------------------------------------------------------------------
     Companion state cycler
     ---------------------------------------------------------------------- */

  function initCompanion() {
    var stage = document.querySelector("[data-companion]");
    if (!stage || reduceMotion.matches) return;

    var states = (stage.getAttribute("data-companion") || "").split(",").filter(Boolean);
    if (states.length < 2) return;

    var image = stage.querySelector("img");
    var label = stage.querySelector("[data-companion-label]");
    if (!image) return;

    var base = image.getAttribute("data-base");
    if (!base) return;

    var index = 0;
    var timer = null;

    function advance() {
      index = (index + 1) % states.length;
      var state = states[index];
      image.src = base + state + "/animated/256.webp";
      image.alt = "Arya in her " + state.replace(/-/g, " ") + " state";
      if (label) label.textContent = state.replace(/-/g, " ");
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(advance, 4200);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    // Only animate while the stage is actually on screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.25 }
      ).observe(stage);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */

  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------------------------------------------------------------------- */

  function init() {
    initNav();
    initHeader();
    initActiveNav();
    initReveal();
    initCopy();
    initCompanion();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
