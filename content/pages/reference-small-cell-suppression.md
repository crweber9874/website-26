---
metaTitle: Small-cell suppression · Reference · AVP
metaDescription: Why AVP drops geographic units with fewer than fifty registrants from published data.
---

## hero

eyebrow: Reference · Privacy
title: Small-cell suppression

Even after direct identifiers are stripped, a sufficiently small group of registrants in a geographic unit could — in theory — allow someone with outside knowledge to infer facts about an individual. AVP applies a <strong>minimum cell size of fifty registrants</strong> before any geographic unit is published. Units below that threshold are dropped from maps, tables, and downloadable aggregates.

## why

eyebrow: Why suppression is necessary
title: The re-identification risk in small cells

De-identification removes names and addresses, but published aggregates still carry information. Consider a block group with three active registrants: if the published data shows two Republicans and one Democrat, anyone who knows two Republican neighbors on that block can infer the third person&rsquo;s party registration.

This is the <em>micro-data disclosure problem</em> — a well-studied issue in census data, health statistics, and voter-file research. The standard mitigation is to suppress or combine cells that are too small to protect individual privacy while still preserving analytical utility at scale.

Fifty registrants is a conservative threshold chosen to align with common practice in political data disclosure and to ensure that no published cell is so small that a single person&rsquo;s characteristics dominate the aggregate.

## what_is_suppressed

eyebrow: What gets dropped
title: Geographic units below the threshold

Suppression applies to every geography AVP publishes:

County (never suppressed — all Arizona counties exceed fifty registrants).

Congressional district and legislative district (never suppressed at the district level).

Census tract, block group, and ZIP code (frequently suppressed at the finest levels).

When a unit is suppressed, it simply does not appear in the published JSON or on the map. It is not shown as zero or as a missing-data pattern — it is excluded entirely. Neighboring units on choropleth maps may appear to have gaps where suppressed units would be.

Statewide totals always include every registrant regardless of geographic assignment. Suppression affects only sub-state geographic breakdowns.

## impact

eyebrow: Impact on analysis
title: What suppression means for the numbers

Because suppressed units are excluded from geographic aggregates, sub-state counts may not sum exactly to statewide totals shown elsewhere on the site. The difference is typically small — suppressed units account for a tiny fraction of Arizona&rsquo;s total registration — but it is worth noting when comparing a map total to a statewide headline figure.

Modules that operate at coarser geographies (county, congressional district) are essentially unaffected. Modules that drill to block groups or tracts show fewer units in rural or sparsely populated areas — which is intentional.

The Arizona Voter Survey (Module 3) uses a separate suppression threshold for survey cross-tabulations (minimum cell size of 25 respondents). That threshold is documented in the Opinion module&rsquo;s methodology footer.

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/reference/de-identification", "label": "De-identification →" },
    { "href": "/explorer", "label": "Democracy through Data →" },
    { "href": "/reference", "label": "All reference topics →" }
  ]
}
```
