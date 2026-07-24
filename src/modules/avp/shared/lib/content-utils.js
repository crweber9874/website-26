/** Replace `{key}` placeholders in a content string. */
export function fillTemplate(text, vars = {}) {
  if (!text) return "";
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`);
}

/** Split prose body into paragraph strings (blank-line separated). */
export function paragraphs(text) {
  if (!text) return [];
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}
