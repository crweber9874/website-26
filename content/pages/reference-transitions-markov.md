---
metaTitle: Transitions & the Markov model · Reference · AVP
metaDescription: How AVP measures party registration switching across consecutive voter file builds using a Markov chain model.
---

## hero

eyebrow: Reference · Methodology
title: Transitions &amp; the Markov model

Party registration is not static — voters affiliate, de-affiliate, and occasionally switch between major parties. AVP measures this movement by linking the same pseudonymous registrant across consecutive monthly builds and fitting a <strong>Markov chain</strong> to the observed one-step transitions. The party-transitions module visualizes the results; this page explains what the model includes, what it excludes, and how to read it.

## what_counts

eyebrow: What counts as a transition
title: One-step, adjacent builds only

A transition is a party-bucket change between two <em>consecutive</em> archived builds for the same <code>avp_id</code>. If a voter is Republican in May, unaffiliated in June, and Democratic in July, that is two transitions (REP→PND, then PND→DEM) — not a single REP→DEM jump.

Records that leave the file entirely (purged, merged, moved out of state) are excluded from the transition matrix. New registrations entering the file are also excluded. The Markov model describes switching behavior among <strong>persisting registrants</strong> — people who remain on the file from one month to the next.

This closed-world assumption is deliberate. Including entries and exits would conflate list maintenance with party preference change. The build-over-build module tracks churn separately.

## matrix

eyebrow: The transition matrix
title: Reading P(next party | current party)

The transition matrix <em>P</em> has six rows and six columns — one per party bucket. Cell <em>P<sub>ij</sub></em> is the probability that a registrant in bucket <em>i</em> this month will be in bucket <em>j</em> next month, estimated from all observed one-step transitions across 38 archived builds (May 2022 – July 2026).

The diagonal dominates: most registrants stay in the same bucket month to month. Off-diagonal cells are small but directional — they reveal whether net movement favors one party, or flows toward unaffiliated status.

The matrix is row-stochastic: each row sums to 1.0. Estimation uses the <code>markovchain</code> R package on the full set of voter-month transition events (millions of rows, aggregated for publication).

## steady_state

eyebrow: Steady state
title: What long-run equilibrium means (and does not mean)

The stationary distribution of the chain — computed as the left eigenvector of <em>P</em> — describes where registration <em>would settle if these monthly switching rates held fixed forever</em>. It is a diagnostic of the direction and magnitude of switching, <strong>not a forecast</strong> of future Arizona electorate composition.

The steady state ignores:

New registrations (which add hundreds of thousands of rows over the study period).

Deaths, purges, and out-of-migration (which remove rows).

Population growth and demographic change.

Arizona&rsquo;s semi-open primary system (which creates seasonal affiliation spikes that the monthly matrix averages over).

When the steady state shows more Republican registration than today&rsquo;s snapshot, it means the observed switching rates net favor Republican retention over the study window — not that Arizona is trending Republican in an electoral sense.

## sankey

eyebrow: Sankey flows
title: How the flow diagram relates to the matrix

The Sankey diagram in the party module shows <b>expected switchers only</b> (stayers omitted). A statewide continuous-time generator <code>Q</code> is fit by panel MLE across all irregular windows; any horizon uses <code>P(t)=expm(Q·t)</code>. Local party stocks come from the selected geography, so ribbons are expected movers over the chosen 1–24 month horizon — not a discrete matrix power <code>P<sup>k</sup></code>. Fitted quantities and precomputed <code>P(t)</code> live in <code>/data/party/ct_markov.json</code> (from <code>analysis/ct_markov_intro.qmd</code>).

## zip_models

eyebrow: ZIP-level models
title: Local variation in switching dynamics

Beyond the statewide matrix, AVP fits a separate two-state (partisan vs. unaffiliated) Markov chain for each ZIP code with sufficient transition volume (≥1,000 transitions). Each ZIP&rsquo;s steady-state partisan share can then be compared to its current composition and modeled against ZIP characteristics (age, turnout history, PEVL share, Republican registration share).

These ZIP-level models explain roughly half the variation in local equilibrium (R² ≈ 0.5). Higher-turnout, older, more Republican ZIPs settle at a more partisan steady state; ZIPs with heavy permanent early-voting-list enrollment stay more unaffiliated.

## downloads

eyebrow: Downloadable data
title: Long-format transition CSVs

Analysts can download disclosure-safe transition counts from the party module or directly from <code>/data/transitions/downloads/</code>. Files are regenerated by <code>python3 pipeline/export_transition_downloads.py</code> after Stage A publishes new transition summaries.

### zip_party_flows.csv

One row per ZIP, window, and party-bucket pair, across <strong>all 36 consecutive snapshot pairs</strong> (Jan 2022 – Jul 2026) — the full wave-to-wave panel, not just the newest window. Suitable for estimating ZIP-specific transition matrices, latent switching-regime models, or pooling across geographies. Cells with <code>n = 0</code> are omitted (structural zeros).

