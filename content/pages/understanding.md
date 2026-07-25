---
metaTitle: Understanding the Voter File · The Arizona Voter Project
---

## hero

eyebrow: Module 1 · Understanding the Voter File
title: What the voter file actually is

Arizona maintains a record of all voters in the state, known as the <strong>Arizona Voter File</strong>. It is a public record — it includes contact information and whether a registered voter votes in an election. The state records who votes, but never who one voted for. Before you analyze it, it helps to know what you&apos;re looking at: a list of <strong>registrations</strong> — one row per registrant — that the state maintains and updates continuously. Here is what a row contains, what its status labels mean, and how the whole file shifts from one build to the next.

## scale

eyebrow: Arizona voter file · row count
statEyebrow: Rows on the file · latest build
introTemplate: The state rebuilds the file roughly monthly. AVP has archived <strong>{buildCount}</strong> consecutive builds since {firstDate}. Each build is a snapshot of every row in the file — one row per registrant — as of <strong>{buildDate}</strong>.
growthTemplate: <strong>{activeTotal}</strong> active · <strong>{inactiveTotal}</strong> inactive · <strong>{canceledTotal}</strong> canceled (purged). Up <strong>{netGrowth}</strong> rows (+{growthPct}%) since the first archived build ({firstRows} → {currentRows}).

## record

eyebrow: 1 · A single record
intro: Every voter is one row. Below is a <strong>hypothetical example</strong> — made-up field values to show what a row looks like. This is not a real person from the voter file. Names and street addresses are stripped before anything enters the AVP pipeline; the stable <code>avp_id</code> replaces them so records can be linked across builds without carrying identity.
familiesIntro: The columns fall into four families. These field names come straight from the state export; only the example values above are invented for illustration.

```json
{
  "example": {
    "label": "Hypothetical example row",
    "tag": "Not a real voter",
    "note": "This is a made-up voter for illustration only. It does not correspond to any real person in the Arizona voter file. Direct identifiers (name, street address) are never published.",
    "fields": [
      ["avp_id", "avp_hypothetical_000001", "Stable pseudonymous id (name removed)"],
      ["year_of_birth", "1980", "→ age 46 at build time"],
      ["registration_party", "DEM", "Democratic Party"],
      ["registration_status", "ACTIVE", "Eligible to vote a regular ballot"],
      ["status_reason", "—", "Blank when status is Active"],
      ["county", "PIMA", "Residence county"],
      ["cd", "07", "Congressional district"],
      ["ld", "18", "Legislative district"],
      ["tract", "04019000100", "Census tract (11-digit GEOID)"],
      ["block_group", "040190001001", "Census block group"],
      ["zcta", "85701", "ZIP / ZCTA"],
      ["registration_date", "2010-06-15", "When the voter first registered"],
      ["pevl", "N", "Not on permanent early-voting list"],
      ["turnout_gen_2024", "1", "Voted in 2024 General (at polls)"],
      ["turnout_gen_2022", "0", "Did not vote in 2022 General"],
      ["turnout_gen_2020", "1", "Voted in 2020 General"],
      ["vote_method_gen_2024", "POLLING", "Early / polling / provisional"]
    ]
  },
  "families": [
    { "group": "Who", "fields": ["avp_id — stable pseudonymous id (name removed)", "year of birth → age", "party"] },
    { "group": "Where", "fields": ["residence address → congressional & legislative district", "county, census tract, block group", "ZIP / ZCTA"] },
    { "group": "Registration", "fields": ["registration date", "status (active / inactive / …)", "status reason", "permanent early-voting list"] },
    { "group": "Participation history", "fields": ["every general, primary & presidential-preference election", "vote method: early / polling / provisional"] }
  ]
}
```

## summaries

eyebrow: 2 · Statewide summaries
introTemplate: Disclosure-safe aggregates from the <strong>{buildDate}</strong> build — <strong>{fileRowsTotal}</strong> rows on the file statewide (<strong>{activeTotal}</strong> active, <strong>{inactiveTotal}</strong> inactive, <strong>{canceledTotal}</strong> canceled). Median voter age {medianAge} among active registrants; {pevlPct} on the permanent early-voting list; {turnoutPct} voted in the 2024 General.

```json
{
  "highlights": [
    ["Active", "total_active", "eligible to vote now"],
    ["Inactive", "total_inactive", "still registered, address unconfirmed"],
    ["Median age", "median_age", "years, active registrants"],
    ["On early-voting list", "pevl_share", "permanent early ballot"],
    ["2024 General turnout", "turnout_gen_2024", "among active registrants"]
  ],
  "items": [
    { "label": "Republican", "key": "total_republican", "color": "#AB0520" },
    { "label": "Democratic", "key": "total_democratic", "color": "#0C234B" },
    { "label": "Libertarian", "key": "total_libertarian", "color": "#E0A800" },
    { "label": "No Labels", "key": "total_nolabels", "color": "#378DBD" },
    { "label": "Unaffiliated", "key": "total_party_not_specified", "color": "#8FB8CE" },
    { "label": "Other party", "key": "total_other_party", "color": "#9AA7B1" }
  ]
}
```

