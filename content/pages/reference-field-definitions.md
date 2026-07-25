---
metaTitle: Field definitions · Reference · AVP
metaDescription: Column-by-column definitions for Arizona voter file records used in AVP analysis.
---

## hero

eyebrow: Reference · The voter file
title: Field definitions

Every person on the Arizona voter file is one row. The state export contains dozens of columns; AVP uses a focused subset for analysis and publication. This page defines each field you will encounter in the example record on the Understanding page.

## identity

eyebrow: Who
title: Identity and demographics

These fields describe who the registrant is — without publishing direct identifiers.

```json
{
  "fields": [
    ["avp_id", "A stable pseudonymous identifier assigned by AVP after direct identifiers (name, full street address) are stripped. The same person carries the same <code>avp_id</code> across monthly builds, which makes build-over-build linking possible. Never published at the individual level."],
    ["year_of_birth", "Birth year from the registration record. Combined with the build date to compute age. Published only as medians, means, or histogram bins — never as an individual value tied to geography below suppression thresholds."],
    ["registration_party", "Raw party affiliation code from the state export. Collapsed into six buckets (REP, DEM, LBT, NOL, PND, OTH) for all published summaries. See the party buckets reference page."],
    ["registration_status", "Current roll status: <code>ACTIVE</code> (eligible to vote), <code>INACTIVE</code> (registered but address unconfirmed), or <code>CANCELED</code> (removed from the roll). A fourth state, <code>SUSPENSE</code>, appears in some builds for provisional or pending records."]
  ]
}
```

## geography

eyebrow: Where
title: Residence geography

Geography fields tie each registration to Arizona&rsquo;s political and statistical boundaries. They are derived from the registrant&rsquo;s residence address as recorded by the county.

```json
{
  "fields": [
    ["county", "The county of residence — one of Arizona&rsquo;s fifteen counties. Primary administrative unit for election administration."],
    ["cd", "Congressional district (two-digit code). Redistricted after the 2020 Census; AVP tags records with the district valid for each build date."],
    ["ld", "Legislative district — Arizona&rsquo;s 30 dual-member districts for the state legislature."],
    ["tract", "U.S. Census tract (11-digit GEOID). Tracts are small, stable statistical areas — typically 1,200–8,000 people — used to join voter-file aggregates with American Community Survey data."],
    ["block_group", "Census block group (12-digit GEOID). Finer than a tract; the smallest geography at which AVP publishes choropleth maps in Module 2."],
    ["zcta", "ZIP Code Tabulation Area — the Census Bureau&rsquo;s approximation of a USPS ZIP code. Useful for ZIP-level summaries but less stable than census geographies for longitudinal analysis."]
  ]
}
```

## registration

eyebrow: Registration
title: Status, dates, and list preferences

```json
{
  "fields": [
    ["registration_date", "The date the voter first registered at this address (or re-registered after a cancellation). Used to identify new registrants in build-over-build churn analysis."],
    ["status_reason", "Why a registration is inactive or canceled — a raw state code collapsed into ten categories. Blank when status is Active. See the removal reasons reference page."],
    ["pevl", "Permanent Early Voting List indicator (<code>Y</code> / <code>N</code>). Arizona voters on the PEVL automatically receive a mail ballot for every election. PEVL share is a key variable in turnout and party analysis."],
    ["vote_method_gen_YYYY", "How the voter cast a ballot in a given general election: early (mail or drop-off), polling place, or provisional. Method codes vary slightly by county but are normalized in the pipeline."]
  ]
}
```

## participation

eyebrow: Participation history
title: Election turnout fields

The file records whether each registrant voted in past elections — not how they voted. Turnout fields are binary indicators (voted / did not vote) for each contest.

For every general election, primary election, and presidential-preference election in the archived history, the file carries a turnout flag and (where available) a vote-method code. AVP computes turnout rates as the share of <em>active</em> registrants who voted, unless a specific module states a different denominator.

Turnout in a geography is a count-weighted aggregate: the sum of voters divided by the sum of eligible registrants in that unit. This avoids the ecological fallacy of averaging individual-level binary flags without weighting.

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/understanding", "label": "Understanding the voter file →" },
    { "href": "/reference/de-identification", "label": "De-identification →" },
    { "href": "/reference", "label": "All reference topics →" }
  ]
}
```
