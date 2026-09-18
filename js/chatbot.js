/* ==========================================================================
   CHATBOT.JS
   --------------------------------------------------------------------------
   Wires up the floating AI assistant: open/close animation, message
   rendering, quick questions, typing indicator, and the AI request path.
   Customize identity/behavior in js/chatbotConfig.js — this file shouldn't
   need edits for normal use.

   BRINGING YOUR OWN CHATBOT? Read this first:
   - To swap out just the AI logic and keep this site's chat window design,
     edit the clearly marked block inside sendMessageToAI() below — search
     for "AI CHATBOT CUSTOMIZATION START".
   - To replace the ENTIRE chat widget with your own embed code (a
     <script> tag, <iframe>, or widget snippet from a chatbot provider),
     set ENABLE_BUILT_IN_CHATBOT to false below, and paste your embed code
     into the "CUSTOM AI CHATBOT GOES HERE" section in index.html instead.
   See README.md → "How to Add My Own AI Chatbot" for full step-by-step
   instructions either way.
   ========================================================================== */

// ==========================================
// CUSTOMIZE: BUILT-IN CHATBOT ON/OFF SWITCH
// --------------------------------------------------------------------------
// true  = show this site's built-in floating chat button + window (default)
// false = hide it completely — use this if you're pasting your own
//         chatbot's embed code into the "CUSTOM AI CHATBOT GOES HERE"
//         section in index.html instead, so you don't end up with two
//         chat buttons on the page.
// ==========================================
const ENABLE_BUILT_IN_CHATBOT = true;

let chatHistory = [];              // session-only memory — cleared on reload
let chatHasStarted = false;
let currentProjectContext = null;  // set when opened from a project modal
let chatIsSending = false;

/* ==========================================================================
   RENDER HELPERS
   ========================================================================== */
function chatScrollToBottom() {
  const box = document.getElementById("chatbot-messages");
  box.scrollTop = box.scrollHeight;
}

