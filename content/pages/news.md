---
metaTitle: Election News · AZ Secretary of State results
---

## hero

eyebrow: Module 1 · Election News
titleTemplate: "{election}"
ledeTemplate: Results from the Arizona Secretary of State&rsquo;s public reporting feed. Election held <b>{electionDate}</b>; figures reflect the reported count as of <b>{timestamp}</b> (a snapshot, not a live feed). Primaries are party-separate — each party nominates its own candidate — so compare within a party, not across.
sourceTemplate: Source: {source}. {nContests} contests statewide.

## opening

[ Opening framing — set up the 2026 primary: turnout, the stakes, the storylines to watch. Replace this text. ]

```json
{
  "nav": [
    ["statewide", "Statewide"],
    ["congress", "U.S. House"],
    ["legislature", "Legislature"]
  ]
}
```

## statewide

eyebrow: Chapter 1 · The statewide races
title: The top of the ticket
introTemplate: The marquee contest was the <b>{contest}</b> {party}primary, where <b>{leader}</b> led with <b>{pct}%</b> ({votes} votes).
introSuffix: Primaries are party-separate — each party picks its own nominee — so read within a party, not across. Winners here advance to November.
story: [ The statewide story — who won, who over- or under-performed, what the margins say about the November matchups. Replace this text. ]

## congress

eyebrow: Chapter 2 · The congressional primaries
titleTemplate: Arizona&rsquo;s {nDistricts} U.S. House districts

Each district ran separate party primaries. The competitive general elections tend to be in the swing districts — watch the margins where both parties fielded contested fields.

story: [ Congressional narrative — the swing-district primaries, any incumbent scares, the fields set for the fall. Replace this text. ]

## legislature

eyebrow: Chapter 3 · Down the ballot
titleTemplate: The State Legislature — all {nDistricts} districts

Every legislative district elects one senator and (usually) two representatives. These {nContests} primary contests decide who controls the state House and Senate — the races that actually write Arizona law, and the ones fewest voters watch.

story: [ Legislative narrative — battles for control, notable primary upsets, districts to watch in November. Replace this text. ]
