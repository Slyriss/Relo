// Jaccard similarity on meaningful tokens (≥4 chars).
// Captures domain overlap (e.g. "clinical workflow" ↔ "patient platform") without an API call.
// When OPENAI_API_KEY is present, the /api/match route uses text-embedding-3-small instead.
export function bioSimilarity(a: string, b: string): number {
  const tokenize = (text: string) => new Set(text.toLowerCase().match(/\b\w{4,}\b/g) ?? []);
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}