function appendChatMessage(role, text, { actionLabel, actionFn } = {}) {
  const box = document.getElementById("chatbot-messages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-${role}`;
  bubble.innerHTML = `<p>${text}</p>`;

  if (actionLabel && actionFn) {
    const btn = document.createElement("button");
    btn.className = "chat-action-btn";
    btn.type = "button";
    btn.innerHTML = `${actionLabel} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    btn.addEventListener("click", actionFn);
    bubble.appendChild(btn);
  }

  box.appendChild(bubble);
  chatScrollToBottom();
}

function showTypingIndicator() {
  const box = document.getElementById("chatbot-messages");
  const typing = document.createElement("div");
  typing.className = "chat-bubble chat-assistant chat-typing";
  typing.id = "chat-typing-indicator";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  box.appendChild(typing);
  chatScrollToBottom();
}

function hideTypingIndicator() {
  const el = document.getElementById("chat-typing-indicator");
  if (el) el.remove();
}

function renderQuickQuestions() {
  const wrap = document.getElementById("chatbot-quick");
  if (!chatbotConfig.showQuickQuestions || chatHasStarted) {
    wrap.innerHTML = "";
    wrap.classList.add("is-hidden");
    return;
  }
  wrap.classList.remove("is-hidden");
  wrap.innerHTML = chatbotConfig.quickQuestions
    .map((q) => `<button type="button" class="chat-quick-btn">${q}</button>`)
    .join("");
  wrap.querySelectorAll(".chat-quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => sendChatMessage(btn.textContent));
  });
}

/* ==========================================================================
   SAFE, PREDEFINED PORTFOLIO ACTIONS
   --------------------------------------------------------------------------
   The AI can only trigger actions from this fixed list — never arbitrary
   generated code.
   ========================================================================== */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  closeChatbot();
  el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
}

/* ==========================================================================
   DEMO MODE AI RESPONDER
   --------------------------------------------------------------------------
   Rule-based answers built directly from portfolioData, so the assistant
   works immediately with no API key and no backend. This is NOT a real AI
   model — it's pattern matching over the portfolio data. Replace
   sendMessageToAI() below with a real backend call once one exists (see
   AI_CONFIG in js/chatbotConfig.js and /server/chat-example.js).
   ========================================================================== */
function generateDemoResponse(rawMessage) {
  const msg = rawMessage.toLowerCase();
  const p = portfolioData;
  const name = p.personal.name;

  // Word-boundary matching avoids false positives like "about your project"
  // matching "about you", or "hi" matching inside "this". A trailing "s?"
  // lets single-word phrases also match their plural (skill/skills).
  const has = (...phrases) =>
    phrases.some((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const suffix = phrase.trim().includes(" ") ? "" : "s?"; // only pluralize single words
      return new RegExp(`\\b${escaped}${suffix}\\b`, "i").test(msg);
    });

  // Currently-viewed project takes priority for vague follow-ups
  if (currentProjectContext && has("this project", "tell me more", "more about it", "more about this")) {
    const proj = currentProjectContext;
    return {
      text: `<strong>${proj.title}</strong> — ${proj.description} My role was <strong>${proj.role}</strong>, built with ${proj.technologies.join(", ")}. Problem: ${proj.problem} Solution: ${proj.solution}`
    };
  }

  // A project mentioned by name, even without the word "project" itself
  // (e.g. "What was your role in Campus Connect?")
  const namedProject = p.projects.find((proj) => msg.includes(proj.title.toLowerCase()));
  if (namedProject) {
    return {
      text: `<strong>${namedProject.title}</strong> — ${namedProject.description} Role: <strong>${namedProject.role}</strong>. Built with ${namedProject.technologies.join(", ")}. Problem: ${namedProject.problem} Solution: ${namedProject.solution}`
    };
  }

  if (has("who are you", "who is this", "about you", "introduce yourself", "tell me about yourself")) {
    return { text: `I'm the AI assistant for ${name}'s portfolio. ${name} is a ${p.personal.roles.join(", ")}. ${p.personal.aboutBody[0]}` };
  }

  if (has("study", "studying", "studied", "education", "school", "university", "college", "degree")) {
    const lines = p.education.map((e) => `${e.degree} at ${e.school} (${e.year})`).join("; ");
    return { text: `${name}'s education: ${lines}.`, actionLabel: "VIEW EDUCATION →", action: () => scrollToSection("education") };
  }

  if (has("skill", "programming language", "programming languages", "tech stack", "technology", "technologies", "design tool", "design tools", "tools do you use")) {
    const lines = p.skills.map((s) => `${s.category}: ${s.tags.join(", ")}`).join(" | ");
    return { text: `Here's a breakdown of ${name}'s skills — ${lines}.`, actionLabel: "VIEW SKILLS →", action: () => scrollToSection("skills") };
  }

  if (has("experience", "internship", "job", "work history", "worked at")) {
    if (p.experience.length === 0) {
      return { text: `${name} doesn't have formal work experience listed yet — but there's plenty of hands-on work in the Projects section.`, actionLabel: "VIEW PROJECTS →", action: () => scrollToSection("projects") };
    }
    const lines = p.experience.map((e) => `${e.role} at ${e.company} (${e.year})`).join("; ");
    return { text: `${name}'s experience: ${lines}.`, actionLabel: "VIEW EXPERIENCE →", action: () => scrollToSection("experience") };
  }

  if (has("ui/ux", "ui ux", "ux work", "design work", "user experience")) {
    const uxProjects = p.projects.filter((proj) => proj.category === "UI/UX" || proj.role.toLowerCase().includes("design"));
    if (uxProjects.length) {
      const lines = uxProjects.map((proj) => `"${proj.title}" (${proj.role})`).join(", ");
      return { text: `${name}'s UI/UX work includes: ${lines}.`, actionLabel: "VIEW PROJECTS →", action: () => scrollToSection("projects") };
    }
    return { text: `${name} works across UI/UX design and development — check the Projects section for specifics.`, actionLabel: "VIEW PROJECTS →", action: () => scrollToSection("projects") };
  }

  if (has("project")) {
    const lines = p.projects.map((proj) => `"${proj.title}" (${proj.category})`).join(", ");
    return { text: `${name} has worked on: ${lines}. Ask me about any of these by name for more detail.`, actionLabel: "VIEW PROJECTS →", action: () => scrollToSection("projects") };
  }

  if (has("art", "artwork", "creative work", "creative works", "illustration", "painting")) {
    const lines = p.artworks.slice(0, 4).map((a) => `"${a.title}" (${a.medium}, ${a.year})`).join(", ");
    return { text: `${name}'s creative work includes ${lines}, and more in the gallery.`, actionLabel: "VIEW ARTWORK →", action: () => scrollToSection("creative-works") };
  }

  if (has("resume", "cv")) {
    return { text: `You can download ${name}'s resume using the "Download CV" button in the hero section or the footer.` };
  }

  if (has("contact", "email", "reach you", "get in touch", "hire")) {
    const socials = p.personal.socials.map((s) => s.label).join(", ");
    return { text: `You can reach ${name} at ${p.personal.email}, or via ${socials} — all linked in the footer.`, actionLabel: "VIEW CONTACT →", action: () => scrollToSection("contact") };
  }

  if (has("hello", "hi", "hey")) {
    return { text: `Hi there! Ask me about ${name}'s background, skills, projects, or artwork — or tap one of the quick questions below.` };
  }

  return {
    text: `That's not something covered in the portfolio data I have access to. Try asking about ${name}'s skills, projects, education, or how to get in touch — or use the contact information in the footer for anything more specific.`
  };
}

/* ==========================================================================
   AI REQUEST — THIS IS THE FUNCTION TO EDIT TO PLUG IN YOUR OWN CHATBOT
   ========================================================================== */
async function sendMessageToAI(message, conversationHistory) {
  // ==========================================
  // AI CHATBOT CUSTOMIZATION START
  // --------------------------------------------------------------------------
  // Everything between here and "AI CHATBOT CUSTOMIZATION END" is the part
  // to replace with your OWN chatbot's logic — this is the ONLY function
  // you need to change to plug in your own AI, as long as you're keeping
  // this site's existing chat window design.
  //
  // Your replacement code must return an object shaped like:
  //   { text: "the reply to show the visitor" }
  // ...optionally adding { actionLabel: "VIEW PROJECTS →", action: () => scrollToSection("projects") }
  // to show a clickable button under the reply (see generateDemoResponse()
  // above for a working example of that shape).
  //
  // - If your chatbot has its own JS SDK (e.g. `MyChatbot.ask(message)`),
  //   call it here and return its reply in that shape.
  // - If it needs an API key, put the key on YOUR OWN backend — never
  //   directly in this frontend file — and fetch() that backend here.
  //   See /server/chat-example.js and README.md → "How to Add My Own AI
  //   Chatbot" for the secure pattern.
  //
  // DEMO MODE (current default): answers come from generateDemoResponse()
  // above, using only the portfolio data — no network call, no API key.
  // Delete or ignore this block once your own logic is in place.
  // ==========================================
  if (AI_CONFIG.provider === "demo") {
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
    return generateDemoResponse(message);
  }

  // Real backend path — used once AI_CONFIG.provider (js/chatbotConfig.js)
  // is changed to "custom-backend" and a backend exists at AI_CONFIG.apiEndpoint.
  try {
    const res = await fetch(AI_CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: conversationHistory,
        context: buildPortfolioContext(),
        systemPrompt: AI_CONFIG.systemPrompt,
        model: AI_CONFIG.model
      })
    });
    if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
    const data = await res.json();
    return { text: data.reply || "I didn't get a usable response — please try again." };
  } catch (err) {
    // Never expose technical details or keys to the visitor
    console.error("Chatbot backend error:", err);
    return {
      text: "I'm having trouble connecting right now. Please try again, or use the contact information in the footer.",
      isError: true
    };
  }
  // ==========================================
  // AI CHATBOT CUSTOMIZATION END
  // ==========================================
}

