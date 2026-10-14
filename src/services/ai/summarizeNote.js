// summarizeNote.js (Browser & Universal JS compatible)
// Safe for browser bundlers (Vite/Rollup) without Node built-ins (fs, path, url)
import { preflight, validateNote } from './validateClinicalNote.js';

export const DEFAULT_SPEC = {
  id: "clinical-note-summarizer",
  version: "2.0.0",
  modelConfig: {
    temperature: 0,
    maxTokens: 3072,
    timeoutMs: 30000,
    preferredProvider: "gemini",
    fallbackProvider: "groq",
    model: "gemini-3.1-flash-lite"
  },
  variablesSchema: {
    properties: {
      region: { enum: ["PK", "NZ", "UK", "US", "AU"] },
      language: { enum: ["en", "ur", "roman-urdu"] },
      transcript: { maxLength: 20000 }
    }
  },
  template: `You are a dental clinical documentation scribe working alongside a registered dentist.
Doctor: {{doctorName}}
Patient: {{patientName}}
Region: {{region}}
Language: {{language}}

<clinical_transcript>
{{transcript}}
</clinical_transcript>

Generate a structured clinical note adhering strictly to the JSON schema.`
};

let activeSpec = { ...DEFAULT_SPEC };

export function setSpec(newSpec) {
  if (newSpec && typeof newSpec === 'object') {
    activeSpec = { ...DEFAULT_SPEC, ...newSpec };
  }
}

export function getSpec() {
  return activeSpec;
}

const REGIONS = ["PK", "NZ", "UK", "US", "AU"];
const LANGS = ["en", "ur", "roman-urdu"];

export class HttpError extends Error {
  constructor(status, message) { 
    super(message); 
    this.status = status; 
  }
}

// Helper to safely extract env variables across Node.js and browser (Vite import.meta.env)
function getEnv(key) {
  if (typeof process !== 'undefined' && process?.env && process.env[key]) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env) {
      return import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
    }
  } catch {
    // import.meta unavailable in plain script contexts
  }
  return '';
}

// ---- 1. Input validation -------------------------------------------------
export function checkVars(v, spec = activeSpec) {
  if (!v || typeof v !== "object") throw new HttpError(400, "Body required");
  if (!v.doctorName || typeof v.doctorName !== "string") throw new HttpError(400, "doctorName required");
  const allowedRegions = spec.variablesSchema?.properties?.region?.enum || REGIONS;
  if (!allowedRegions.includes(v.region)) throw new HttpError(400, `region must be one of ${allowedRegions.join(", ")}`);
  const allowedLangs = spec.variablesSchema?.properties?.language?.enum || LANGS;
  if (v.language && !allowedLangs.includes(v.language)) throw new HttpError(400, `language must be one of ${allowedLangs.join(", ")}`);
  if (typeof v.transcript !== "string") throw new HttpError(400, "transcript required");
  const maxLen = spec.variablesSchema?.properties?.transcript?.maxLength || 20000;
  if (v.transcript.length > maxLen) throw new HttpError(413, "transcript too long");
}

// ---- 2. Safe template rendering ------------------------------------------
// Single pass: placeholders typed inside the transcript are NOT expanded again.
// The closing tag is neutralised so the transcript cannot escape its delimiter.
export function render(template, vars) {
  const safe = { ...vars };
  safe.transcript = String(vars.transcript || '').replace(/<\/?\s*clinical_transcript\s*>/gi, "[tag removed]");
  for (const k of ["doctorName", "patientName"]) {
    safe[k] = String(safe[k] || '').replace(/[\r\n<>{}]/g, " ").slice(0, 100);
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in safe ? String(safe[key]) : "Not provided"));
}

// ---- 3. Providers ----------------------------------------------------------
async function withTimeout(url, init, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}

async function callGemini(prompt, spec = activeSpec) {
  const { model, temperature, maxTokens, timeoutMs } = spec.modelConfig || {};
  const apiKey = getEnv("GEMINI_API_KEY");
  const r = await withTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3.1-flash-lite'}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: temperature ?? 0, maxOutputTokens: maxTokens || 3072, responseMimeType: "application/json" },
      }),
    },
    timeoutMs || 30000
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

async function callGroq(prompt, spec = activeSpec) {
  const { temperature, maxTokens, timeoutMs } = spec.modelConfig || {};
  const apiKey = getEnv("GROQ_API_KEY");
  const r = await withTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: getEnv("GROQ_MODEL") || "llama-3.3-70b-versatile",
        temperature: temperature ?? 0,
        max_tokens: maxTokens || 3072,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    },
    timeoutMs || 30000
  );
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export const PROVIDERS = { gemini: callGemini, groq: callGroq };

// ---- 4. Main entry ---------------------------------------------------------
export async function summarizeNote(input, { callers = PROVIDERS, spec = activeSpec } = {}) {
  checkVars(input, spec);
  const pre = preflight(input);
  if (pre.skip) return { ...pre.result, provider: "none" };

  const prompt = render(spec.template || DEFAULT_SPEC.template, pre.vars);
  const order = [spec.modelConfig?.preferredProvider, spec.modelConfig?.fallbackProvider].filter(Boolean);

  let lastErr;
  for (const name of order) {
    try {
      const raw = await (callers[name] ? callers[name](prompt, spec) : null);
      if (!raw) throw new Error(`Provider ${name} returned empty output`);
      const result = validateNote(raw, pre.vars.transcript); // throws on invalid JSON
      return { ...result, provider: name };
    } catch (e) {
      lastErr = e; // network error, timeout or bad JSON: try the next provider
    }
  }
  throw new HttpError(502, `All providers failed: ${lastErr?.message}`);
}
