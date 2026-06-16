/* Høvleriet — demo interactions */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];

  /* Opening hours: day -> [openHour, closeHour] (24h, decimals), null = closed */
  var HOURS = {
    0: [12, 19],   // søndag
    1: null,       // mandag
    2: [10, 17],   // tirsdag
    3: [10, 17],   // onsdag
    4: [10, 19],   // torsdag
    5: [10, 20],   // fredag
    6: [10, 19]    // lørdag
  };

  function fmt(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    return (hh < 10 ? "0" + hh : hh) + ":" + (mm < 10 ? "0" + mm : mm);
  }

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Demo banner ---------- */
  var banner = document.getElementById("demoBanner");
  var demoClose = document.getElementById("demoClose");
  if (demoClose && banner) {
    demoClose.addEventListener("click", function () { banner.classList.add("is-hidden"); });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  function closeNav() {
    if (!links) return;
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Åpne meny");
    document.body.style.overflow = "";
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Lukk meny" : "Åpne meny");
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- Active nav link on scroll ---------- */
  var navAnchors = links ? Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]:not(.nav__cta)')) : [];
  var sectionMap = {};
  navAnchors.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = document.getElementById(id);
    if (sec) sectionMap[id] = a;
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navAnchors.forEach(function (a) { a.classList.remove("is-active"); });
          var a = sectionMap[entry.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionMap).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* ---------- Open now / hours highlight ---------- */
  (function status() {
    var now = new Date();
    var day = now.getDay();
    var cur = now.getHours() + now.getMinutes() / 60;
    var today = HOURS[day];
    var isOpen = today && cur >= today[0] && cur < today[1];

    var dot = document.getElementById("statusDot");
    var text = document.getElementById("statusText");
    if (dot && text) {
      if (isOpen) {
        dot.classList.add("is-open");
        text.textContent = "Åpent nå · stenger kl " + fmt(today[1]);
      } else {
        dot.classList.add("is-closed");
        // find next opening
        var msg = "Stengt nå";
        for (var i = 0; i <= 7; i++) {
          var d = (day + i) % 7;
          var h = HOURS[d];
          if (!h) continue;
          if (i === 0 && cur < h[0]) { msg = "Stengt nå · åpner kl " + fmt(h[0]); break; }
          if (i === 0 && cur >= h[1]) { continue; }
          if (i > 0) { msg = "Stengt nå · åpner " + DAYS[d] + " kl " + fmt(h[0]); break; }
        }
        text.textContent = msg;
      }
    }
    // highlight today's row
    var row = document.querySelector('#hoursList li[data-day="' + day + '"]');
    if (row) row.classList.add("is-today");
  })();

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");
  var lastFocused = null;
  function openLightbox(src, alt) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lastFocused = document.activeElement;
    lightboxClose.focus();
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  document.querySelectorAll(".gallery-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var img = btn.querySelector("img");
      openLightbox(btn.getAttribute("data-full"), img ? img.alt : "");
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) closeLightbox();
  });

  /* ---------- Booking form (demo) ---------- */
  var form = document.getElementById("bookingForm");
  var statusEl = document.getElementById("bookingStatus");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        statusEl.textContent = "Fyll inn navn, telefon, antall, dato og tidspunkt.";
        statusEl.className = "booking__status is-error";
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var navn = (document.getElementById("navn").value || "").trim().split(" ")[0];
      statusEl.textContent = "Takk" + (navn ? ", " + navn : "") + "! Forespørselen er mottatt (demo) — vi tar kontakt for å bekrefte.";
      statusEl.className = "booking__status is-ok";
      form.reset();
      var g = document.getElementById("gjester"); if (g) g.value = 2;
    });
  }

  /* ---------- GSAP reveal animations ---------- */
  function initAnim() {
    if (prefersReduced || typeof window.gsap === "undefined") return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Hero — play on load
    var heroBits = gsap.utils.toArray(".hero [data-reveal]");
    if (heroBits.length) {
      gsap.from(heroBits, { y: 26, opacity: 0, duration: 0.8, ease: "power2.out", stagger: 0.12, delay: 0.15 });
    }

    // Subtle hero parallax
    if (window.ScrollTrigger) {
      gsap.to(".hero__media img", {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }

    // Horizontal scroll-pinned gallery (desktop + motion only)
    if (window.ScrollTrigger) {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 821px)", function () {
        var vp = document.getElementById("galleryViewport");
        var track = document.getElementById("galleryTrack");
        var bar = document.getElementById("galleryBar");
        if (!vp || !track) return;
        vp.classList.add("is-pinned");
        var distance = function () { return Math.max(0, track.scrollWidth - vp.clientWidth); };
        gsap.to(track, {
          x: function () { return -distance(); },
          ease: "none",
          scrollTrigger: {
            trigger: vp, start: "top top", end: function () { return "+=" + distance(); },
            pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) { if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"; }
          }
        });
        return function () { vp.classList.remove("is-pinned"); gsap.set(track, { clearProps: "transform" }); };
      });
    }

    // Section reveals
    var others = gsap.utils.toArray("[data-reveal]").filter(function (el) {
      return !el.closest(".hero");
    });
    others.forEach(function (el) {
      gsap.from(el, {
        y: 30, opacity: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
  }
  // Run after deferred GSAP scripts have executed
  if (document.readyState === "complete") initAnim();
  else window.addEventListener("load", initAnim);
})();
