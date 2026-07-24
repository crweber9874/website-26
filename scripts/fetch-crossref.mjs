// One-off helper: resolve DOIs + abstracts from Crossref for each CV publication.
// Usage: node scripts/fetch-crossref.mjs > scripts/crossref-out.json
// Not part of the build.

const queries = [
  "Weber Federico Interpersonal Attachment Patterns of Ideological Belief Political Psychology 2007",
  "Hartman Weber Who said what Effects of Source Cues in Issue Frames Political Behavior 2009",
  "Weber Johnson Arceneaux Genetics Personality Group Identity Social Science Quarterly 2011",
  "Minor Cohen Weber Brown Atypical Semantic Activation Odd Speech Schizotypy Schizophrenia Research 2011",
  "Kirzinger Johnson Weber Genetic Environmental Influences Media Use Communication Human Communication Research 2012",
  "Weber Thornton Courting Christians Political Candidates Prime Religious Campaign Ads Journal of Politics 2012",
  "Weber Dunaway Johnson Source Cue Ambiguity Persuasive Appeal Campaign Ads Political Behavior 2012",
  "Federico Weber Ergun Hunt Mapping Connections Politics Morality Sociopolitical Moral Intuition Political Psychology 2013",
  "Weber Federico Moral Foundations Heterogeneity Ideological Preferences Political Psychology 2013",
  "Weber Emotions Campaigns Political Participation Political Research Quarterly 2013",
  "Dunaway Lawrence Rose Weber Traits versus Issues Female Candidates Coverage Senate Gubernatorial Political Research Quarterly 2013",
  "Cassese Huddy Hartman Mason Weber Socially Mediated Internet Surveys Recruiting Participants Online Experiments PS Political Science 2013",
  "Weber Lavine Huddy Federico Placing Racial Stereotypes Context Social Desirability Racial Hostility American Journal of Political Science 2014",
  "Lebo Weber Effective Approach Repeated Cross-Sectional Design American Journal of Political Science 2015",
  "Klar Weber Krupnikov Social Desirability Bias 2016 Presidential Election The Forum 2016",
  "Kenny Weber Bratton Characteristics Interpersonal Networks Disaster Response Social Science Quarterly 2017",
  "Davis Klar Weber Affective Consistency Sorting Social Science Quarterly 2019",
  "Weber Klar Exploring Psychological Foundations Ideological Social Sorting Political Psychology 2019",
  "Feldman Weber Authoritarianism Political Conflict Handbook Political Psychology 2023",
  "Huddy Feldman Weber Political Consequences Perceived Threat Felt Insecurity Annals American Academy 2007",
  "Lodge Taber Weber Dual-Process Accessibility Model Political Beliefs Attitudes Behavior Feeling Politics 2006",
];

async function run() {
  const out = [];
  for (const q of queries) {
    const url =
      "https://api.crossref.org/works?rows=3&mailto=chrisweber@arizona.edu&query.bibliographic=" +
      encodeURIComponent(q);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "christopher-weber.com-builder/1.0 (mailto:chrisweber@arizona.edu)" },
      });
      const json = await res.json();
      const items = (json.message?.items || []).map((it) => ({
        title: it.title?.[0],
        doi: it.DOI,
        container: it["container-title"]?.[0],
        year: it.issued?.["date-parts"]?.[0]?.[0],
        authors: (it.author || [])
          .map((a) => `${a.given || ""} ${a.family || ""}`.trim())
          .join(", "),
        abstract: it.abstract || null,
      }));
      out.push({ query: q, items });
      process.stderr.write(`ok: ${q}\n`);
    } catch (e) {
      out.push({ query: q, error: String(e) });
      process.stderr.write(`ERR: ${q} -> ${e}\n`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  process.stdout.write(JSON.stringify(out, null, 2));
}

run();
