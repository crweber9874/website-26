---
metaTitle: Party transitions · The Arizona Voter Project
---

## hero

eyebrow: Analysis · Party transitions
title: How Arizonans move between parties
ledeTemplate: A Markov model of monthly registration changes across 38 builds of the Arizona Voter File (2022–2026), fit with the <code>markovchain</code> package on {nTransitions} voter-month transitions. Registration is <b>sticky</b> — but the small flows have a direction.

## sankey

eyebrow: 0 · Observed switching as flows
title: Party transitions by geography

Sankey widths show switchers only (off-diagonal flows), normalized to a monthly rate so windows are comparable. For longer horizons, this view composes transitions with matrix powers (P^k) to avoid treating distant endpoints as direct pathways. This pane tracks within-file party moves among matched voters; entries and exits from the file are a separate churn process.

## matrix

eyebrow: 1 · The transition matrix
title: P(next month&rsquo;s party | this month&rsquo;s)

Rows = current party, columns = next month. The diagonal (staying put) dominates; off-diagonal cells are shaded by how often that switch happens. Hover any cell for a plain-language interpretation.

interpretTemplate: Interpretation: among Democrats one month ago, about <b>{demStay}%</b> remain Democratic next month, while about <b>{demToRep}%</b> switch to Republican. Among Republicans, about <b>{repStay}%</b> remain Republican, and <b>{repToDem}%</b> switch to Democratic.

## steady

eyebrow: 2 · Where the dynamics point
title: Long-run steady state

The stationary distribution of the chain — where registration would settle <em>if these monthly switching rates held fixed</em>. It leans more Republican than today (a diagnostic of the switching direction, <b>not</b> a forecast: it ignores new registrations, deaths, and purges).

twoStateTemplate: Collapsed to <b>partisan vs unaffiliated</b>, the steady state is {partisanPct} partisan / {nonpartisanPct} unaffiliated.

## zip

eyebrow: 3 · Explaining the differences
title: Each ZIP&rsquo;s equilibrium vs. its composition

Fitting a 2-state Markov chain <em>per ZIP</em> gives each ZIP a long-run partisan share. ZIP characteristics explain about half of it (R² {r2}): more Republican, higher-turnout, older ZIPs settle more partisan; ZIPs heavy on the early-voting list stay more unaffiliated.

footnoteTemplate: One point per ZIP ({nZips} with ≥1,000 transitions). Model: <code>markovchain</code> per ZIP → steady state ~ ZIP characteristics.

```json
{
  "ctas": [
    { "href": "/understanding#about", "label": "What is the Arizona Voter Project? →" },
    { "href": "/explorer", "label": "Democracy through Data →" },
    { "href": "/search", "label": "Search all geographies →" }
  ]
}
```

## download

eyebrow: Data download
title: ZIP-level transition counts (CSV)
body: Disclosure-safe, long-format counts for fitting your own Markov models — all six party buckets (DEM, REP, PND, LBT, NOL, OTH), one row per ZIP × from-party × to-party. The companion <code>zip_covariates.csv</code> adds voter-file composition plus ACS 5-year demographics allocated from census tracts: Latino/Hispanic counts and shares, race/ethnicity, education (BA+), poverty, income, housing, employment, foreign-born and Spanish-language proxies, and urban/rural density tiers. <code>zip_acs_full.csv</code> is the ACS-only wide table. ZIPs with fewer than 50 matched registrants in the window are suppressed. Currently one adjacent build pair ({window}); re-run <code>build_transitions.R</code> + <code>export_transition_downloads.py</code> to append waves when BigQuery access is available.
schemaLink: /reference/transitions-markov#downloads

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

Across {markovWaves} monthly builds (2022–2026), rows on the file grew from roughly 5.8M to 6.9M — active, inactive, and canceled registrations combined. Most month-to-month &ldquo;movement&rdquo; is affiliation toggling (to/from unaffiliated), not cross-party switching — visible in the primary-season windows below.

primarySurgeTemplate: <b>Primary affiliation surge ({from} → {to}).</b> Unaffiliated share moved {pndChange} pp. Matched-voter affiliation toggles and cross-party counts are shown only when both builds in the window are full statewide snapshots (suppressed around the Nov 2024 partial builds).

entrantCards: New registrants ({window})
entrantDemTemplate: Entrant DEM share · {skew} vs file
entrantRepTemplate: Entrant REP share · {skew} vs file
entrantAge: Entrant median age (years)
entrantInterpretTemplate: <b>New-entrant party mix.</b> {interpretation} Across {nZips} ZIPs with ≥50 entrants, mean Rep skew is {meanSkew} (entrant Rep share correlates with local file composition at r={r}).

entrantPlaceholder: <b>New-entrant party mix.</b> Stage A supports an <code>entrant</code> transition dimension (<code>build_transitions.R entrant</code>) that publishes each geography&apos;s new-registrant party counts and median age. Rebuild with BigQuery access to populate entrant skew in this section automatically.

## age

eyebrow: 6 · Age and party lean
title: Are younger voters leaning to a party?

At ZIP scale, younger registrant populations lean substantially less Republican. This pattern shows up in both static registration shares and the Markov steady-state models above — but monthly <em>switching</em> rates remain tiny for all age groups.

ageVsRep: Age vs Rep share (r across ZIPs)
ageUnder40: Mean Rep share · ZIPs with median age &lt; 40
age55Plus: Mean Rep share · ZIPs with median age ≥ 55

ageGapTemplate: Younger ZIPs average {youngPct}% Republican registration vs {oldPct}% in older ZIPs — a {gap}-point gap. The Markov steady state tilts more Republican than today&apos;s stock ({steadyRep}% steady-state Rep vs {steadyDem}% Dem), a diagnostic of switching direction — not a demographic forecast.