/* ==========================================================================
   SEND FLOW
   ========================================================================== */
async function sendChatMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || chatIsSending) return;

  chatHasStarted = true;
  renderQuickQuestions();

  appendChatMessage("user", escapeHtml(trimmed));
  chatHistory.push({ role: "user", content: trimmed });

  const input = document.getElementById("chatbot-input");
  input.value = "";
  autoResizeInput(input);

  chatIsSending = true;
  setSendingState(true);
  showTypingIndicator();

  const result = await sendMessageToAI(trimmed, chatHistory);

  hideTypingIndicator();
  chatIsSending = false;
  setSendingState(false);

  appendChatMessage("assistant", result.text, result.action ? { actionLabel: result.actionLabel, actionFn: result.action } : {});
  chatHistory.push({ role: "assistant", content: result.text });
}

function setSendingState(isSending) {
  document.getElementById("chatbot-input").disabled = isSending;
  document.getElementById("chatbot-send").disabled = isSending;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function autoResizeInput(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

/* ==========================================================================
   OPEN / CLOSE
   ========================================================================== */
function openChatbot() {
  document.getElementById("chatbot-root").classList.add("is-open");
  document.getElementById("chatbot-launcher").setAttribute("aria-expanded", "true");
  if (!chatHasStarted) renderQuickQuestions();
  setTimeout(() => document.getElementById("chatbot-input").focus(), 350);
}

function closeChatbot() {
  document.getElementById("chatbot-root").classList.remove("is-open");
  document.getElementById("chatbot-launcher").setAttribute("aria-expanded", "false");
}

function toggleChatbot() {
  const isOpen = document.getElementById("chatbot-root").classList.contains("is-open");
  isOpen ? closeChatbot() : openChatbot();
}

/* Called from a project modal's "Ask AI about this project" button (see main.js) */
function openChatbotWithProjectContext(project) {
  currentProjectContext = project || null;
  openChatbot();
  if (project) sendChatMessage(`Tell me more about "${project.title}".`);
}
window.openChatbotWithProjectContext = openChatbotWithProjectContext;

/* ==========================================================================
   INIT
   ========================================================================== */
function initChatbot() {
  if (typeof chatbotConfig === "undefined" || typeof AI_CONFIG === "undefined") return;

  if (!ENABLE_BUILT_IN_CHATBOT) {
    // Fully remove the built-in widget from the page (and from layout/hit
    // testing) so it can't visually clash with your own chatbot embed.
    const root = document.getElementById("chatbot-root");
    if (root) root.remove();
    return;
  }

  document.getElementById("chatbot-title").textContent = chatbotConfig.windowTitle;
  document.getElementById("chatbot-mode-badge").classList.toggle("is-hidden", AI_CONFIG.provider !== "demo");

  const name = portfolioData.personal.name;
  const welcome = chatbotConfig.welcomeMessage.replace(/\{\{name\}\}/g, name);
  appendChatMessage("assistant", welcome);
  renderQuickQuestions();

  document.getElementById("chatbot-launcher").addEventListener("click", toggleChatbot);

  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendChatMessage(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(input.value);
    }
  });

  input.addEventListener("input", () => autoResizeInput(input));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("chatbot-root").classList.contains("is-open")) {
      closeChatbot();
    }
  });

  // Clicking outside the panel does not close it — chat state is easy to
  // lose by accident otherwise. Only the launcher/close button and Esc do.
}

document.addEventListener("DOMContentLoaded", initChatbot);
