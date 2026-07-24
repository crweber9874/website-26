---
metaTitle: Methods & Reference · The Arizona Voter Project
metaDescription: Methodology, field definitions, privacy safeguards, and analytic decisions behind AVP data modules.
---

## hero

eyebrow: Reference
title: Methods, definitions, and analytic decisions

The dashboards on this site are built from raw Arizona voter-file exports that are messy, privacy-sensitive, and constantly changing. This reference section documents every major cleaning rule, classification choice, and privacy safeguard — so the published numbers are reproducible and open to scrutiny.

## intro

Each topic below explains one decision in plain language: what the raw data looked like, what we did to it, and why. Start with <strong>Understanding the Voter File</strong> for the narrative overview; come here when you need the full methodology behind a specific number.

## topics

```json
[
  {
    "slug": "removal-reasons",
    "group": "Classification",
    "title": "Removal reason codes",
    "summary": "How roughly sixty inconsistent raw codes collapse into ten plain categories used everywhere on the site."
  },
  {
    "slug": "party-buckets",
    "group": "Classification",
    "title": "Party registration buckets",
    "summary": "Why six mutually exclusive party labels sum exactly to the active file — and what &ldquo;unaffiliated&rdquo; really means in Arizona."
  },
  {
    "slug": "field-definitions",
    "group": "The voter file",
    "title": "Field definitions",
    "summary": "What each column in a voter-file row represents — identity, geography, registration status, and participation history."
  },
  {
    "slug": "build-over-build",
    "group": "Methodology",
    "title": "Build-over-build comparison",
    "summary": "How monthly state rebuilds are archived, linked, and compared to measure deactivations, reactivations, purges, and new registrations."
  },
  {
    "slug": "transitions-markov",
    "group": "Methodology",
    "title": "Transitions &amp; the Markov model",
    "summary": "How the same person is tracked across consecutive builds, what counts as a one-step transition, and how the party-switching model works."
  },
  {
    "slug": "de-identification",
    "group": "Privacy",
    "title": "De-identification &amp; pseudonymization",
    "summary": "How direct identifiers are stripped, why a stable pseudonymous id is kept for linkage, and what is never published."
  },
  {
    "slug": "small-cell-suppression",
    "group": "Privacy",
    "title": "Small-cell suppression",
    "summary": "Why geographic units with fewer than fifty registrants are dropped — and how that threshold protects against re-identification."
  }
]
```

## back

eyebrow: Back to the modules
title: Ready to explore the data?
body: These methods power every module on the site. Return to the overview or jump straight into an analysis.

```json
{
  "links": [
    { "href": "/understanding", "label": "Understanding the voter file →" },
    { "href": "/explorer", "label": "Democracy through Data →" },
    { "href": "/", "label": "Home →" }
  ]
}
```
