---
metaTitle: Party registration buckets · Reference · AVP
metaDescription: How AVP classifies Arizona party registration into six mutually exclusive buckets.
---

## hero

eyebrow: Reference · Classification
title: Party registration buckets

Arizona&rsquo;s raw voter file lists each registrant&rsquo;s party affiliation as a short code — <code>REP</code>, <code>DEM</code>, <code>PND</code>, and dozens of minor-party labels. For analysis, AVP collapses these into <strong>six mutually exclusive buckets</strong> that sum exactly to the active registration total in every geographic unit. This page explains what each bucket contains and why the classification matters for interpreting party &ldquo;switching.&rdquo;

## buckets

eyebrow: The six buckets
title: What each label means

Every active registrant falls into exactly one bucket. The buckets are exhaustive — there is no &ldquo;unknown party&rdquo; residual.

```json
{
  "items": [
    ["REP — Republican", "Registered with the Arizona Republican Party. In Arizona&rsquo;s semi-open primary system, Republicans vote in Republican primaries unless they choose otherwise during a primary-election window."],
    ["DEM — Democratic", "Registered with the Arizona Democratic Party. Same primary rules apply in reverse."],
    ["LBT — Libertarian", "Registered with the Libertarian Party of Arizona. Minor-party registrants have their own primary ballot access rules."],
    ["NOL — No Labels", "Registered with the No Labels Arizona party. A relatively recent entry on the Arizona ballot; counts are small but tracked separately because the party is formally recognized."],
    ["PND — Party Not Specified", "Unaffiliated / independent. The registrant chose not to affiliate with any recognized party. In Arizona this is the largest &ldquo;party&rdquo; after Republican and Democratic registration — and the most common destination (and origin) of registration changes."],
    ["OTH — Other party", "All remaining recognized minor parties — Green, Independent American, and any other ballot-qualified party not listed above. Rolled together because individual minor-party counts are too small for reliable geographic breakdowns."]
  ]
}
```

## switching

eyebrow: Interpreting party movement
title: Why PND dominates &ldquo;switching&rdquo;

Most registration change that looks like party &ldquo;switching&rdquo; in Arizona is actually movement in and out of <strong>PND (unaffiliated)</strong>, not Democrats becoming Republicans or vice versa. Arizona&rsquo;s semi-open primaries create a strong seasonal incentive: ahead of a primary, unaffiliated voters often temporarily affiliate with a major party to vote its ballot, then return to PND afterward.

For this reason, AVP&rsquo;s build-over-build stats and Markov analysis treat two kinds of movement separately:

<strong>Affiliation changes</strong> — any switch involving PND (to or from a recognized party). These swamp true cross-party movement by roughly ten to one.

<strong>Cross-party switches</strong> — direct Democrat ↔ Republican moves among voters who were already affiliated with a major party. These are small, steady, and much less seasonal.

If you see a surge in &ldquo;party switching&rdquo; in a June→July build, check whether it is affiliation churn ahead of a primary before interpreting it as ideological realignment.

## geography

eyebrow: Geographic summaries
title: How buckets appear in maps and charts

Every choropleth, bar chart, and summary table on this site that shows party registration uses these six buckets. Percentages are always computed against the active registration denominator unless a module explicitly states otherwise (for example, turnout denominators use active registrants, not total file rows including inactive and canceled).

Party shares in a congressional district, ZIP code, or block group are simple counts of active registrants in each bucket divided by total active registrants in that unit — after small-cell suppression (see the suppression reference page).

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/party", "label": "Party transitions (Markov) →" },
    { "href": "/reference/transitions-markov", "label": "Transitions & the Markov model →" },
    { "href": "/understanding", "label": "Understanding the voter file →" }
  ]
}
```
