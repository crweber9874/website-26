---
metaTitle: Build-over-build comparison · Reference · AVP
metaDescription: How AVP archives monthly Arizona voter file rebuilds and measures change between consecutive snapshots.
---

## hero

eyebrow: Reference · Methodology
title: Build-over-build comparison

Arizona rebuilds its statewide voter file roughly once a month — each rebuild is a complete snapshot of every registration row as of a specific date. AVP has archived consecutive builds since May 2022. Comparing two snapshots (a &ldquo;build-over-build&rdquo; diff) is the foundation for measuring how many people registered, moved, were list-maintained off the roll, or changed party affiliation in a single month.

## snapshots

eyebrow: What a build is
title: Monthly snapshots, not live feeds

Each build is a point-in-time export from the Secretary of State&rsquo;s office. It is <em>not</em> a real-time feed — there is always a lag between an event (a move, a death, a new registration) and its appearance in the next archived build.

AVP treats each build as immutable once archived. The pipeline never retroactively edits an old build; if the state corrects a prior export, the correction appears only in subsequent builds. This matters when interpreting short-window counts: a &ldquo;purge&rdquo; in the June→July diff reflects what the July 2 build shows relative to June 1, not necessarily what happened on a specific calendar day.

Build dates and counts on the Understanding page reflect the latest archived build at site publication time.

## linking

eyebrow: Linking rows across builds
title: How we know it is the same person

Build-over-build comparison depends on linking the same registrant across consecutive snapshots. AVP uses the pseudonymous <code>avp_id</code> for this linkage — assigned once when a record first enters the pipeline and stable thereafter.

For each pair of consecutive builds, the pipeline classifies every linked record into one of several flow types:

<strong>Status flows</strong> — changes in registration status: active → inactive (deactivation), inactive → active (reactivation), active → canceled (purge).

<strong>Party flows</strong> — changes in party bucket among records that remain on the file with the same status category.

<strong>Churn</strong> — records that appear in one build but not the next (new registrations entering the file) or disappear entirely (dropped rows, typically after a merge or out-of-state move that removes the record rather than canceling it in place).

A record absent for several builds and then reappearing is treated as a re-entry, not a multi-step transition. Only adjacent build pairs contribute to one-step flow counts.

## stats

eyebrow: The headline numbers
title: What the Understanding page counts mean

The build-over-build cards on Module 1 compare the two most recent archived builds (currently June 1 → July 2, 2026). Each stat is a statewide count of linked records that changed in that specific way:

<strong>Deactivated</strong> — active in the earlier build, inactive in the later.

<strong>Reactivated</strong> — inactive in the earlier build, active in the later.

<strong>Purged</strong> — active in the earlier build, canceled in the later.

<strong>Affiliation changes</strong> — party bucket changed to or from PND (unaffiliated). Voters who remained unaffiliated (PND→PND) are excluded; <code>from_PND</code> is a denominator, not a flow.

<strong>Cross-party switches</strong> — direct Democrat ↔ Republican moves (neither side is PND).

<strong>Newly added</strong> — <code>avp_id</code> present in the later build but absent from the earlier (new registration or re-entry).

<strong>Dropped</strong> — <code>avp_id</code> present in the earlier build but absent from the later (left the file entirely).

These counts are not mutually exclusive categories for a single person in a single month — a voter could both change party and then be deactivated in the same window. They are separate tallies of distinct event types.

## geography

eyebrow: Geographic breakdowns
title: From statewide to local

The same build-over-build logic runs at every published geography — county, congressional district, legislative district, ZIP, tract, and block group. Module 2&rsquo;s explorer and the party-transitions module surface these flows geographically.

Geographic flow counts sum to the statewide totals only when every registrant is assigned to exactly one unit and no unit is suppressed. Small-cell suppression (fewer than fifty registrants) removes some units from published maps, so local counts may not sum to statewide figures.

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/understanding", "label": "Understanding the voter file →" },
    { "href": "/reference/transitions-markov", "label": "Transitions & the Markov model →" },
    { "href": "/party", "label": "Party transitions dashboard →" }
  ]
}
```
