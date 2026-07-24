---
metaTitle: De-identification · Reference · AVP
metaDescription: How AVP pseudonymizes Arizona voter file records before analysis and publication.
---

## hero

eyebrow: Reference · Privacy
title: De-identification &amp; pseudonymization

The raw Arizona voter file is a public record, but it contains direct identifiers — each voter&rsquo;s name and street address — that AVP never publishes and never exposes through this website. Before any record enters the analysis pipeline, direct identifiers are stripped and replaced with a stable pseudonymous id. This page explains exactly what is removed, what is kept, and why the distinction matters.

## what_is_removed

eyebrow: What we strip
title: Direct identifiers never enter published data

The following fields from the state export are removed at pipeline ingress and are not stored in any AVP analysis dataset:

<strong>Full name</strong> — first, middle, last, and suffix.

<strong>Street address</strong> — house number, street name, apartment unit.

<strong>Other direct contact fields</strong> — phone numbers, email addresses, and any field that could identify a specific individual on its own.

These are <em>direct identifiers</em> under standard de-identification frameworks (HIPAA Safe Harbor, FTC guidance). They never appear in aggregate JSON files, never appear in the site&rsquo;s public data directory, and never appear in any chart or table.

## pseudonymous_id

eyebrow: What we keep (and protect)
title: The stable pseudonymous id

After stripping direct identifiers, AVP assigns each record a stable <code>avp_id</code> — a one-way pseudonym that persists across monthly builds for the same registrant. This id enables build-over-build linkage (the foundation of transition analysis) without carrying identity.

This is <strong>pseudonymization</strong>, not full anonymization. A pseudonymous id is designed to be linkable within a controlled dataset — which means it must be treated as protected information. AVP never publishes <code>avp_id</code> at the individual level. Every figure on this site is a group aggregate: counts, means, medians, and percentages computed over at least fifty registrants in a geographic unit.

The example record on the Understanding page shows the <em>structure</em> of a row — field names and synthetic values — not a real person.

## geography

eyebrow: Geography without address
title: How location is preserved safely

Geography is derived from the residence address before the address itself is discarded. Each record retains its county, congressional district, legislative district, census tract, block group, and ZIP — political and statistical boundaries, not street-level location.

This is standard practice in voter-file research: the analytical value of geography (joining with Census demographics, mapping registration patterns) does not require publishing where someone lives on a particular street.

## aggregates

eyebrow: What gets published
title: Disclosure-safe aggregates only

Every number on this site is a pre-computed aggregate — a count, sum, mean, median, or percentage over a group of registrants in a geographic unit. No module allows drilling down to an individual record. No module publishes a combination of fields that could single out one person.

The small-cell suppression rule (minimum fifty registrants per geographic unit) provides an additional layer of protection. See the suppression reference page for details.

## distinction

eyebrow: Pseudonymization vs. anonymization
title: Why the distinction matters

<strong>Anonymization</strong> irreversibly destroys the ability to link records — appropriate when longitudinal tracking is not needed.

<strong>Pseudonymization</strong> replaces direct identifiers with a persistent token — appropriate when the research question requires tracking the same person across time (build-over-build diffs, Markov transitions) but must not expose identity.

AVP chose pseudonymization because Arizona voter-file research is inherently longitudinal: the most important questions — who stays registered, who switches parties, who gets list-maintained — require linking the same record across months. The tradeoff is that the pseudonymous id must remain in a secured, access-controlled environment and never be published.

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/reference/small-cell-suppression", "label": "Small-cell suppression →" },
    { "href": "/reference/field-definitions", "label": "Field definitions →" },
    { "href": "/understanding", "label": "Understanding the voter file →" }
  ]
}
```
