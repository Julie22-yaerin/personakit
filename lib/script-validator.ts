export interface ParsedScriptRow {
  shotNumber: number;
  timeRange: string;
  script: string;
  action: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasTimeRange: boolean;
  hasTalkingScript: boolean;
  hasAction: boolean;
  errors: string[];
  rows: ParsedScriptRow[];
  rawScript: string;
  totalDuration: string;
}

/**
 * Validates ChatGPT output against the landing page prompt requirements:
 * Requires:
 * 1. TIME RANGE (e.g. 0:00-0:05, 0:09–0:25, 00:00 - 00:10, 0-5s)
 * 2. TALKING SCRIPT (spoken sentences / dialogue)
 * 3. ACTION (action instructions / physical gestures)
 */
export function validateAndParseChatGPTOutput(text: string): ValidationResult {
  const clean = text.trim();
  if (!clean) {
    return {
      isValid: false,
      hasTimeRange: false,
      hasTalkingScript: false,
      hasAction: false,
      errors: ["Script is empty. Please paste output from ChatGPT."],
      rows: [],
      rawScript: "",
      totalDuration: "00:00",
    };
  }

  // Time range regex patterns:
  // e.g. 0:00-0:05, 00:00 - 00:03, 0:09–0:25, 0-15s, [00:00 - 00:05]
  const timeRangeRegex = /(?:\[|\b)?(\d{1,2}:\d{2}|\d+s?)\s*[-–—~to]+\s*(\d{1,2}:\d{2}|\d+s?)(?:\]|\b)?/i;
  // Action indicator regex
  const actionIndicatorRegex = /(?:Action|Gesture|Movement|Visual|Stage direction|Hành động|Cử chỉ)\s*[:—–-]\s*(.+?)(?=\n|$)/i;

  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let hasTimeRange = false;
  let hasAction = false;
  let hasTalkingScript = false;

  const rawRows: { timeRange?: string; script?: string; action?: string }[] = [];
  let currentItem: { timeRange?: string; script?: string; action?: string } | null = null;

  // Parse block by block / line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const timeMatch = line.match(timeRangeRegex);
    const actionMatch = line.match(actionIndicatorRegex);

    if (timeMatch) {
      hasTimeRange = true;
      if (currentItem && (currentItem.script || currentItem.action)) {
        rawRows.push(currentItem);
      }
      currentItem = {
        timeRange: `${timeMatch[1]} – ${timeMatch[2]}`,
      };

      // Check if the same line contains the script / action
      // e.g. 0:09–0:25 — "If you're not using this..." — Action: Punch toward camera
      const restOfLine = line.replace(timeRangeRegex, "").replace(/^[\s—–:|-]+/, "").trim();
      if (restOfLine) {
        if (actionIndicatorRegex.test(restOfLine)) {
          const actM = restOfLine.match(actionIndicatorRegex);
          if (actM) {
            hasAction = true;
            currentItem.action = actM[1].trim();
            const scriptPart = restOfLine.replace(actionIndicatorRegex, "").replace(/^[\s—–:|-]+/, "").replace(/[\s—–:|-]+$/, "").trim();
            if (scriptPart) {
              hasTalkingScript = true;
              currentItem.script = scriptPart.replace(/^["'“](.*)["'”]$/, "$1");
            }
          }
        } else {
          hasTalkingScript = true;
          currentItem.script = restOfLine.replace(/^["'“](.*)["'”]$/, "$1");
        }
      }
    } else if (actionMatch) {
      hasAction = true;
      if (!currentItem) {
        currentItem = {};
      }
      currentItem.action = actionMatch[1].trim();
    } else if (currentItem && !currentItem.script) {
      // Line is talking script
      const scriptText = line.replace(/^(?:TALKING SCRIPT|Script|Dialogue|Speech|Spoken|Line)\s*[:—–-]\s*/i, "").trim();
      if (scriptText.length > 2) {
        hasTalkingScript = true;
        currentItem.script = scriptText.replace(/^["'“](.*)["'”]$/, "$1");
      }
    } else if (currentItem && currentItem.script && !currentItem.action) {
      // Possible action line
      const actionText = line.replace(/^(?:Action|Gesture|Movement|Visual)\s*[:—–-]\s*/i, "").trim();
      if (actionText.length > 2) {
        hasAction = true;
        currentItem.action = actionText;
      }
    }
  }

  if (currentItem && (currentItem.script || currentItem.action || currentItem.timeRange)) {
    rawRows.push(currentItem);
  }

  // Also check globally across entire text
  if (timeRangeRegex.test(clean)) hasTimeRange = true;
  if (actionIndicatorRegex.test(clean) || /(?:punch|camera|look|point|nod|hold|step|sit|smile|gesture)/i.test(clean)) hasAction = true;
  if (clean.length > 30) hasTalkingScript = true;

  const errors: string[] = [];

  if (!hasTimeRange) {
    errors.push("❌ Missing TIME RANGE (e.g. 0:00–0:05, 0:09–0:25).");
  }
  if (!hasTalkingScript) {
    errors.push("❌ Missing TALKING SCRIPT (Spoken sentence / line of dialogue).");
  }
  if (!hasAction) {
    errors.push("❌ Missing ACTION (Physical action / gesture description, e.g. Action: Look directly into camera).");
  }

  const isValid = hasTimeRange && hasTalkingScript && hasAction && errors.length === 0;

  // Format valid rows
  let shotIndex = 1;
  const parsedRows: ParsedScriptRow[] = [];
  for (const item of rawRows) {
    if (item.script || item.timeRange) {
      parsedRows.push({
        shotNumber: shotIndex++,
        timeRange: item.timeRange || `Shot ${shotIndex}`,
        script: item.script || "—",
        action: item.action || "Look directly into camera lens",
      });
    }
  }

  const durationStr = parsedRows.length > 0
    ? parsedRows[parsedRows.length - 1].timeRange.split(/[-–—~]/)[1]?.trim() || `${parsedRows.length * 5}s`
    : "00:30";

  return {
    isValid,
    hasTimeRange,
    hasTalkingScript,
    hasAction,
    errors,
    rows: parsedRows,
    rawScript: clean,
    totalDuration: durationStr,
  };
}
