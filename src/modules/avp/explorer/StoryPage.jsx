import Story from "@/modules/avp/explorer/components/Story";
import Link from "@/modules/avp/shared/lib/Link";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { loadContent } from "@/modules/avp/shared/lib/content";

export default function StoryPage() {
  const intro = loadContent("story-intro");
  const steps = loadContent("story-steps");
  const hero = intro.sections.hero;

  return (
    <>
      <section className="story-hero">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1>{hero.title}</h1>
          <p className="lede">{hero.body}</p>
          <div className="story-cta" style={{ justifyContent: "center" }}>
            {hero.json.ctas.map((cta) => (
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
      <Story
        steps={steps.sections.steps.json}
        ui={steps.sections.ui}
      />
    </>
  );
}
