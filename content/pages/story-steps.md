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
      "Arizona&rsquo;s public voter file records who is registered, where they live, and whether they voted — never who they voted for. The Arizona Voter Project joins it with Census data and publishes only disclosure-safe aggregates.",
      "This short tour starts with all 15 counties, then Arizona&rsquo;s nine congressional districts. Every map shades Democratic registration share among active voters."
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
      "Most voters live in Maricopa County; much of the rest of the state is rural. Independents now rival Republicans as the largest registration bloc among active voters."
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
      "An independent commission draws Arizona&rsquo;s nine districts. Some lean hard; CD 6 sits on the knife&rsquo;s edge — competitive, with a large independent share."
    ]
  }
]
```

## ui

mapCaptionSuffix: · shaded by Democratic registration share (active voters)
regChartOuterLabel: Arizona statewide
regChartCountyLabel: Selected county compared with statewide registration
regChartDistrictLabel: Selected district compared with statewide registration

```json
{
  "appLinks": [
    { "href": "/voter/explorer", "label": "Open the interactive map →", "primary": true }
  ]
}
```
