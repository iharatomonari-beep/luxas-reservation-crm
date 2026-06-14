#!/usr/bin/env node
/**
 * ChatGPT consultation script.
 * Usage: node scripts/ask-chatgpt.mjs "Your question here"
 *        node scripts/ask-chatgpt.mjs --file path/to/prompt.md
 *
 * Requires OPENAI_API_KEY in .env.local or as an environment variable.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Load .env.local if present
function loadEnvLocal() {
  const envPath = resolve(rootDir, ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set. Add it to .env.local:\n  OPENAI_API_KEY=sk-...");
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
let prompt = "";

if (args[0] === "--file" && args[1]) {
  const filePath = resolve(process.cwd(), args[1]);
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  prompt = readFileSync(filePath, "utf-8");
} else {
  prompt = args.join(" ");
}

if (!prompt.trim()) {
  console.error('Usage: node scripts/ask-chatgpt.mjs "Your question"');
  console.error('       node scripts/ask-chatgpt.mjs --file path/to/prompt.md');
  process.exit(1);
}

// System prompt: context about this project
const systemPrompt = `You are a senior software engineer reviewing and advising on the LUXAS reservation and customer management system.

Context:
- Stack: Next.js 15, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Vercel
- Purpose: Internal prototype for a single massage/beauty salon. Staff manage reservations, customer records, staff shifts, and booth assignments.
- Current state: localStorage-based prototype with full UI. Supabase Auth integration is next.
- Scope constraints: No online booking, LINE, payments, or multi-store in v0.1.

Please respond in Japanese unless the question is in English. Be concise and practical.`;

console.error(`[ask-chatgpt] Sending to GPT-4o...`);

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  }),
});

if (!response.ok) {
  const error = await response.text();
  console.error(`OpenAI API error (${response.status}): ${error}`);
  process.exit(1);
}

const data = await response.json();
const reply = data.choices?.[0]?.message?.content ?? "(No response)";

console.log("\n" + "─".repeat(60));
console.log("ChatGPT の回答:");
console.log("─".repeat(60));
console.log(reply);
console.log("─".repeat(60) + "\n");
