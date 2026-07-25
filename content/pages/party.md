---
metaTitle: Party transitions · The Arizona Voter Project
---

## hero

eyebrow: Analysis · Party transitions
title: How Arizonans move between parties
ledeTemplate: Continuous-time MSM of party switches — {nTransitions} transitions across {nWindows} windows. Sticky registration; small flows still have a direction.

## sankey

eyebrow: 0 · Party flows
title: Party transitions by geography

MSM projection of expected switchers. Horizon = months ahead.

## msm

eyebrow: 1 · MSM
title: Dwell times and long-run mix
dwellNote: Mean years before a party move.

How long labels last, and where switching rates push.

## matrix

eyebrow: 2 · One-month transition probabilities
title: P(party in 30 days | party today)

Rows = current party, columns = destination after 30 days from the continuous-time fit. The diagonal (staying put) dominates; off-diagonal cells are shaded by switching probability. Hover any cell for a plain-language interpretation.

interpretTemplate: Interpretation: among Democrats today, about <b>{demStay}%</b> are still Democratic in 30 days, while about <b>{demToRep}%</b> switch to Republican. Among Republicans, about <b>{repStay}%</b> remain Republican, and <b>{repToDem}%</b> switch to Democratic.

## steady

eyebrow: 3 · Where the dynamics point
title: Long-run steady state

The stationary distribution of the continuous-time chain — where registration would settle <em>if these switching rates held fixed</em>. It leans more Republican than today (a diagnostic of the switching direction, <b>not</b> a forecast: it ignores new registrations, deaths, and purges).

twoStateTemplate: Collapsed to <b>partisan vs unaffiliated</b>, the steady state is {partisanPct} partisan / {nonpartisanPct} unaffiliated.

## covariates

eyebrow: 4 · Predicting ZIP-level dynamics
title: Do ZIP characteristics influence transitions?

Fitting multivariate models on {nZipsSteady} ZIPs links local composition to Markov-derived switching rates. Republican registration share, turnout, and age all predict a ZIP&apos;s long-run partisan equilibrium (R² {r2}). Higher permanent early-voting-list penetration predicts <em>less</em> partisan steady state — ZIPs with more mail voters stay more unaffiliated.

```json
{
  "coefLabels": [
    ["Republican share → steady partisan eq.", "party_share_rep", "+"],
    ["Median voter age → steady partisan eq.", "voter_median_age", "+"],
    ["2024 general turnout → steady partisan eq.", "turnout_gen_2024", "+"],
    ["PEVL share → steady partisan eq.", "pevl_share", "−"]
  ]
}
```

crossPartyNoteTemplate: Short-window cross-party switching (DEM→REP in one month) is too rare to predict well from ZIP covariates alone (R² {r2}). Geography shapes the <em>level</em> of partisan attachment more than month-to-month cross-party flux.

## entrants

eyebrow: 5 · Entrants and waves
title: New registrants and monthly file builds
entrantPlaceholder: <b>New-entrant party mix.</b> Entrant party counts and median age by geography are not available for this selection.

Across {markovWaves} monthly builds (2022–2026), rows on the file grew from roughly 5.8M to 6.9M — active, inactive, and canceled registrations combined. Most month-to-month &ldquo;movement&rdquo; is affiliation toggling (to/from unaffiliated), not cross-party switching — visible in the primary-season windows below.
