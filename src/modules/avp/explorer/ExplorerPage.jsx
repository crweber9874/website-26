import Link from "@/modules/avp/shared/lib/Link";
import { loadCd } from "@/modules/avp/explorer/lib/data";
import Explorer from "@/modules/avp/explorer/components/Explorer";
import { fillTemplate, loadContent } from "@/modules/avp/shared/lib/content";

export default function ExplorerPage() {
  const data = loadCd();
  const { sections } = loadContent("explorer");
  const hero = sections.hero;
  const lede = fillTemplate(hero.ledeTemplate, {
    fileDate: data.fileDate,
    vintage: data.vintage,
  });

  return (
    <>
      <section className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1 className={hero.titleClass}>{hero.title}</h1>
          <p className="lede">{lede}</p>
          <div className="story-cta" style={{ marginTop: 14 }}>
            {hero.json.ctas.map((cta) => (
              <Link className="btn" href={cta.href} key={cta.href}>
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <main className="wrap content-after-hero">
        <Explorer initialData={data} initialGeo="cd" />
      </main>
    </>
  );
}
