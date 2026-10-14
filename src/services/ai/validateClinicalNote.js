// Guard rails for the clinical-note-summarizer v2 prompt (CommonJS / ES Module compatible).
// Usage:
//   const pre = preflight(vars);            if (pre.skip) return pre.result;
//   const raw = await callModel(renderTemplate(spec, pre.vars));
//   const final = validateNote(raw, vars.transcript);

const DISCLAIMER = "AI-generated suggestion, requires dentist review";
const VALID_FDI = new Set([
  ...[11,12,13,14,15,16,17,18], ...[21,22,23,24,25,26,27,28],
  ...[31,32,33,34,35,36,37,38], ...[41,42,43,44,45,46,47,48],
  ...[51,52,53,54,55], ...[61,62,63,64,65], ...[71,72,73,74,75], ...[81,82,83,84,85],
]);
const STATUSES = new Set(["HEALTHY","DAMAGED / DECAY","ROOT CANAL NEEDED","CLEANING NEEDED","ALREADY TREATED","MISSING / EXTRACTED"]);
const NARRATIVE = ["summary","chiefComplaint","history","examination","radiographs","assessment","treatmentPerformed","postOpAdvice"];

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

// 1) Before calling the model: fill defaults so the prompt never says "undefined".
export function preflight(vars) {
  const v = {
    ...vars,
    patientName: vars.patientName?.trim() || "Not provided",
    patientId: vars.patientId ?? "Not provided",
    language: vars.language || "en",
  };
  if (!v.transcript || v.transcript.trim().length < 20) {
    return { skip: true, vars: v, result: emptyResult(v, "Transcript too short to document.") };
  }
  return { skip: false, vars: v };
}

export function emptyResult(v, why) {
  const draftNote = Object.fromEntries(NARRATIVE.map((k) => [k, "insufficient data"]));
  return {
    status: "incomplete",
    missingFields: ["Chief Complaint","Objective Exam","Assessment","Treatment Rendered","Follow-up Plan"],
    doctorPrompt: `Dr. ${v.doctorName || 'Doctor'}, ${why} Please dictate the visit again.`,
    flags: ["NO_CLINICAL_CONTENT"],
    teethUpdates: [],
    draftNote: { ...draftNote, followUp: null, prescriptions: [], disclaimer: DISCLAIMER },
  };
}

// 2) After the model answers: parse, verify evidence, drop anything unsupported.
export function validateNote(raw, transcript) {
  let out;
  try {
    out = JSON.parse(String(raw).replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    throw new Error("Model returned invalid JSON");
  }
  const T = norm(transcript);
  const missing = new Set(out.missingFields || []);
  const flags = new Set(out.flags || []);
  const note = out.draftNote || {};

  // Tooth updates: valid FDI, allowed status, evidence must be a real quote.
  out.teethUpdates = (out.teethUpdates || []).filter((t) => {
    const ok = VALID_FDI.has(t.fdiNumber) && STATUSES.has(t.status) && t.evidence && T.includes(norm(t.evidence));
    if (!ok) { missing.add("Tooth Update Unverified"); }
    return ok;
  });

  // Prescriptions: evidence must be a real quote; any number in strength must appear in that evidence.
  note.prescriptions = (note.prescriptions || []).filter((p) => {
    if (!p.evidence || !T.includes(norm(p.evidence))) { missing.add("Prescription Details"); return false; }
    return true;
  }).map((p) => {
    const digits = String(p.strength ?? "").match(/\d+(\.\d+)?/g) || [];
    if (digits.some((d) => !norm(p.evidence).includes(d))) { p.strength = null; missing.add("Prescription Details"); }
    return p;
  });

  // Narrative fields must be strings; followUp null when absent.
  for (const k of NARRATIVE) if (typeof note[k] !== "string" || !note[k].trim()) note[k] = "insufficient data";
  if (note.followUp === "" || note.followUp === undefined) note.followUp = null;
  if (note.followUp === null) missing.add("Follow-up Plan");
  note.disclaimer = DISCLAIMER; // never trust the model for this

  // Status is derived by code, not by the model.
  out.missingFields = [...missing];
  out.flags = [...flags];
  out.status = out.missingFields.length ? "incomplete" : "complete";
  if (out.status === "incomplete" && !out.doctorPrompt) {
    out.doctorPrompt = `Please provide: ${out.missingFields.join(", ")}.`;
  }
  if (out.status === "complete") out.doctorPrompt = null;
  out.draftNote = note;
  return out;
}

// CommonJS support for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { preflight, emptyResult, validateNote };
}
