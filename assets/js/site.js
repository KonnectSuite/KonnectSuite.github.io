/* ==========================================================================
   AryaAI — site.js
   Progressive enhancement only. With JavaScript unavailable the navigation is
   a plain link list, every accordion is a native <details>, and all content is
   already in the HTML. Nothing here is required to read the site.

   The stylesheet hides the reveal items, the collapsed mobile panel and the
   copy buttons ONLY under the `site-js` class added below. If this script is
   blocked, fails to parse, or throws, the site fails OPEN: the mobile panel
   never collapses, nothing sits at opacity 0, and no inert button is drawn.
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("site-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // MediaQueryList.addEventListener is absent in older Safari; fall back to it.
  function onMotionChange(handler) {
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", handler);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(handler);
    }
  }

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

     Under prefers-reduced-motion the timer never runs and the kit's
     `reduced-motion.png` still is swapped in for the animated WebP, on every
     page — index.html's <picture> does this in markup, but features.html's bare
     <img> has no <source>, and CSS cannot stop a WebP's frames nor rewrite an
     <img> src. Cycling one still to another every 4.2s is itself motion, so
     under reduce the state is held as well as the frame.
     ---------------------------------------------------------------------- */

  function initCompanion() {
    var stage = document.querySelector("[data-companion]");
    if (!stage) return;

    var states = (stage.getAttribute("data-companion") || "").split(",").filter(Boolean);
    if (!states.length) return;

    var image = stage.querySelector("img");
    var label = stage.querySelector("[data-companion-label]");
    if (!image) return;

    var base = image.getAttribute("data-base");
    if (!base) return;

    var index = 0;
    var timer = null;
    var inView = false;
    var pageVisible = !document.hidden;

    function show(i) {
      index = i;
      var state = states[index];
      image.src = base + state + (reduceMotion.matches ? "/reduced-motion.png" : "/animated/256.webp");
      image.alt = "Arya in her " + state.replace(/-/g, " ") + " state";
      if (label) label.textContent = state.replace(/-/g, " ");
    }

    function start() {
      // Under reduce this is a no-op, so no timer can be left running.
      if (timer || reduceMotion.matches || states.length < 2) return;
      timer = window.setInterval(function () {
        show((index + 1) % states.length);
      }, 4200);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    function sync() {
      if (inView && pageVisible) start();
      else stop();
    }

    show(index);

    // A mid-session change of the OS setting must take effect with no reload:
    // stop or hold the still, re-point the source, then resume if it is on screen.
    onMotionChange(function () {
      stop();
      show(index);
      sync();
    });

    // Only animate while the stage is on screen and the tab is visible. The
    // observer is registered even under reduce, so turning motion back on
    // mid-session can still find the stage and start.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            inView = entry.isIntersecting;
            sync();
          });
        },
        { threshold: 0.25 }
      ).observe(stage);
    } else {
      inView = true;
      sync();
    }

    document.addEventListener("visibilitychange", function () {
      pageVisible = !document.hidden;
      sync();
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

  // One broken enhancement must not take the others down with it. Without this
  // a throw in, say, initNav would stop initReveal from running and leave every
  // reveal item at opacity 0 for the rest of the visit.
  function safe(name, fn) {
    try {
      fn();
    } catch (error) {
      if (window.console && window.console.warn) {
        window.console.warn("site.js: " + name + " failed", error);
      }
    }
  }

  function init() {
    safe("nav", initNav);
    safe("header", initHeader);
    safe("activeNav", initActiveNav);
    safe("reveal", initReveal);
    safe("copy", initCopy);
    safe("companion", initCompanion);
    safe("year", initYear);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
