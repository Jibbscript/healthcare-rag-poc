export const piiPatterns: Array<[RegExp, string]> = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, 'SSN'],
  [/\b(?:member|policy)\s*(?:id|number)\s*[:#-]?\s*[A-Z0-9-]{5,}\b/gi, 'MEMBER_ID'],
  [/\b\d{3}[-.)\s]*\d{3}[-.\s]*\d{4}\b/g, 'PHONE'],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 'EMAIL'],
  [/\b(?:dob|date of birth)\s*[:#-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi, 'DOB']
];

export function redactText(input: string): { redactedText: string; labels: string[] } {
  let redactedText = input;
  const labels = new Set<string>();
  for (const [pattern, label] of piiPatterns) {
    redactedText = redactedText.replace(pattern, () => {
      labels.add(label);
      return `[REDACTED_${label}]`;
    });
  }
  return { redactedText, labels: [...labels].sort() };
}

export function looksLikeRawPii(input: string): boolean {
  return piiPatterns.some(([pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(input);
  });
}
