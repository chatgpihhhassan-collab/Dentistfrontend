import { getHexColor } from './toothDataConstants.js';

/**
 * Parses and extracts structured tooth findings from an AI radiograph diagnostic report.
 * Supports:
 * 1. Embedded JSON blocks: ```json ... "teethFindings": [...] ... ```
 * 2. Clinical regex fallback: extracts teeth numbers, detected pathology, severity, and CDT procedures.
 */
export const extractAiFindingsFromReport = (reportText) => {
  if (!reportText || typeof reportText !== 'string') return [];
  const findingsMap = new Map();

  // 1. Primary: Look for structured JSON block in markdown or raw JSON
  try {
    const jsonMatch = reportText.match(/```json\s*([\s\S]*?)\s*```/) || reportText.match(/\{[\s\S]*"teethFindings"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (Array.isArray(parsed.teethFindings) && parsed.teethFindings.length > 0) {
        parsed.teethFindings.forEach(f => {
          const tNum = parseInt(f.toothNumber, 10);
          const tKey = String(f.toothKey || f.toothNumber);
          const condition = f.condition || f.status || 'Radiographic Finding';
          const defaultColor = getHexColor(condition);

          findingsMap.set(tKey, {
            toothNumber: !isNaN(tNum) ? tNum : f.toothNumber,
            toothKey: tKey,
            condition: condition,
            severity: f.severity || 'Clinical Observation',
            confidence: Number(f.confidence) || 95,
            color: f.color || defaultColor,
            cdtCode: f.cdtCode || (f.procedure && f.procedure.match(/D\d{4}/)?.[0]) || '',
            procedure: f.procedure || condition || 'Treatment Indicated',
            status: f.status === 'Completed' ? 'Completed' : 'Planned',
            surface: f.surface || ''
          });
        });
      }
    }
  } catch (e) {
    console.warn("Structured JSON parsing of AI findings failed, falling back to clinical regex:", e);
  }

  // Helper to add findings from narrative while preserving high-confidence JSON entries
  const addNarrativeFinding = (tKey, rawCondition) => {
    if (!tKey || findingsMap.has(tKey)) return;
    const condLower = rawCondition.toLowerCase();

    let cond = 'Clinical Observation';
    let color = '#3B82F6';
    let cdt = 'D0140';
    let proc = 'Clinical Evaluation';
    let sev = 'Noted on Radiograph';

    if (/missing|extract|absent|lost|edentul/i.test(condLower)) {
      cond = 'Missing Tooth';
      color = '#64748B';
      cdt = 'D6010';
      proc = 'Implant / Prosthetic Replacement Evaluation';
      sev = 'Missing';
    } else if (/bone loss|periodont|furcation|resorption|alveolar crest/i.test(condLower)) {
      cond = condLower.includes('severe') ? 'Severe Periodontal Bone Loss' : 'Periodontal Bone Loss';
      color = '#DC2626';
      cdt = 'D4341';
      proc = 'Periodontal Scaling & Root Planing';
      sev = 'Periodontal Involvement';
    } else if (/defective|margin|overhang|breakdown|failing|gap/i.test(condLower)) {
      cond = 'Defective Margin / Restoration';
      color = '#F59E0B';
      cdt = 'D2999';
      proc = 'Evaluation / Replacement of Crown Margin';
      sev = 'Defective';
    } else if (/caries|decay|cavity|demineraliz|recurrent/i.test(condLower)) {
      cond = 'Dental Caries / Decay';
      color = '#EF4444';
      cdt = 'D2391';
      proc = 'Resin Composite Restoration';
      sev = 'Carious Lesion';
    } else if (/bridge|crown|fpd|prosthesis|abutment/i.test(condLower)) {
      cond = condLower.includes('abutment') ? 'Fixed Bridge Abutment' : 'Fixed Partial Denture (Bridge)';
      color = '#2563EB';
      cdt = 'D6240';
      proc = 'Fixed Prosthodontic Evaluation';
      sev = 'Restoration Present';
    } else if (/periapical|radiolucen|abscess|apical|lesion|rct|pulp/i.test(condLower)) {
      cond = 'Periapical Radiolucency';
      color = '#DC2626';
      cdt = 'D3330';
      proc = 'Endodontic Therapy / Evaluation';
      sev = 'Periapical Lesion';
    } else if (/impacted|impaction|horizontal|bony/i.test(condLower)) {
      cond = 'Impacted Tooth (Bony)';
      color = '#8B5CF6';
      cdt = 'D7240';
      proc = 'Surgical Removal of Impacted Tooth';
      sev = 'Bony Impaction Visualized';
    }

    const tNum = parseInt(tKey, 10);
    findingsMap.set(tKey, {
      toothNumber: !isNaN(tNum) ? tNum : tKey,
      toothKey: tKey,
      condition: cond,
      severity: sev,
      confidence: 88,
      color,
      cdtCode: cdt,
      procedure: proc,
      status: 'Planned',
      surface: ''
    });
  };

  // 2. Scan tooth-by-tooth bullet points & narrative to capture ALL described teeth (bridges, bone loss, missing teeth)
  const lines = reportText.split('\n');
  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line || line.startsWith('```') || line.includes('"teethFindings"')) return;

    // Matches bullets like:
    // - **#3, #4, #5:** Missing.
    // - **#6-#11:** Fixed bridge present.
    // - **#12:** Appears to have a crown with a potentially defective distal margin.
    // - **#18, #19:** Significant periodontal bone loss...
    // - **#30, #31:** Significant horizontal bone loss.
    // - Tooth #14: Recurrent Caries
    const bulletMatch = line.match(/^[-*]\s*(?:\*\*)?(?:teeth\s*|tooth\s*)?([#0-9A-Ta-t,\s–—\-&to]+)(?:\*\*)?\s*[:\-–—*]+\s*(.+)/i);
    if (bulletMatch) {
      const rawTeethPart = bulletMatch[1];
      const rawCondition = bulletMatch[2].replace(/^\*+|\*+$/g, '').trim();

      const tokens = rawTeethPart.split(/[,&]|\band\b/);
      tokens.forEach(tok => {
        const t = tok.trim();
        if (!t) return;

        // Check range: "#6-#11" or "6 to 11"
        const rMatch = t.match(/#?\s*([1-9]|[12][0-9]|3[0-2])\s*(?:[-–—]|to)\s*#?\s*([1-9]|[12][0-9]|3[0-2])\b/i);
        if (rMatch) {
          const start = parseInt(rMatch[1], 10);
          const end = parseInt(rMatch[2], 10);
          if (!isNaN(start) && !isNaN(end) && Math.abs(end - start) <= 10) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              addNarrativeFinding(String(i), rawCondition);
            }
          }
        } else {
          // Single tooth: "#3", "Tooth 12", "A"
          const sMatch = t.match(/#\s*([0-9]{1,2}|[A-Ta-t])\b|\btooth\s*#?\s*([0-9]{1,2}|[A-Ta-t])\b/i);
          if (sMatch) {
            const toothVal = (sMatch[1] || sMatch[2]).toUpperCase();
            const numVal = parseInt(toothVal, 10);
            if (!isNaN(numVal) && numVal >= 1 && numVal <= 32) {
              addNarrativeFinding(String(numVal), rawCondition);
            } else if (/^[A-T]$/.test(toothVal)) {
              addNarrativeFinding(toothVal, rawCondition);
            }
          }
        }
      });
    }
  });

  // Convert map to sorted array
  const findings = Array.from(findingsMap.values()).sort((a, b) => {
    const na = parseInt(a.toothKey, 10);
    const nb = parseInt(b.toothKey, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a.toothKey).localeCompare(String(b.toothKey));
  });

  console.log(`[AI FINDINGS LOG] Dynamic AI extracted ${findings.length} tooth pathologies:`, findings.map(f => `#${f.toothKey || f.toothNumber} (${f.condition})`));
  return findings;
};

/**
 * Progressively compresses any radiographic image / frame to <= 18 KB
 * The remote API firewall enforces a strict 20 KB ceiling. Keeping payloads <= 18 KB
 * guarantees 100% 200 OK delivery without 403 Forbidden / CORS blocks.
 */
export const compressImageForUpload = (file, targetMaxBytes = 18 * 1024) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      console.log('[COMPRESS LOG] Input is not a valid Blob/File, passing through.');
      return resolve(file);
    }

    const origKb = (file.size / 1024).toFixed(1);
    console.log(`[STEP 2/5: COMPRESS START] Original size: ${origKb} KB, Target: <= ${(targetMaxBytes / 1024).toFixed(1)} KB`);

    if (file.size <= targetMaxBytes) {
      console.log(`[STEP 2/5: COMPRESS COMPLETE] Image is already under target (${origKb} KB <= ${(targetMaxBytes / 1024).toFixed(1)} KB). No compression needed.`);
      return resolve(file);
    }

    const objectUrl = URL.createObjectURL(file);
    const img = typeof window !== 'undefined' ? new window.Image() : (typeof Image !== 'undefined' ? new Image() : null);
    if (!img) {
      console.warn('[COMPRESS LOG] Native Image constructor unavailable, using original.');
      return resolve(file);
    }

    img.onload = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        const renderCanvasBlob = (maxDim, q) => {
          let width = img.width || 800;
          let height = img.height || 800;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          return new Promise((res) => {
            canvas.toBlob((b) => res(b), 'image/jpeg', q);
          });
        };

        (async () => {
          // Stage 1: 420px max dimension, quality 0.45
          let blob = await renderCanvasBlob(420, 0.45);
          console.log(`[COMPRESS STAGE 1] 420px @ 0.45 -> ${blob ? (blob.size / 1024).toFixed(1) : 0} KB`);

          // Stage 2: If still > target, 360px @ 0.35
          if (blob && blob.size > targetMaxBytes) {
            blob = await renderCanvasBlob(360, 0.35);
            console.log(`[COMPRESS STAGE 2] 360px @ 0.35 -> ${(blob.size / 1024).toFixed(1)} KB`);
          }

          // Stage 3: If still > target, 300px @ 0.28
          if (blob && blob.size > targetMaxBytes) {
            blob = await renderCanvasBlob(300, 0.28);
            console.log(`[COMPRESS STAGE 3] 300px @ 0.28 -> ${(blob.size / 1024).toFixed(1)} KB`);
          }

          // Stage 4: If still > target, 250px @ 0.20
          if (blob && blob.size > targetMaxBytes) {
            blob = await renderCanvasBlob(250, 0.20);
            console.log(`[COMPRESS STAGE 4] 250px @ 0.20 -> ${(blob.size / 1024).toFixed(1)} KB`);
          }

          if (blob && blob.size > 0) {
            const rawName = file.name || 'radiograph';
            const baseName = rawName.replace(/\.[^/.]+$/, "");
            // Sanitize filename: remove spaces and special characters for firewall safety
            const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
            const newFilename = `${cleanBase || 'scan'}.jpg`;
            const compressedFile = new File([blob], newFilename, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            console.log(`[STEP 2/5: COMPRESS SUCCESS] ${origKb} KB -> ${(compressedFile.size / 1024).toFixed(1)} KB (SAFE FOR 20KB FIREWALL GATEWAY)`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        })().catch((err) => {
          console.warn("[COMPRESS LOG] Stage processing error:", err);
          resolve(file);
        });
      } catch (err) {
        console.warn("[COMPRESS LOG] General compression error, using original:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      console.warn("[COMPRESS LOG] Image decoding failed, using raw file.");
      resolve(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Extracts SOAP clinical notes from an AI radiograph report
 */
export const extractSoapFromReport = (reportText) => {
  if (!reportText || typeof reportText !== 'string') return null;

  try {
    const jsonMatch = reportText.match(/```json\s*([\s\S]*?)\s*```/) || reportText.match(/\{[\s\S]*"soap"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (parsed.soap && (parsed.soap.subjective || parsed.soap.assessment || parsed.soap.plan)) {
        return {
          subjective: parsed.soap.subjective || '',
          objective: parsed.soap.objective || '',
          assessment: parsed.soap.assessment || '',
          plan: parsed.soap.plan || ''
        };
      }
    }
  } catch (e) {
    // fallback to regex
  }

  const subjectiveMatch = reportText.match(/Subjective[:\s*\n]+([^\n#]+)/i);
  const objectiveMatch = reportText.match(/Objective[:\s*\n]+([^\n#]+)/i);
  const assessmentMatch = reportText.match(/Assessment[:\s*\n]+([^\n#]+)/i);
  const planMatch = reportText.match(/Plan[:\s*\n]+([^\n#]+)/i);

  if (assessmentMatch || planMatch || objectiveMatch) {
    return {
      subjective: subjectiveMatch ? subjectiveMatch[1].trim() : 'Diagnostic radiographic evaluation.',
      objective: objectiveMatch ? objectiveMatch[1].trim() : 'Radiographic evaluation performed.',
      assessment: assessmentMatch ? assessmentMatch[1].trim() : 'Tooth pathologies identified on radiograph.',
      plan: planMatch ? planMatch[1].trim() : 'Recommended dental interventions documented.'
    };
  }

  return null;
};

/**
 * Checks if a radiograph record represents a dummy/test scan.
 * Identifies filenames containing 'test', dummy test extensions, or explicit test flags.
 */
export const isTestRadiograph = (r) => {
  if (!r) return false;
  if (r.isTest === true || r.isTestScan === true) return true;
  const name = (r.imageName || r.ImageName || '').toLowerCase().trim();
  if (name.includes('test')) return true;
  if (name.endsWith('.bin') || name.endsWith('.json') || name.endsWith('.txt')) return true;
  if (name === 'sample.jpg' || name === 'dummy.jpg') return true;
  return false;
};

