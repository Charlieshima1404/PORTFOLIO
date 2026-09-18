/* ==========================================================================
   MAIN.JS
   --------------------------------------------------------------------------
   1. Small inline icon set (no external icon files needed)
   2. Render functions — build each section's DOM from portfolioData
   3. Interaction wiring — nav, modals, filters, loader, back-to-top
   ========================================================================== */

/* ==========================================================================
   1. ICONS
   ========================================================================== */
const ICONS = {
  github: '<img src="assets/icons/GitHub_Invertocat_White_Clearspace.svg" alt="GitHub" class="icon-btn svg ">',
  mail: '<img src="assets/icons/google-gmail-svgrepo-com.svg" alt="GitHub" class="icon-btn svg ">',
  arrowUpRight: '<svg class="arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>'
};

/* ==========================================================================
   2. RENDER FUNCTIONS
   ========================================================================== */

function renderHero() {
  const p = portfolioData.personal;

  document.getElementById("hero-kicker-text").textContent = p.kicker;

  const nameEl = document.getElementById("hero-name");
  nameEl.setAttribute("aria-label", p.name);
  nameEl.innerHTML = p.name
    .split(" ")
    .map((word) => `<span class="line"><span>${word}</span></span>`)
    .join("");

  const rolesEl = document.getElementById("hero-roles");
  rolesEl.innerHTML = p.roles.map((r) => `<span>${r}</span>`).join("");

  document.getElementById("hero-desc").textContent = p.heroDescription;

  const heroBg = document.getElementById("hero-bg");
  heroBg.style.backgroundImage = `url('${p.heroBackground}')`;

  document.getElementById("hero-download-cv").setAttribute("href", p.resume);
}

function renderAbout() {
  const p = portfolioData.personal;
  document.getElementById("about-photo-img").src = p.profileImage;
  document.getElementById("about-photo-img").alt = `Portrait of ${p.name}`;
  document.getElementById("about-lead").textContent = p.aboutLead;

  document.getElementById("about-body").innerHTML = p.aboutBody
    .map((para) => `<p>${para}</p>`)
    .join("");

  document.getElementById("about-facts").innerHTML = p.quickInfo
    .map((f) => `
      <div>
        <div class="fact-label">${f.label}</div>
        <div class="fact-value">${f.value}</div>
      </div>`)
    .join("");
}

