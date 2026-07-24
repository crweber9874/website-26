import SearchApp from "@/modules/avp/explorer/components/SearchApp";
import { loadContent } from "@/modules/avp/shared/lib/content";

export default function SearchPage() {
  const { sections } = loadContent("search");
  const hero = sections.hero;

  return (
    <>
      <section className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">{hero.eyebrow}</div>
          <h1 className={hero.titleClass}>{hero.title}</h1>
          <p className="lede">{hero.body}</p>
        </div>
      </section>
      <main className="wrap content-after-hero">
        <SearchApp />
      </main>
    </>
  );
}