## status

eyebrow: 3 · Active, inactive, canceled
introTemplate: &ldquo;Registered&rdquo; is not one thing. Of <strong>{rollTotal}</strong> rows on the file statewide, most are active, but a large share are inactive or already canceled (purged) — the file carries its own history.

```json
{
  "items": [
    { "label": "Active", "key": "total_active", "color": "#1E5288", "description": "On the roll and eligible to vote a regular ballot. Gets election mail." },
    { "label": "Inactive", "key": "total_inactive", "color": "#378DBD", "description": "Mail came back or an address couldn't be confirmed (mostly the federal NVRA process). Still registered — can reactivate at the polls — but flagged for confirmation." },
    { "label": "Canceled", "key": "total_canceled", "color": "#AB0520", "description": "Removed from the roll: moved away, died, a felony conviction, a voluntary request, or an administrative cleanup." }
  ]
}
```

## reasons

eyebrow: 4 · Why records are removed
intro: The raw file lists dozens of messy removal codes. We collapse them into ten plain categories — the same taxonomy the whole site uses, so a &ldquo;reason&rdquo; means the same thing everywhere. See <a href="/reference/removal-reasons">removal reason codes</a> in Methods &amp; reference for the full taxonomy and methodology.

```json
{
  "items": [
    ["Failed to respond (NVRA)", "Address-confirmation mail was returned and never answered."],
    ["Moved / residency", "Registered somewhere else, or the address is no longer valid."],
    ["Deceased", "Matched against death records."],
    ["Voter request", "The voter asked to be removed."],
    ["Administrative", "System cleanups, duplicates flagged for review, expirations."],
    ["Felony", "A disqualifying felony conviction."],
    ["Incapacitated", "A court declared the person incapacitated."],
    ["Duplicate / merge", "The same person appeared twice and the records were merged."],
    ["Citizenship / eligibility", "Citizenship or eligibility could not be confirmed."],
    ["Other", "Everything not captured above."]
  ]
}
```

## growth

eyebrow: 5 · How the file has grown
introTemplate: Each monthly build adds or removes rows as people register, move, die, or are list-maintained off the roll. Across <strong>{buildCount}</strong> archived builds from {firstDate} to {buildDate}, rows on the file grew from <strong>{firstRows}</strong> to <strong>{currentRows}</strong> — a steady expansion driven by Arizona&apos;s population growth and registration drives, with seasonal spikes before primaries. Not every row is active: canceled (purged) registrations stay in the file as history.

## builds

eyebrow: 6 · The file is never still
intro: The state rebuilds the file roughly monthly. Comparing two consecutive builds (June 1 → July 2, 2026) shows how much moves in a single month — the raw material for spotting irregularities. See <a href="/reference/build-over-build">build-over-build comparison</a> for the full methodology.

```json
{
  "stats": [
    ["Deactivated", "deactivated", "active → inactive"],
    ["Reactivated", "reactivated", "inactive → active"],
    ["Purged", "purged", "active → canceled"],
    ["Affiliation changes", "affiliation", "to / from unaffiliated"],
    ["Cross-party switches", "crossParty", "Democrat ↔ Republican"],
    ["Newly added", "added", "entered the file"],
    ["Dropped", "dropped", "left the file entirely"]
  ]
}
```

partyNote: <b>A note on party movement.</b> Most registration &ldquo;switching&rdquo; in Arizona is voters toggling in and out of <em>unaffiliated</em> (Party Not Specified), not Democrats becoming Republicans — so the two are split above. Affiliation changes swamp true cross-party switches roughly 10-to-1, and they <em>surge before a primary</em>: Arizona&rsquo;s semi-open primaries reward registering with a party to vote its ballot, so a June→July build (ahead of the July primary) shows a wave of unaffiliated voters affiliating. Genuine Democrat↔Republican switching is small and steady.

exploreLink: Explore any of these by geography in

## reference

eyebrow: Going deeper
title: Methods &amp; reference
intro: The summaries above are built from raw state data that required cleaning, classification, and privacy safeguards. For the full methodology — removal-reason taxonomy, party buckets, build-over-build linking, de-identification, field definitions, and suppression rules — see the reference section.
linkLabel: Methods &amp; reference →
linkHref: /reference

## about

eyebrow: About the Arizona Voter Project
title: What is the Arizona Voter Project?
intro: The Arizona Voter Project is a non-partisan initiative supported by the University of Arizona&rsquo;s School of Government and Public Policy. It provides tools and analysis to better capture the political, social, and cultural richness of the Arizona electorate — developing resources to access, experiment, and interact with data so everyone can learn more about politics and communities within the state. A short scroll-through introduction walks through Arizona&rsquo;s voter file from counties to congressional districts, with links to the full explorer.
linkLabel: What is the Arizona Voter Project? →
