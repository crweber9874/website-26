import Story from "@/modules/avp/explorer/components/Story";
import Link from "@/modules/avp/shared/lib/Link";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";

/** Presentational story shell — content is loaded in Astro and passed as props. */
export default function StoryPage({ hero, steps, ui }) {
  return (
    <>
      <section className="story-hero">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1>{hero.title}</h1>
          <ContentHtml as="p" className="lede" html={hero.body} />
          <div className="story-cta" style={{ justifyContent: "center" }}>
            {(hero.json?.ctas ?? []).map((cta) => (
              <Link
                className={`btn${cta.primary ? " primary" : ""}`}
                href={cta.href}
                key={cta.href}
              >
                {cta.label}
              </Link>
            ))}
          </div>
          <div className="scrollcue">↓</div>
        </div>
      </section>
      <Story steps={steps} ui={ui} />
    </>
  );
}
