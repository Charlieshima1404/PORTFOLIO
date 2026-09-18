/* ==========================================================================
   ANIMATIONS
   --------------------------------------------------------------------------
   Handles all "on scroll" and ambient motion:
     - Reveal-on-scroll for elements marked .reveal / .reveal-stagger
     - The education timeline line drawing itself as you scroll past it
     - A custom cursor on desktop (auto-disabled on touch devices)
     - Header background + scroll progress bar + active nav highlighting

   ANIMATION SETTINGS: tweak timing/behaviour by editing the constants
   right below this comment block.
   ========================================================================== */

const ANIM_SETTINGS = {
  revealThreshold: 0.15,       // how much of an element must be visible to reveal it
  cursorEase: 0.18,            // 0–1, lower = laggier custom cursor ring
  headerScrollOffset: 40       // px scrolled before header gets a background
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

/* ---- Scroll reveal (IntersectionObserver) ---- */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: ANIM_SETTINGS.revealThreshold }
  );

  targets.forEach((el) => io.observe(el));
}

/* Re-scan for newly injected elements (called after main.js renders content) */
function refreshScrollReveal() {
  initScrollReveal();
}

/* ---- Education timeline: line draws itself as you scroll through it ---- */
function initTimelineDraw() {
  const wrap = document.getElementById("timeline");
  const line = document.getElementById("timeline-line");
  if (!wrap || !line) return;

  const items = () => wrap.querySelectorAll(".timeline-item");

  function update() {
    const rect = wrap.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Progress: 0 when the top of the timeline reaches the middle of the
    // viewport, 1 when the bottom of the timeline reaches the middle.
    const start = viewportH * 0.75;
    const end = viewportH * 0.35;
    const total = rect.height + (start - end);
    const traveled = start - rect.top;
    let progress = total > 0 ? traveled / total : 0;
    progress = Math.max(0, Math.min(1, progress));

    line.style.height = (progress * 100) + "%";

    items().forEach((item, i) => {
      const n = items().length;
      const itemThreshold = n > 1 ? i / n : 0;
      if (progress >= itemThreshold + 0.02) item.classList.add("in-view");
    });
  }

  if (prefersReducedMotion) {
    line.style.height = "100%";
    items().forEach((item) => item.classList.add("in-view"));
    return;
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* ---- Custom cursor (desktop, motion-enabled only) ---- */
function initCustomCursor() {
  if (isTouchDevice || prefersReducedMotion) return;

  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (!dot || !ring) return;

  document.body.classList.add("has-custom-cursor");

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  function loop() {
    ringX += (mouseX - ringX) * ANIM_SETTINGS.cursorEase;
    ringY += (mouseY - ringY) * ANIM_SETTINGS.cursorEase;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hoverSelector = "a, button, .project-card, .art-item, .project-featured, input, textarea";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverSelector)) ring.classList.add("is-active");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverSelector)) ring.classList.remove("is-active");
  });
}

/* ---- Header background + scroll progress + active nav section ---- */
function initHeaderAndProgress() {
  const header = document.getElementById("site-header");
  const progress = document.getElementById("scroll-progress");

  function update() {
    const scrollY = window.scrollY;
    header.classList.toggle("is-scrolled", scrollY > ANIM_SETTINGS.headerScrollOffset);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initActiveNav() {
  const aboutLink = document.querySelector('.main-nav a[data-nav="about"]');
  const contentLink = document.querySelector('.main-nav [data-nav="content"]');
  const aboutSection = document.getElementById("about");
  const contentSection = document.getElementById("content");
  if (!aboutLink || !contentLink || !aboutSection || !contentSection) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target === aboutSection) {
          aboutLink.classList.add("active");
          contentLink.classList.remove("active");
        } else {
          contentLink.classList.add("active");
          aboutLink.classList.remove("active");
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  io.observe(aboutSection);
  io.observe(contentSection);
}

/* ---- Content dropdown: highlight whichever of its 5 sections is in view ----
   Runs independently of whether the dropdown is currently open, so the
   right item is already marked active the next time it's opened. */
function initContentDropdownActiveTracking() {
  if (typeof navigationItems === "undefined") return;

  const sections = navigationItems
    .map((item) => document.getElementById(item.target))
    .filter(Boolean);
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll(".content-dropdown-item").forEach((el) => {
          el.classList.toggle("is-active", el.dataset.target === entry.target.id);
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  sections.forEach((s) => io.observe(s));
}

/* ---- Hero entrance sequence: fires once, right after the loader clears ---- */
function playHeroReveal() {
  const hero = document.getElementById("hero");
  if (hero) hero.classList.add("is-revealed");
}

document.addEventListener("DOMContentLoaded", () => {
  initTimelineDraw();
  initCustomCursor();
  initHeaderAndProgress();
  initActiveNav();
  initContentDropdownActiveTracking();
  // initScrollReveal() runs from main.js after content is rendered into the DOM
});
