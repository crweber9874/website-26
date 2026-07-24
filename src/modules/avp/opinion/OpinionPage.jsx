import Opinion from "@/modules/avp/opinion/components/Opinion";
import { loadOpinion } from "@/modules/avp/opinion/lib/opinion";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { fillTemplate, loadContent } from "@/modules/avp/shared/lib/content";

export const metadata = {
  title: "Module 3 · Public Opinion — Arizona Voter Project",
  description:
    "Arizona public opinion: affective polarization, political tolerance, democratic norms, and the partisan perception gap.",
};

export default function OpinionPage() {
  const data = loadOpinion();
  const { sections } = loadContent("opinion");
  const hero = sections.hero;
  const copy = {
    ...sections,
    about: {
      ...sections.about,
      body: fillTemplate(sections.about.body, { minCell: data.meta?.min_cell ?? 25 }),
      followup: sections.about.followup,
      footer: fillTemplate(sections.about.footerTemplate, {
        fileDate: data.meta?.file_date ?? "",
      }),
    },
  };

  return (
    <>
      <section className="story-hero">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1>{hero.title}</h1>
          <p className="lede">
            <ContentHtml html={hero.body} />
          </p>
        </div>
      </section>
      <main className="wrap content-after-hero">
        <Opinion {...data} copy={copy} />
      </main>
    </>
  );
}
