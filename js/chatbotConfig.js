/* ==========================================================================
   AI CHATBOT CONFIGURATION
   --------------------------------------------------------------------------
   This is the ONLY file you should need to edit to customize the AI
   assistant's identity, behavior, and provider settings. js/chatbot.js
   reads everything from this file — you shouldn't need to touch it for
   normal customization.
   ========================================================================== */

// ==========================================
// AI CHATBOT CONFIGURATION
// EDIT THIS SECTION TO CUSTOMIZE THE AI
// ==========================================
const chatbotConfig = {
  // Shown in the chat window header
  windowTitle: "AI PORTFOLIO ASSISTANT",

  // Internal name the assistant uses to refer to itself in messages
  assistantName: "Portfolio Assistant",

  // First message shown when a visitor opens the chat for the first time.
  // {{name}} is automatically replaced with portfolioData.personal.name.
  welcomeMessage:
    "Hello! I'm {{name}}'s AI portfolio assistant. Ask me anything about their background, skills, or projects — or tap a question below to get started.",

  // Free-text description of tone — referenced in the system prompt sent
  // to a real AI backend. Purely descriptive; doesn't change demo-mode logic.
  personality: "Friendly, professional, concise, and helpful",

  // "concise" | "detailed" — also only meaningful once wired to a real AI backend
  responseLength: "concise",

  // Show the quick-question chips on first open
  showQuickQuestions: true,

  // Quick questions — clicking one sends it exactly as written
  quickQuestions: [
    "What do you do?",
    "Tell me about your projects",
    "What are your skills?",
    "What experience do you have?",
    "How can I contact you?"
  ]
};

// ==========================================
// AI SYSTEM PROMPT
// EDIT THIS TO CHANGE HOW THE AI IS INSTRUCTED TO BEHAVE
// --------------------------------------------------------------------------
// This template is combined with a live snapshot of portfolioData (see
// buildPortfolioContext below) every time a message is sent to a real AI
// backend. You do not need to duplicate your information here — it's
// pulled automatically from js/data.js.
// ==========================================
const SYSTEM_PROMPT_TEMPLATE = `
You are the personal AI portfolio assistant for {{name}}.

Your job is to help visitors understand {{name}}'s portfolio: who they are,
what they studied, their skills, experience, projects, and artwork.

Personality: ${chatbotConfig.personality}
Preferred response length: ${chatbotConfig.responseLength}

Rules:
- Answer using ONLY the PORTFOLIO DATA provided below.
- Do not invent qualifications, projects, experience, education, awards,
  or personal information that isn't in the data.
- If the requested information is not available, politely say that it
  isn't included in the portfolio, and suggest contacting {{name}} directly.
- Keep answers clear, friendly, and concise.
- If a visitor asks about a specific project, explain it using that
  project's description, role, technologies, and features.
- If a visitor asks how to contact {{name}}, give the available contact
  information (email / social links) from the data.
- You may suggest visitors look at a relevant section of the portfolio
  (e.g. "you can see more in the Projects section").
`;

// ==========================================
// PORTFOLIO → AI CONTEXT
// --------------------------------------------------------------------------
// Turns the existing portfolioData object (js/data.js) into a plain-text
// briefing the AI can read. You should not need to edit this function —
// update js/data.js instead, and this stays in sync automatically.
// ==========================================
function buildPortfolioContext() {
  if (typeof portfolioData === "undefined") return "";
  const p = portfolioData;

  const lines = [];
  lines.push("=== PORTFOLIO DATA ===");

  lines.push(`\nNAME: ${p.personal.name}`);
  lines.push(`ROLES: ${p.personal.roles.join(", ")}`);
  lines.push(`ABOUT: ${p.personal.aboutBody.join(" ")}`);
  lines.push(`QUICK INFO: ${p.personal.quickInfo.map((f) => `${f.label}: ${f.value}`).join(" | ")}`);
  lines.push(`EMAIL: ${p.personal.email}`);
  lines.push(`SOCIAL LINKS: ${p.personal.socials.map((s) => `${s.label} (${s.url})`).join(", ")}`);
  lines.push(`RESUME FILE: ${p.personal.resume}`);

  lines.push("\nEDUCATION:");
  p.education.forEach((e) => lines.push(`- ${e.year}: ${e.degree}, ${e.school}. ${e.description}`));

  lines.push("\nEXPERIENCE:");
  if (p.experience.length === 0) {
    lines.push("- No formal work experience listed yet.");
  } else {
    p.experience.forEach((e) =>
      lines.push(`- ${e.role} at ${e.company} (${e.year}): ${e.description} Responsibilities: ${e.responsibilities.join("; ")}`)
    );
  }

  lines.push("\nSKILLS:");
  p.skills.forEach((s) => lines.push(`- ${s.category}: ${s.tags.join(", ")}`));

  lines.push("\nPROJECTS:");
  p.projects.forEach((proj) =>
    lines.push(
      `- "${proj.title}" (${proj.category})${proj.featured ? " [Featured]" : ""}: ${proj.description} | Role: ${proj.role} | Technologies: ${proj.technologies.join(", ")} | Problem: ${proj.problem} | Solution: ${proj.solution} | Features: ${proj.features.join("; ")}`
    )
  );

  lines.push("\nARTWORKS:");
  p.artworks.forEach((a) => lines.push(`- "${a.title}" (${a.year}, ${a.medium}, ${a.category}): ${a.description}`));

  return lines.join("\n");
}

function buildSystemPrompt() {
  const name = (typeof portfolioData !== "undefined" && portfolioData.personal.name) || "the portfolio owner";
  const header = SYSTEM_PROMPT_TEMPLATE.replace(/\{\{name\}\}/g, name);
  return `${header}\n\n${buildPortfolioContext()}`;
}

// ==========================================
// AI PROVIDER / API CONFIGURATION
// EDIT THIS SECTION TO CONNECT A REAL AI PROVIDER
// --------------------------------------------------------------------------
// These are PLACEHOLDERS. The chatbot currently runs in DEMO MODE — see
// js/chatbot.js's sendMessageToAI() — using simple rule-based answers
// built from buildPortfolioContext() above, so it works out of the box
// with no API key and no backend.
//
// To connect a real AI provider (OpenAI, Anthropic, etc.):
//   1. Build a small backend / serverless function (see /server) that
//      accepts { message, history, context } and calls the AI provider
//      using a server-side API key.
//   2. Set provider to "custom-backend" below.
//   3. Point apiEndpoint at YOUR backend route (never the AI provider's
//      URL directly, and never with a key attached).
//
// SECURITY: never put a real API key in this file, in index.html, or
// anywhere else in frontend code — it would be visible to every visitor.
// See /server/chat-example.js and /.env.example for the secure pattern.
// ==========================================
const AI_CONFIG = {
  provider: "demo",              // "demo" | "custom-backend"
  apiEndpoint: "/api/chat",      // YOUR backend route once provider = "custom-backend"
  model: "YOUR_MODEL_NAME",      // e.g. "claude-sonnet-4-5" — configured server-side, shown here for reference only
  get systemPrompt() {
    return buildSystemPrompt();
  }
};
