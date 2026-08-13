import fs from "node:fs";
import path from "node:path";

export { fillTemplate, paragraphs } from "./content-utils";

const CONTENT_DIR = path.join(process.cwd(), "content", "pages");

/**
 * @typedef {{ meta: Record<string, string>, sections: Record<string, any> }} PageContent
 */

/**
 * Load and parse a page content file (Markdown + optional JSON blocks).
 * @param {string} slug
 * @returns {PageContent}
 */
export function loadContent(slug) {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  return loadMarkdownFile(file);
}

/**
 * Load and parse a markdown file at an absolute path (same section format as content/pages).
 * @param {string} filePath
 * @returns {PageContent}
 */
export function loadMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parseContent(raw);
}

function parseContent(raw) {
  const { meta, body } = parseFrontmatter(raw);
  return { meta, sections: parseSections(body) };
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[m[1]] = val;
  }
  return { meta, body: match[2] };
}

function parseSections(body) {
  const parts = body.split(/^## /m).filter(Boolean);
  const sections = {};
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const id = part.slice(0, nl).trim();
    sections[id] = parseSection(part.slice(nl + 1));
  }
  return sections;
}

function parseSection(content) {
  const lines = content.split("\n");
  const section = { body: "" };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      break;
    }
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kv) break;
    section[kv[1]] = kv[2];
    i++;
  }

  let rest = lines.slice(i).join("\n").trim();
  const jsonMatch = rest.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  if (jsonMatch) {
    section.json = JSON.parse(jsonMatch[1]);
    rest = rest.replace(jsonMatch[0], "").trim();
  }

  const restLines = rest.split("\n");
  let j = 0;
  while (j < restLines.length) {
    const line = restLines[j];
    if (line.trim() === "") {
      j++;
      continue;
    }
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kv) break;
    section[kv[1]] = kv[2];
    j++;
  }
  section.body = restLines.slice(j).join("\n").trim();
  return section;
}
