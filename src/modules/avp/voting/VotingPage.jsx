import PrecinctExplorer from "@/modules/avp/voting/components/PrecinctExplorer";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { loadContent } from "@/modules/avp/shared/lib/content";

export const metadata = {
  title: "Voting in Arizona · AVP Web Modules",
  description: "Certified precinct-level election returns on an interactive map.",
};

export default function VotingPage() {
  const { sections } = loadContent("voting");
  const hero = sections.hero;

  return (
    <>
      <section className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1 className={hero.titleClass}>{hero.title}</h1>
          <p className="lede">
            <ContentHtml html={hero.body} />
          </p>
        </div>
      </section>

      <main className="wrap content-after-hero">
        <section className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px" }}>
            <ContentHtml html={sections.intro.body} />
          </p>
          <p className="note" style={{ margin: 0 }}>
            <ContentHtml html={sections.mapNote.body} />
          </p>
        </section>

        <PrecinctExplorer />
      </main>
    </>
  );
}
