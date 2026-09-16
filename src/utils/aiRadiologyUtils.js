import { getHexColor } from './toothDataConstants';

/**
 * Parses and extracts structured tooth findings from an AI radiograph diagnostic report.
 * Supports:
 * 1. Embedded JSON blocks: ```json ... "teethFindings": [...] ... ```
 * 2. Clinical regex fallback: extracts teeth numbers, detected pathology, severity, and CDT procedures.
 */
export const extractAiFindingsFromReport = (reportText) => {
  if (!reportText || typeof reportText !== 'string') return [];
  let findings = [];

  // 1. Primary: Look for structured JSON block in markdown or raw JSON
  try {
    const jsonMatch = reportText.match(/```json\s*([\s\S]*?)\s*```/) || reportText.match(/\{[\s\S]*"teethFindings"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (Array.isArray(parsed.teethFindings) && parsed.teethFindings.length > 0) {
        findings = parsed.teethFindings.map(f => {
          const tNum = parseInt(f.toothNumber, 10);
          const tKey = f.toothKey || String(f.toothNumber);
          const condition = f.condition || f.status || 'Radiographic Finding';
          const defaultColor = getHexColor(condition);

          return {
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
          };
        });
      }
    }
  } catch (e) {
    console.warn("Structured JSON parsing of AI findings failed, falling back to clinical regex:", e);
  }

  // 2. Secondary / Fallback: Clinical Regex Extraction for Tooth Mentions & Pathologies
  if (findings.length === 0) {
    // Matches patterns like "Tooth #19: Periapical radiolucency", "#14 - Caries (MO)", "Tooth 3: Fracture"
    const toothRegex = /(?:tooth\s*#?|#)\s*([0-9]{1,2}|[A-Ta-t])\b(?:\s*[:\-–—]\s*([^\n.;]+))?/gi;
    const matches = [...reportText.matchAll(toothRegex)];
    const detectedMap = new Map();

    matches.forEach(m => {
      const tKey = m[1].toUpperCase();
      const tNum = parseInt(tKey, 10);
      const rawCondition = (m[2] || '').trim();

      if (!detectedMap.has(tKey)) {
        let cond = 'Radiographic Finding';
        let color = '#3B82F6';
        let cdt = 'D0140';
        let proc = 'CDT D0140 (Limited Problem-Focused Examination)';
        let sev = 'Noted on Radiograph';

        const fullContext = (rawCondition + ' ' + reportText).toLowerCase();

        if (/caries|decay|cavity|radiolucent lesion|demineraliz|caries active/i.test(rawCondition || fullContext)) {
          cond = 'Dental Caries / Decay';
          color = '#EF4444';
          cdt = 'D2391';
          proc = 'CDT D2391 (Resin Composite - 1 Surface Posterior)';
          sev = 'Enamel/Dentin Lesion';
        } else if (/periapical|apical|periodontitis|abscess|radiolucency|rct indicated/i.test(rawCondition || fullContext)) {
          cond = 'Periapical Radiolucency';
          color = '#DC2626';
          cdt = 'D3330';
          proc = 'CDT D3330 (Endodontic Root Canal Therapy)';
          sev = 'Apical Radiolucency Observed';
        } else if (/bone loss|periodontal|alveolar crest|pocket|crest resorption/i.test(rawCondition || fullContext)) {
          cond = 'Periodontal Bone Loss';
          color = '#F59E0B';
          cdt = 'D4341';
          proc = 'CDT D4341 (Periodontal Scaling & Root Planing)';
          sev = 'Alveolar Crest Loss';
        } else if (/impacted|impaction|horizontal|completely bony/i.test(rawCondition || fullContext)) {
          cond = 'Impacted Tooth (Bony)';
          color = '#8B5CF6';
          cdt = 'D7240';
          proc = 'CDT D7240 (Surgical Removal of Impacted Tooth)';
          sev = 'Bony Impaction Visualized';
        } else if (/crown|bridge|prosthesis|filling|restoration|overhang/i.test(rawCondition || fullContext)) {
          cond = 'Existing Restoration Evaluation';
          color = '#2563EB';
          cdt = 'D2740';
          proc = 'CDT D2740 (Restorative Crown Evaluation)';
          sev = 'Margin Evaluation';
        }

        detectedMap.set(tKey, {
          toothNumber: !isNaN(tNum) ? tNum : tKey,
          toothKey: tKey,
          condition: rawCondition || cond,
          severity: sev,
          confidence: 92,
          color,
          cdtCode: cdt,
          procedure: proc,
          status: 'Planned',
          surface: ''
        });
      }
    });

    findings = Array.from(detectedMap.values());
  }

  return findings;
};
