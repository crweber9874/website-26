import { prefixContentHrefs } from "@/modules/avp/shared/lib/public-url";

/** Render trusted site copy (HTML entities and basic tags from content files). */
export function ContentHtml({ html, className, style, as: Tag = "span" }) {
  if (!html) return null;
  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: prefixContentHrefs(html) }}
    />
  );
}

export function ContentParagraphs({ text, className = "note" }) {
  if (!text) return null;
  const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.map((p, i) => (
    <p key={i} className={className} dangerouslySetInnerHTML={{ __html: prefixContentHrefs(p) }} />
  ));
}
