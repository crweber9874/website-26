import Agreement from "@/modules/avp/agreement/components/Agreement";
import { loadAgreement } from "@/modules/avp/agreement/lib/agreement";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { fillTemplate, loadContent } from "@/modules/avp/shared/lib/content";

export const metadata = {
  title: "Common Ground in Arizona Politics · Arizona Voter Project",
  description:
    "How much do Arizonans actually overlap on policy and attitudes? An analysis tool measuring the shared area of opinion distributions across party, race/ethnicity, religion, and demographics.",
};

export default function AgreePage() {
  const data = loadAgreement();
  const { sections } = loadContent("agree");
  const ui = sections.ui;
  const copy = {
    rankHead: ui.rankHead,
    avgCaption: ui.avgCaptionTemplate,
    lede: ui.ledeTemplate,
    overlapBroad: ui.overlapBroad,
    overlapPartial: ui.overlapPartial,
    overlapLow: ui.overlapLow,
    sharedLegend: ui.sharedLegend,
    read: ui.readTemplate,
    readHigh: ui.readHighTemplate,
    n: ui.nTemplate,
    footer: fillTemplate(ui.footer, {
      minCell: data.meta?.min_cell ?? 25,
      fileDate: data.meta?.file_date ?? "",
    }),
  };

  return (
    <>
      <section className="story-hero">
        <div className="wrap">
          <div className="eyebrow">{sections.hero.eyebrow}</div>
          <h1>{sections.hero.title}</h1>
          <p className="lede">
            <ContentHtml html={sections.hero.body} />
          </p>
        </div>
      </section>
      <main className="wrap content-after-hero">
        <Agreement {...data} copy={copy} />
      </main>
    </>
  );
}