/* ===== NEW: EDUCATION SECTION BACKGROUND ===== */
function renderTimeline() {

  /* ===== NEW: Load Education background from data.js ===== */
  const educationSection = document.getElementById("education");

  if (educationSection && portfolioData.educationBackground) {
    educationSection.style.backgroundImage =
      `url('${portfolioData.educationBackground}')`;
  }

  /* ===== EXISTING EDUCATION CODE ===== */
  const wrap = document.getElementById("timeline");

  const itemsHTML = portfolioData.education
    .map((edu) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-year">${edu.year}</div>
        <div>
          <h3 class="timeline-degree">${edu.degree}</h3>
          <div class="timeline-school">${edu.school}</div>
          <p class="timeline-desc">${edu.description}</p>
        </div>
      </div>`)
    .join("");

  wrap.insertAdjacentHTML("beforeend", itemsHTML);
}

function renderExperience() {
  const list = document.getElementById("experience-list");
  const exp = portfolioData.experience;

  if (!exp || exp.length === 0) {
    list.innerHTML = `<div class="experience-empty">No formal experience listed yet — check back soon, or see the Projects section below for hands-on work.</div>`;
    return;
  }

  list.innerHTML = exp
    .map((job) => `
      <div class="experience-card">
        <div class="exp-meta">
          <div class="exp-year">${job.year}</div>
          <div class="exp-company">${job.company}</div>
        </div>
        <div>
          <h3 class="exp-role">${job.role}</h3>
          <p class="exp-desc">${job.description}</p>
          <ul class="exp-list">
            ${job.responsibilities.map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>
      </div>`)
    .join("");
}

/* ===== NEW: SKILLS SECTION BACKGROUND ===== */
function renderSkills() {
  const grid = document.getElementById("skills-grid");
  const skillsSection = document.getElementById("skills");

  /* ===== NEW: Load Skills background from data.js ===== */
  if (skillsSection && portfolioData.skillsBackground) {
    skillsSection.style.backgroundImage =
      `url('${portfolioData.skillsBackground}')`;
  }

  /* ===== EXISTING SKILLS CONTENT ===== */
  grid.innerHTML = portfolioData.skills
    .map((group) => `
      <div class="skill-group">
        <div class="skill-group-title">${group.category}</div>
        <div class="skill-tags">
          ${group.tags.map((t) => `<span class="skill-tag">${t}</span>`).join("")}
        </div>
      </div>`)
    .join("");
}

/* ---- Projects ---- */
function projectCardHTML(project, index) {
  return `
    <div class="project-card reveal" data-category="${project.category}" data-project-index="${index}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View details for ${project.title}">
      <div class="thumb-wrap"><img src="${project.thumbnail}" alt="${project.title} thumbnail" loading="lazy"></div>
      <div class="project-card-body">
        <div class="featured-tag">${project.category}</div>
        <h4>${project.title}</h4>
        <p>${project.description}</p>
        <span class="view-link">View project ${ICONS.arrowUpRight}</span>
      </div>
    </div>`;
}

function featuredHTML(project, index) {
  return `
    <div class="project-featured reveal" data-category="${project.category}" data-project-index="${index}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View details for ${project.title}">
      <div class="thumb-wrap"><img src="${project.thumbnail}" alt="${project.title} thumbnail" loading="lazy"></div>
      <div>
        <div class="featured-tag">Featured — ${project.category}</div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="tech-row">${project.technologies.map((t) => `<span class="tech-pill">${t}</span>`).join("")}</div>
        <span class="view-link">View project ${ICONS.arrowUpRight}</span>
      </div>
    </div>`;
}

let activeProjectFilter = "All";

function renderProjects() {
  const projects = portfolioData.projects;
  const featuredIndex = projects.findIndex((p) => p.featured);
  const featured = featuredIndex >= 0 ? projects[featuredIndex] : null;

  // Filter bar
  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  document.getElementById("filter-bar").innerHTML = categories
    .map((c) => `<button class="filter-btn${c === "All" ? " active" : ""}" data-filter="${c}">${c}</button>`)
    .join("");

  // Featured slot
  document.getElementById("project-featured-slot").innerHTML = featured ? featuredHTML(featured, featuredIndex) : "";

  // Grid (everything except the featured one)
  const gridProjects = projects.filter((_, i) => i !== featuredIndex);
  document.getElementById("projects-grid").innerHTML = gridProjects
    .map((p) => projectCardHTML(p, projects.indexOf(p)))
    .join("");

  // Click handlers: featured + cards
  document.querySelectorAll("[data-project-index]").forEach((el) => {
    el.addEventListener("click", () => openProjectModal(parseInt(el.dataset.projectIndex, 10)));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProjectModal(parseInt(el.dataset.projectIndex, 10));
      }
    });
  });

  // Filter bar handlers
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeProjectFilter = btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      applyProjectFilter();
    });
  });
}

function applyProjectFilter() {
  const cards = document.querySelectorAll(".project-card, .project-featured");
  cards.forEach((card) => {
    const match = activeProjectFilter === "All" || card.dataset.category === activeProjectFilter;
    card.classList.toggle("is-hidden", !match);
  });
}

/* ---- Project modal ---- */
let currentProject = null;
let currentProjectImageIndex = 0;
let lastFocusedElement = null;

function openProjectModal(index) {
  currentProject = portfolioData.projects[index];
  currentProjectImageIndex = 0;
  const p = currentProject;

  document.getElementById("pm-tag").textContent = `${p.category} • Project`;
  document.getElementById("project-modal-title").textContent = p.title;
  document.getElementById("pm-date").textContent = p.date || "";
  document.getElementById("pm-description").textContent = p.description;
  document.getElementById("pm-role").textContent = p.role;
  document.getElementById("pm-problem").textContent = p.problem;
  document.getElementById("pm-solution").textContent = p.solution;
  document.getElementById("pm-process").textContent = p.process;
  document.getElementById("pm-features").innerHTML = p.features.map((f) => `<li>${f}</li>`).join("");
  document.getElementById("pm-tech").innerHTML = p.technologies.map((t) => `<span class="tech-pill">${t}</span>`).join("");

  const links = [];
  if (p.github) links.push(`<a href="${p.github}" target="_blank" rel="noopener" class="btn">${ICONS.github} GitHub</a>`);
  if (p.demo) links.push(`<a href="${p.demo}" target="_blank" rel="noopener" class="btn btn-solid">Live Demo ${ICONS.arrowUpRight}</a>`);
  if (p.PDF) links.push(`<a href="${p.PDF}" target="_blank" rel="noopener" class="btn btn-solid">PDF ${ICONS.arrowUpRight}</a>`);
  document.getElementById("pm-links").innerHTML = links.join("");

  renderProjectImage();
  renderProjectDots();

  openModal("project-modal");
}

function renderProjectImage() {
  const img = document.getElementById("pm-image");
  img.src = currentProject.images[currentProjectImageIndex];
  img.alt = `${currentProject.title} screenshot ${currentProjectImageIndex + 1}`;
}

function renderProjectDots() {
  const dotsWrap = document.getElementById("pm-dots");
  if (currentProject.images.length <= 1) { dotsWrap.innerHTML = ""; return; }
  dotsWrap.innerHTML = currentProject.images
    .map((_, i) => `<button data-dot-index="${i}" class="${i === currentProjectImageIndex ? "active" : ""}" aria-label="Show image ${i + 1}"></button>`)
    .join("");
  dotsWrap.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentProjectImageIndex = parseInt(btn.dataset.dotIndex, 10);
      renderProjectImage();
      renderProjectDots();
    });
  });
}

function projectImageStep(dir) {
  const n = currentProject.images.length;
  currentProjectImageIndex = (currentProjectImageIndex + dir + n) % n;
  renderProjectImage();
  renderProjectDots();
}

/* ---- Art gallery ---- */
const FEATURED_ARTWORK_INDEX = 2;

/* ===== NEW: FEATURED ARTWORK + EXISTING ART GALLERY ===== */
function renderArt() {
  const artworks = portfolioData.artworks;
  const gallery = document.getElementById("art-gallery");
  const featuredSlot = document.getElementById("art-featured-slot");

  /* ===== NEW: Render selected artwork into the featured slot ===== */
  const featured = artworks[FEATURED_ARTWORK_INDEX];

  if (featured && featuredSlot) {
    const featuredMeta = [featured.year, featured.category]
      .filter(Boolean)
      .join(" — ");

    featuredSlot.innerHTML = `
      <!-- ===== NEW: FEATURED ARTWORK ===== -->
      <article
        class="art-featured reveal"
        data-art-index="${FEATURED_ARTWORK_INDEX}"
        tabindex="0"
        role="button"
        aria-haspopup="dialog"
        aria-label="View featured artwork: ${featured.title}"
      >
        <div class="art-featured-media">
          <img
            src="${featured.image}"
            alt="${featured.title}"
            loading="eager"
          >
        </div>

        <div class="art-featured-content">
          <div class="featured-tag">FEATURED ARTWORK</div>

          <h3>${featured.title}</h3>

          <p>${featured.description}</p>

          ${featuredMeta ? `
            <div class="art-featured-meta">${featuredMeta}</div>
          ` : ""}

          <span class="btn btn-solid art-featured-button">
            View work
            ${ICONS.arrowUpRight}
          </span>
        </div>
      </article>
      <!-- ===== END NEW: FEATURED ARTWORK ===== -->
    `;

    /* ===== NEW: Connect Featured Artwork to existing artwork modal ===== */
    const featuredEl = featuredSlot.querySelector("[data-art-index]");

    if (featuredEl) {
      featuredEl.addEventListener("click", () => {
        openArtModal(FEATURED_ARTWORK_INDEX);
      });

      featuredEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openArtModal(FEATURED_ARTWORK_INDEX);
        }
      });
    }
  } else if (featuredSlot) {
    featuredSlot.innerHTML = "";
  }

  /* ===== EXISTING ARTWORK GALLERY — intentionally unchanged ===== */
  gallery.innerHTML = artworks
    .map((art, i) => `
      <div class="art-item reveal" data-art-index="${i}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View artwork: ${art.title}">
        <img src="${art.image}" alt="${art.title}" loading="lazy">
        <div class="art-overlay">
          <div>
            <div class="art-overlay-title">${art.title}</div>
            <div class="art-overlay-sub">${art.year} — ${art.medium}</div>
          </div>
        </div>
      </div>`)
    .join("");

  gallery.querySelectorAll("[data-art-index]").forEach((el) => {
    el.addEventListener("click", () => openArtModal(parseInt(el.dataset.artIndex, 10)));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openArtModal(parseInt(el.dataset.artIndex, 10));
      }
    });
  });
}
/* ===== END NEW: FEATURED ARTWORK + EXISTING ART GALLERY ===== */

let currentArtIndex = 0;

function openArtModal(index) {
  currentArtIndex = index;
  renderArtModal();
  openModal("art-modal");
}

function renderArtModal() {
  const art = portfolioData.artworks[currentArtIndex];
  document.getElementById("am-tag").textContent = art.category || "Artwork";
  document.getElementById("art-modal-title").textContent = art.title;
  document.getElementById("am-image").src = art.image;
  document.getElementById("am-image").alt = art.title;
  document.getElementById("am-description").textContent = art.description;
  document.getElementById("am-year").textContent = art.year;
  document.getElementById("am-medium").textContent = art.medium;
  document.getElementById("am-category").textContent = art.category || "—";
}

function artStep(dir) {
  const n = portfolioData.artworks.length;
  currentArtIndex = (currentArtIndex + dir + n) % n;
  renderArtModal();
}

/* ---- Footer ---- */
function renderFooter() {
  const p = portfolioData.personal;
  const socialIcons = { github: ICONS.github, linkedin: ICONS.linkedin, dribbble: ICONS.dribbble };

  const links = [
    `<a class="footer-link" href="mailto:${p.email}">${ICONS.mail} ${p.email}</a>`,
    ...p.socials.map((s) => `<a class="footer-link" href="${s.url}" target="_blank" rel="noopener">${socialIcons[s.icon] || ""} ${s.label}</a>`)
  ];
  document.getElementById("footer-links").innerHTML = links.join("");
  document.getElementById("footer-copy").textContent = `© ${new Date().getFullYear()} ${p.name}. Built with care.`;
}

/* ==========================================================================
   3. MODAL HELPERS (shared by project + art modals)
   ========================================================================== */
function openModal(id) {
  lastFocusedElement = document.activeElement;
  const modal = document.getElementById(id);
  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
  const closeBtn = modal.querySelector("[data-close-modal]");
  if (closeBtn) closeBtn.focus();
}

function closeModal(modal) {
  modal.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  if (lastFocusedElement) lastFocusedElement.focus();
}

function closeAnyOpenModal() {
  document.querySelectorAll(".modal-overlay.is-open").forEach(closeModal);
}

function initModals() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal-overlay")));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAnyOpenModal();

    const projectOpen = document.getElementById("project-modal").classList.contains("is-open");
    const artOpen = document.getElementById("art-modal").classList.contains("is-open");

    if (projectOpen && e.key === "ArrowRight") projectImageStep(1);
    if (projectOpen && e.key === "ArrowLeft") projectImageStep(-1);
    if (artOpen && e.key === "ArrowRight") artStep(1);
    if (artOpen && e.key === "ArrowLeft") artStep(-1);
  });

  document.querySelector("[data-pm-prev]").addEventListener("click", () => projectImageStep(-1));
  document.querySelector("[data-pm-next]").addEventListener("click", () => projectImageStep(1));
  document.querySelector("[data-am-prev]").addEventListener("click", () => artStep(-1));
  document.querySelector("[data-am-next]").addEventListener("click", () => artStep(1));

  const askAiBtn = document.getElementById("pm-ask-ai");
  if (askAiBtn) {
    askAiBtn.addEventListener("click", () => {
      if (!currentProject) return;
      closeModal(document.getElementById("project-modal"));
      if (window.openChatbotWithProjectContext) window.openChatbotWithProjectContext(currentProject);
    });
  }
}

/* ==========================================================================
   4. NAV, LOADER, BACK-TO-TOP
   ========================================================================== */
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen);
  });
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initBackToTop() {
  document.getElementById("back-to-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

function initLoader() {
  const loader = document.getElementById("loader");
  const finish = () => {
    loader.classList.add("hidden");
    playHeroReveal();
  };
  // Small minimum display time so the loader reads as intentional, not a flicker
  window.addEventListener("load", () => setTimeout(finish, 500));
  // Fallback in case 'load' fires very late (slow asset loading)
  setTimeout(finish, 2500);
}

/* ==========================================================================
   4b. HEADER CONTENT DROPDOWN
   ========================================================================== */
function renderContentDropdown() {
  const list = document.getElementById("content-dropdown-list");
  if (!list || typeof navigationItems === "undefined") return;

  list.innerHTML = navigationItems
    .map((item) => `
      <a href="#${item.target}" class="content-dropdown-item" data-target="${item.target}" role="menuitem">
        <span class="item-number">${item.number}</span>
        <span class="item-label">${item.label}</span>
        <svg class="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>`)
    .join("");
}

function initContentDropdown() {
  const wrap = document.getElementById("content-nav-wrap");
  const toggleBtn = document.getElementById("content-toggle");
  const dropdown = document.getElementById("content-dropdown");
  if (!wrap || !toggleBtn || !dropdown) return;

  function openDropdown() {
    dropdown.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
  }
  function closeDropdown() {
    dropdown.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }
  function isOpen() { return dropdown.classList.contains("is-open"); }

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen() ? closeDropdown() : openDropdown();
  });

  dropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".content-dropdown-item");
    if (!item) return;
    closeDropdown();
    // Close the mobile nav panel too, if open
    document.getElementById("main-nav").classList.remove("is-open");
    document.getElementById("nav-toggle").setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (e) => {
    if (isOpen() && !wrap.contains(e.target)) closeDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeDropdown();
  });

  // Expose closeDropdown so it can be called if needed elsewhere
  wrap._closeDropdown = closeDropdown;
}

/* ==========================================================================
   5. INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderHero();
  renderAbout();
  renderTimeline();
  renderExperience();
  renderSkills();
  renderProjects();
  renderArt();
  renderFooter();
  renderContentDropdown();

  initModals();
  initMobileNav();
  initContentDropdown();
  initBackToTop();
  initLoader();

  refreshScrollReveal();
});
