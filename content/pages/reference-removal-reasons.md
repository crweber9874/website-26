---
metaTitle: Removal reason codes · Reference · AVP
metaDescription: How AVP collapses dozens of raw Arizona voter-file removal codes into ten plain categories.
---

## hero

eyebrow: Reference · Classification
title: Removal reason codes

When Arizona removes a registration from the active roll — or marks it inactive pending confirmation — the state records a <code>status_reason</code> code explaining why. That field is essential for list maintenance, but it is also one of the messiest columns in the raw export. AVP collapses it into <strong>ten plain categories</strong> so every chart, table, and summary on this site uses the same vocabulary.

## problem

eyebrow: The raw field
title: Why the codes need cleaning

The state&rsquo;s export carries dozens of distinct <code>status_reason</code> values — often sixty or more in a single build. Many are near-duplicates: three spellings of <code>DECEASED</code>, several variants of NVRA-related codes, mixed case, trailing spaces, and legacy encoding artifacts left over from older database migrations. Some codes appear only a handful of times; others differ by a single character but mean the same thing.

Without consolidation, any statewide count of &ldquo;why people left the roll&rdquo; would depend on arbitrary string-matching choices — and would change if the Secretary of State&rsquo;s office renamed a code in the next export. AVP applies a single, documented regex map at pipeline time so the taxonomy is stable across all builds and all modules.

## categories

eyebrow: The ten categories
title: What each reason means

These categories appear on the Understanding page, in geographic breakdowns, and anywhere removal reasons are summarized. A registration can carry a reason while <em>inactive</em> (address not confirmed) or <em>canceled</em> (removed from the roll).

```json
{
  "items": [
    ["Failed to respond (NVRA)", "Under the National Voter Registration Act, counties must periodically mail address-confirmation notices to voters whose mail was returned undeliverable. If the voter does not respond within the statutory window, the registration may be moved to inactive status or eventually canceled. This is the largest single removal pathway in most builds — not because of fraud, but because people move without updating their registration."],
    ["Moved / residency", "The voter registered elsewhere, the residence address is no longer valid, or county records show the person no longer lives at the registered address. This includes interstate moves, intra-state address changes that were never updated, and residency challenges."],
    ["Deceased", "Matched against state or federal death records. Arizona periodically cross-references its voter roll against the Social Security Death Index and other mortality databases. Deceased removals are typically small as a share of the file but are important for roll accuracy."],
    ["Voter request", "The registrant asked to be removed — for example, after moving out of state and completing a cancellation form, or choosing to end registration for personal reasons."],
    ["Administrative", "Catch-all for system cleanups: duplicate records flagged for review, expired provisional registrations, data-quality fixes initiated by county election offices, and other procedural removals that do not fit a more specific category."],
    ["Felony", "A disqualifying felony conviction under Arizona law. Felony disenfranchisement rules determine when — and whether — voting rights are restored; the file records the removal event itself."],
    ["Incapacitated", "A court has declared the person incapacitated in a proceeding that affects voting eligibility."],
    ["Duplicate / merge", "The same person appeared twice on the roll (often after a name change, hyphenation, or data-entry error). County staff merged the records and canceled the duplicate row."],
    ["Citizenship / eligibility", "Citizenship or other voting eligibility could not be confirmed during a verification process. This category has grown in visibility as states implement more systematic eligibility checks."],
    ["Other", "Any code that does not match the patterns above. Reviewed periodically; if a new code appears frequently enough to warrant its own category, the map is updated and documented here."]
  ]
}
```

## usage

eyebrow: How we use this taxonomy
title: Consistency across the site

The same ten categories drive every module that touches removal reasons. On <strong>Understanding the Voter File</strong>, they appear as a statewide summary. In <strong>Democracy through Data</strong>, you can compare how removal-reason mixes differ by county or district. In the party-transitions module, removals are tracked separately from within-file party switching — a purge is not a &ldquo;transition&rdquo; in the Markov sense.

When you see a reason label anywhere on this site, it refers to one of the ten categories above — never a raw state code string.

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/understanding", "label": "Understanding the voter file →" },
    { "href": "/reference/build-over-build", "label": "Build-over-build comparison →" },
    { "href": "/reference", "label": "All reference topics →" }
  ]
}
```
