## steps

```json
[
  {
    "id": "state",
    "geo": "county",
    "variable": "party_share_dem",
    "label": "Arizona · 15 counties",
    "kicker": "The Arizona Voter File",
    "title": "The voter file, made legible",
    "introCard": true,
    "paras": [
      "The Arizona Voter File is a public record: who is registered, where they live, and whether they voted — never who they voted for. The Arizona Voter Project joins it with U.S. Census and other federal data, then publishes only disclosure-safe aggregates.",
      "This scroll is one path through that file — starting with all 15 counties, then congressional districts, legislative districts, and neighborhood-scale ZIP areas. Each map step shades the same measure (Democratic registration share among active voters) so you can compare geographies at a glance."
    ]
  },
  {
    "id": "counties",
    "geo": "county",
    "variable": "party_share_dem",
    "label": "15 counties",
    "kicker": "15 Counties",
    "title": "A fast-growing, diverging state",
    "extra": "reg-state",
    "paras": [
      "Arizona is expanding and diversifying quickly. Latinos now make up roughly a third of the population, and the state has one of the largest American Indian populations in the country — the Navajo Nation, larger in area than West Virginia, spans the northeast.",
      "Population is overwhelmingly concentrated: Phoenix is the fifth-largest city in the U.S. and Maricopa the fifth-largest county, holding a majority of the state&rsquo;s voters, while much of the rest is rural. Statewide, registered independents now rival registered Republicans as the largest bloc among active voters."
    ]
  },
  {
    "id": "cd",
    "geo": "cd",
    "variable": "party_share_dem",
    "label": "9 congressional districts",
    "kicker": "9 Congressional Districts",
    "title": "Drawn by an independent commission",
    "extra": "reg-cd6",
    "paras": [
      "Arizona is one of eleven states that draws congressional lines through an independent redistricting commission, created by Proposition 106 in 2000. It seats two Republicans, two Democrats, and a fifth independent who chairs it.",
      "The result is real variation. CD 9 and CD 5 lean Republican; CD 3 and CD 7 lean Democratic. CD 6 is the knife&rsquo;s edge — competitive at the presidential level, with a large independent share."
    ]
  },
  {
    "id": "ld",
    "geo": "ld",
    "variable": "party_share_dem",
    "label": "30 legislative districts",
    "kicker": "30 Legislative Districts",
    "title": "Thirty districts, two chambers",
    "extra": "reg-ld",
    "paras": [
      "Arizona&rsquo;s 30 legislative districts are drawn by the same commission. Each district elects one state senator and two state House members — the same 30 boundaries structure both chambers.",
      "Republicans have held the legislature for decades, but margins have narrowed as the state turned competitive — Biden (2020), Kelly, Hobbs (2022), and Gallego (2024) all won statewide."
    ]
  },
  {
    "id": "zcta",
    "geo": "zcta",
    "variable": "party_share_dem",
    "label": "ZIP areas (ZCTA)",
    "kicker": "ZIP areas & finer geographies",
    "title": "Down to the neighborhood",
    "paras": [
      "Below districts the file resolves to neighborhood scale. Addresses are geocoded and assigned to census tracts, block groups, and ZIP Code Tabulation Areas — the Census&rsquo;s areal stand-in for ZIP codes.",
      "Individual records are never published. Each ZIP area here is shaded by Democratic registration share among active voters — fine enough to see neighborhoods diverge inside a single district."
    ]
  },
  {
    "id": "scatter",
    "geo": "zcta",
    "variable": "party_share_dem",
    "label": "Census tracts · active voters",
    "extra": "scatter",
    "kicker": "Active registrants",
    "title": "How do active voters compare?",
    "paras": [
      "Among active registrants only, registration, participation, and age don&rsquo;t vary independently. Pick any two measures below — each dot is a census tract, colored blue or red by which party leads locally."
    ]
  },
  {
    "id": "avp",
    "geo": "zcta",
    "variable": "party_share_dem",
    "label": "What AVP analyzes",
    "extra": "avp-links",
    "kicker": "Go deeper",
    "title": "From this tour to full analysis",
    "paras": [
      "This scroll is an overview. The Arizona Voter Project links voter-file trends, the Arizona Voter Survey, certified election returns, and overlap analysis across party and demographics. Each module lets you inspect, compare, and test hypotheses on your own.",
      "Important findings from the file: independents are now the largest registration bloc statewide; Maricopa County holds a majority of Arizona&rsquo;s voters; turnout and party composition vary sharply by geography and age."
    ]
  },
  {
    "id": "app",
    "geo": "cd",
    "variable": "party_share_dem",
    "label": "Explore it yourself",
    "extra": "app",
    "kicker": "The full tool",
    "title": "Now explore it yourself",
    "paras": [
      "The interactive explorer lets you switch geography, color by dozens of measures — registration, roll status, participation, Census — and click any unit for its complete profile. Search indexes every unit and measure."
    ]
  }
]
```

## ui

mapCaptionSuffix: · shaded by Democratic registration share (active voters)
scatterLoading: Loading census tracts…
scatterScrollHint: Scroll to load…
regChartOuterLabel: Arizona statewide
regChartCountyLabel: Selected county compared with statewide registration
regChartDistrictLabel: Selected district compared with statewide registration
regChartLdLabel: Selected legislative district compared with statewide registration

```json
{
  "avpLinks": [
    { "href": "/understanding", "label": "Understanding the voter file →" },
    { "href": "/explorer", "label": "Map explorer →", "primary": true },
    { "href": "/party", "label": "Party & status transitions →" },
    { "href": "/opinion", "label": "Public opinion →" },
    { "href": "/agree", "label": "Common Ground analysis →" },
    { "href": "/voting", "label": "Election returns →" },
    { "href": "/reference", "label": "Methods & reference →" }
  ],
  "appLinks": [
    { "href": "/explorer", "label": "Open the interactive map →", "primary": true },
    { "href": "/search", "label": "Search every unit →" }
  ]
}
```