| Column | Description |
|---|---|
| <code>geography</code> | Always <code>ZIP</code> |
| <code>zip</code> | Five-digit Arizona ZIP code |
| <code>file_date</code> | Current (end) build date of the window |
| <code>window_start</code> / <code>window_end</code> | Adjacent archived builds compared |
| <code>window</code> | Combined interval, e.g. <code>2026-06-01..2026-07-02</code> |
| <code>window_days</code> | Days between the two builds (<strong>7–183</strong>; rates are not comparable across windows without time-scaling — use a continuous-time generator) |
| <code>from_party</code> / <code>to_party</code> | Party bucket at prior vs current build |
| <code>n</code> | Count of matched registrants making this transition |
| <code>from_n</code> | Row total (registrants in <code>from_party</code> at prior build) |
| <code>rate</code> | <code>n / from_n</code> (one-step probability for that ZIP-window) |
| <code>zip_matched_n</code> | Total matched registrants in the ZIP-window (suppression denominator) |

Party buckets: DEM, REP, PND (unaffiliated), LBT, NOL (No Labels), OTH. Only persisting registrants — new entries and file exits are excluded (see entrant/churn dimensions). The partial <code>2024-11-04</code> build is skipped, so 2024-11-01 chains directly to 2024-12-05.

Rebuild from BigQuery with <code>python3 pipeline/build_zip_flow_panel.py</code> (all consecutive pairs from <code>AVP_ANALYTICS.party_panel</code>; ~$0.09). A worked continuous-time / hidden-Markov analysis of this panel lives in <code>analysis/party_transitions_markov.qmd</code>.

**Privacy:** ZIPs with fewer than 50 matched registrants in a window are omitted entirely. Individual voters are never included.

### zip_covariates.csv

One row per published ZIP window with voter-file composition (party shares, median registrant age, 2024 general turnout, PEVL share) plus **ACS 5-year demographics** from census tracts. ACS counts and medians are allocated to ZCTA using the Census 2020 ZCTA–tract overlap file, then joined to USPS ZIP where the five-digit code matches ZCTA (see manifest <code>acs_source</code>). PO-box and unique USPS ZIPs without a ZCTA match have null ACS fields.

| Column group | Examples |
|---|---|
| Keys | <code>zip</code>, <code>file_date</code>, <code>window</code>, <code>zip_matched_n</code> |
| Voter file | <code>party_share_*</code>, <code>voter_median_age</code>, <code>turnout_gen_2024</code>, <code>pevl_share</code>, <code>total_registered</code> |
| Latino / immigration | <code>latino</code>, <code>latino_share</code>, <code>foreign_born</code>, <code>foreign_born_share</code>, <code>spanish_limited_english</code>, <code>spanish_limited_english_share</code> |
| Race / ethnicity counts | <code>total_population</code>, <code>non_latino_white</code>, <code>white_alone</code>, <code>black_alone</code>, <code>american_indian_alone</code>, <code>asian_alone</code>, … |
| Race / ethnicity shares | <code>non_latino_white_share</code>, <code>white_alone_share</code>, … (÷ <code>total_population</code>) |
| Age structure | <code>median_age</code>, <code>under_18</code>, <code>under_18_share</code>, <code>age_65_plus</code>, <code>age_65_plus_share</code> |
| Income &amp; poverty | <code>median_household_income</code>, <code>gini_index</code>, <code>poverty_rate</code>, <code>below_poverty</code> |
| Education | <code>bachelors_plus</code>, <code>bachelors_plus_share</code> (BA+ ÷ pop 25+) |
| Housing | <code>housing_units</code>, <code>owner_occupied_share</code>, <code>renter_occupied_share</code>, <code>median_gross_rent</code>, <code>housing_density</code> |
| Employment | <code>unemployment_rate</code>, <code>in_labor_force</code>, <code>unemployed</code> |
| Urban / rural | <code>land_area_sq_mi</code>, <code>population_density</code>, <code>density_tier</code> (<code>urban</code> ≥1000/sq mi, <code>suburban</code> 100–999, <code>rural</code> &lt;100), <code>metro_proxy</code> (density ≥500) |

ACS fields come from <code>pipeline/ref/tract_acs_extended.csv</code> (tidycensus ACS 5-year 2018–2022). Regenerate with <code>Rscript pipeline/r/fetch_tract_acs_extended.R</code> when refreshing the Census pull. USDA RUCA codes are not bundled; density tiers serve as the urban/rural proxy.

### zip_acs_full.csv

ACS-only wide table: one row per ZCTA-matched five-digit ZIP (deduplicated). Same ACS columns as <code>zip_covariates.csv</code> without voter-file fields or window keys.

### statewide_markov_flows.csv

Statewide pooled counts matching the six-state Markov matrix on <code>/party</code> (38 adjacent monthly pairs, May 2022 – July 2026). Not ZIP-disaggregated.

### manifest.json

Row counts, column lists, generation timestamp, the list of 36 windows, the excluded partial build, and the flows source (BigQuery panel vs single window).

## related

eyebrow: Related
title: Continue reading

```json
{
  "links": [
    { "href": "/party", "label": "Party transitions dashboard →" },
    { "href": "/reference/party-buckets", "label": "Party registration buckets →" },
    { "href": "/reference/build-over-build", "label": "Build-over-build comparison →" }
  ]
}
```
