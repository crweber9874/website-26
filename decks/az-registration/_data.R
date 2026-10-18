## Registration data for the deck, read from the published AVP artifacts.
##
## Artifacts are stored gzip-framed under a plain .json name with no Content-Encoding
## header, so the payload is sniffed by magic number rather than trusted from the
## extension. A local cache keeps a render working offline and keeps repeated renders
## off the network.

suppressPackageStartupMessages({
  library(dplyr)
  library(tidyr)
  library(purrr)
  library(jsonlite)
})

AVP_BASE <- "https://avp-data.pages.dev/"

## The geographies the download and explorer modules publish.
AZ_LEVELS <- c(
  county = "County",
  cd     = "Congressional district",
  ld     = "Legislative district",
  zcta   = "ZIP code"
)

read_avp <- function(path, cache_dir = "_cache") {
  dir.create(cache_dir, showWarnings = FALSE, recursive = TRUE)
  cache <- file.path(cache_dir, gsub("/", "_", path))

  raw <- tryCatch({
    con <- url(paste0(AVP_BASE, path), open = "rb")
    on.exit(close(con), add = TRUE)
    r <- readBin(con, "raw", 80e6)
    writeBin(r, cache)
    r
  }, error = function(e) {
    if (!file.exists(cache)) stop("cannot reach ", path, " and no cache: ", conditionMessage(e))
    message("  using cached ", basename(cache))
    readBin(cache, "raw", file.size(cache))
  })

  txt <- if (identical(raw[1:2], as.raw(c(0x1f, 0x8b)))) {
    memDecompress(raw, "gzip", asChar = TRUE)
  } else {
    rawToChar(raw)
  }
  fromJSON(txt)
}

## Tidy one geography.
##
## Party counts in the artifact cover ACTIVE registrants and sum to total_active, so
## shares use that base — the same denominator the project's own party_share_* measures
## use. Dividing by total_registered would understate every party by the inactive share.
##
## "Neither" is 100 - D - R rather than party_not_specified. County recorders disagree on
## where an independent belongs: Yavapai files them under "other party" (25% OTH against
## 4% PND), so only the collapsed share is comparable across units.
az_units <- function(level = "county") {
  lv <- level  # the mutate below creates a `level` column that would shadow this
  wide <- read_avp(sprintf("data/%s/summary.json", level)) |>
    as_tibble() |>
    filter(variable %in% c(
      "total_registered", "total_active", "total_democratic", "total_republican"
    )) |>
    select(geoid, file_date, variable, value) |>
    pivot_wider(names_from = variable, values_from = value)

  wide |>
    mutate(
      level      = level,
      level_name = unname(AZ_LEVELS[level]),
      unit       = pretty_unit(geoid, lv),
      base       = coalesce(total_active, total_registered),
      democratic = 100 * total_democratic / base,
      republican = 100 * total_republican / base,
      neither    = 100 - democratic - republican,
      lean       = republican - democratic
    ) |>
    filter(base > 0) |>
    select(level, level_name, unit, geoid, file_date,
           registered = base, active = base,
           dem_n = total_democratic, rep_n = total_republican,
           democratic, republican, neither, lean) |>
    arrange(desc(registered))
}

## Every geography at once, stacked.
az_all_levels <- function(levels = names(AZ_LEVELS)) {
  map_dfr(levels, az_units) |>
    mutate(level_name = factor(level_name, levels = unname(AZ_LEVELS[levels])))
}

pretty_unit <- function(geoid, level) {
  tail <- sub("^AZ-[A-Z]+-", "", geoid)
  switch(level,
    county = tools::toTitleCase(tolower(recode(tail,
               SANTACRUZ = "santa cruz", LAPAZ = "la paz"))),
    cd     = paste("CD", as.integer(tail)),
    ld     = paste("LD", as.integer(tail)),
    zcta   = tail,
    tail
  )
}

## Statewide composition of "Neither" (= not D, not R). County recorders disagree
## on where independents belong (see note above az_units), so this subdivision is
## only reported statewide, where the differences wash out.
az_neither_mix <- function(level = "county") {
  parts <- c("total_libertarian", "total_nolabels",
             "total_other_party", "total_party_not_specified")
  d <- read_avp(sprintf("data/%s/summary.json", level)) |>
    as_tibble() |>
    filter(variable %in% c("total_active", "total_registered",
                           "total_democratic", "total_republican", parts)) |>
    group_by(variable) |>
    summarise(value = sum(value, na.rm = TRUE), .groups = "drop") |>
    tibble::deframe()
  base <- unname(if (!is.na(d["total_active"])) d["total_active"] else d["total_registered"])
  neither_n <- base - d[["total_democratic"]] - d[["total_republican"]]
  tibble::tibble(
    component = c("Libertarian", "No Labels", "Other party", "Party not specified"),
    n         = unname(d[parts]),
    pct_of_neither = 100 * unname(d[parts]) / neither_n,
    pct_of_active  = 100 * unname(d[parts]) / base
  ) |>
    arrange(desc(n))
}

## Statewide totals, from counts rather than averaged shares.
az_statewide <- function(units) {
  units |>
    summarise(
      file_date = first(file_date),
      registered = sum(registered), active = sum(active),
      dem_n = sum(dem_n), rep_n = sum(rep_n)
    ) |>
    mutate(
      democratic = 100 * dem_n / active,
      republican = 100 * rep_n / active,
      neither    = 100 - democratic - republican
    )
}

## Spread of each share within a geography — the point of the variation slides.
az_spread <- function(units) {
  units |>
    select(level_name, unit, Democratic = democratic,
           `Neither party` = neither, Republican = republican) |>
    pivot_longer(-c(level_name, unit), names_to = "group", values_to = "share") |>
    group_by(level_name, group) |>
    summarise(
      mean = mean(share), sd = sd(share),
      min = min(share), max = max(share), range = max(share) - min(share),
      lo_unit = unit[which.min(share)], hi_unit = unit[which.max(share)],
      .groups = "drop"
    ) |>
    mutate(group = factor(group, levels = names(AVP_COL)))
}

## Shared look.
AVP_COL <- c(Democratic = "#1E5288", `Neither party` = "#3B1A66", Republican = "#AB0520")

theme_avp <- function(base_size = 15) {
  # No base_family: Lato is a webfont for the slides, not installed on the machine
  # that renders the plots. Naming it silently drops every piece of text in the
  # figure (titles, axes, geom_text) with only a warning.
  ggplot2::theme_minimal(base_size = base_size) +
    ggplot2::theme(
      panel.grid.minor    = ggplot2::element_blank(),
      panel.grid.major.y  = ggplot2::element_blank(),
      plot.title.position = "plot",
      plot.title    = ggplot2::element_text(colour = "#1F3864", face = "plain"),
      plot.subtitle = ggplot2::element_text(colour = "#4A5568"),
      plot.caption  = ggplot2::element_text(colour = "#6A7179", hjust = 0),
      axis.title    = ggplot2::element_text(colour = "#4A5568"),
      strip.text    = ggplot2::element_text(colour = "#1F3864"),
      legend.position = "top",
      legend.title  = ggplot2::element_blank()
    )
}

## ---- registration over time ------------------------------------------------
## The versioned snapshots behind the Data Download build selector. One file per
## (build, geography); county is enough for a statewide trend.
AZ_BUILDS <- c(
  "2024-06-03", "2024-07-02", "2024-09-17", "2024-12-05",
  "2025-09-03", "2025-10-01", "2025-11-03", "2025-12-01",
  "2026-01-05", "2026-02-02", "2026-03-02", "2026-04-01",
  "2026-05-01", "2026-06-01", "2026-07-02", "2026-08-07"
)

az_trend <- function(builds = AZ_BUILDS) {
  map_dfr(builds, function(b) {
    path <- sprintf("data/v001_%s/county/summary.json", b)
    out <- tryCatch(read_avp(path), error = function(e) NULL)
    if (is.null(out)) return(NULL)
    out |>
      as_tibble() |>
      filter(variable %in% c("total_active", "total_registered",
                             "total_democratic", "total_republican")) |>
      select(geoid, variable, value) |>
      pivot_wider(names_from = variable, values_from = value) |>
      summarise(
        active = sum(coalesce(total_active, total_registered)),
        dem_n  = sum(total_democratic),
        rep_n  = sum(total_republican)
      ) |>
      mutate(build = as.Date(b))
  }) |>
    mutate(
      Democratic      = 100 * dem_n / active,
      Republican      = 100 * rep_n / active,
      `Neither party` = 100 - Democratic - Republican
    ) |>
    arrange(build)
}

## One geography unit's own trend across builds — generalises az_trend() (which sums
## every county into a state total) down to a single geoid, e.g. one congressional
## district. Same builds, same per-build artifact, just not summed across units first.
az_unit_trend <- function(geo, geoid, builds = AZ_BUILDS) {
  map_dfr(builds, function(b) {
    path <- sprintf("data/v001_%s/%s/summary.json", b, geo)
    out <- tryCatch(read_avp(path), error = function(e) NULL)
    if (is.null(out)) return(NULL)
    out |>
      as_tibble() |>
      filter(geoid == !!geoid,
             variable %in% c("total_active", "total_registered",
                             "total_democratic", "total_republican")) |>
      select(variable, value) |>
      pivot_wider(names_from = variable, values_from = value) |>
      transmute(
        build  = as.Date(b),
        active = coalesce(total_active, total_registered),
        dem_n  = total_democratic,
        rep_n  = total_republican
      )
  }) |>
    mutate(
      Democratic      = 100 * dem_n / active,
      Republican      = 100 * rep_n / active,
      `Neither party` = 100 - Democratic - Republican
    ) |>
    arrange(build)
}

## ---- early voting ----------------------------------------------------------
## Module 5's artifact: enrollment on the Active Early Voting List per build, and
## ballots cast early per (build, election).
az_early <- function() {
  m <- read_avp("data/m5/m5_mailin.json")

  lst <- as_tibble(m$rows$list) |> filter(level == "state")
  newest <- max(lst$period)
  enrol <- lst |>
    filter(period == newest) |>
    summarise(build = newest, share = 100 * sum(hits) / sum(n), n = sum(n))

  cast <- as_tibble(m$rows$buildCast) |> filter(level == "state")
  nb <- max(cast$build)
  by_party <- cast |>
    filter(build == nb) |>
    mutate(share = 100 * share) |>
    select(period, party, share, n)

  overall <- cast |>
    filter(build == nb) |>
    group_by(period) |>
    summarise(share = 100 * sum(hits) / sum(n), n = sum(n), .groups = "drop")

  list(enrolment = enrol, by_party = by_party, overall = overall, build = nb)
}

## ---- midterm turnout -------------------------------------------------------
## Not derivable from any published artifact: computed in BigQuery against
## analytics-avp.AVP_ANALYTICS.geo_base_2026_08_07, active registrants. Pinned here
## with its own stamp. Regenerate with the query in
## avp-web-widgets/drafts/2026-midterm-qa.md.
TURNOUT_BUILD <- "2026-08-07"

az_turnout_party <- function() tibble::tribble(
  ~group,         ~presidential, ~midterm,
  "Republican",            82.3,     62.2,
  "Democratic",            78.4,     60.0,
  "Unaffiliated",          59.1,     36.9,
  "Minor parties",         57.9,     34.7
) |> mutate(drop = presidential - midterm)

az_turnout_age <- function() tibble::tribble(
  ~group,   ~presidential, ~midterm,
  "18-29",           50.0,     19.1,
  "30-44",           64.5,     37.7,
  "45-64",           78.2,     58.5,
  "65+",             86.8,     76.6
) |> mutate(drop = presidential - midterm)

## ---- boundaries ------------------------------------------------------------
## Published tiles, joined to the registration table on `geoid`.
az_tiles <- function(level) {
  path  <- sprintf("tiles/%s.geojson", level)
  plain <- file.path("_cache", sprintf("plain_%s.geojson", level))
  if (!file.exists(plain)) {
    # read_avp returns parsed JSON; re-serialising would be lossy for geometry, so
    # fetch the bytes again here and write the DECOMPRESSED text for sf to open.
    cache <- file.path("_cache", gsub("/", "_", path))
    if (!file.exists(cache)) invisible(read_avp(path))
    raw <- readBin(cache, "raw", file.size(cache))
    txt <- if (identical(raw[1:2], as.raw(c(0x1f, 0x8b)))) {
      memDecompress(raw, "gzip", asChar = TRUE)
    } else rawToChar(raw)
    writeLines(txt, plain, useBytes = TRUE)
  }
  sf::read_sf(plain)
}

## Registration joined to geometry, ready to map.
az_map_data <- function(level) {
  tiles <- az_tiles(level)
  dat   <- az_units(level)
  dplyr::left_join(tiles, dat, by = "geoid") |>
    dplyr::filter(!is.na(active))
}

## ---- early voting, by unit --------------------------------------------------
## Share of each party's ballots cast early, for one election, at one geography.
az_early_units <- function(level = "county", period = "2026-07-21") {
  m <- read_avp("data/m5/m5_mailin.json")
  cast <- as_tibble(m$rows$buildCast)
  nb <- max(cast$build)
  cast |>
    filter(level == !!level, period == !!period, build == nb, !is.na(share)) |>
    mutate(unit = unit |>
             sub("^Congressional District ", "CD ", x = _) |>
             sub("^Legislative District ", "LD ", x = _),
           share = 100 * share,
           party = factor(party, c("Democratic", "Republican", "Other"))) |>
    select(unit, party, share, n) |>
    arrange(unit, party)
}

## CD trend: one unit (e.g. CD 6) across every published build.
az_cd_trend <- function(unit_geoid = "AZ-CD-06", builds = AZ_BUILDS) {
  purrr::map_dfr(builds, function(b) {
    path <- sprintf("data/v001_%s/cd/summary.json", b)
    rows <- tryCatch(read_avp(path), error = function(e) NULL)
    if (is.null(rows)) return(NULL)
    tibble::as_tibble(rows) |>
      dplyr::filter(geoid == unit_geoid,
                    variable %in% c("total_registered", "total_active",
                                    "total_democratic", "total_republican")) |>
      dplyr::select(variable, value) |>
      tidyr::pivot_wider(names_from = variable, values_from = value) |>
      dplyr::mutate(build = as.Date(b),
                    active = dplyr::coalesce(total_active, total_registered),
                    neither_n = active - total_democratic - total_republican,
                    pct_dem = 100 * total_democratic / active,
                    pct_rep = 100 * total_republican / active,
                    pct_neither = 100 - pct_dem - pct_rep)
  }) |>
    dplyr::arrange(build)
}

## Arizona citizen voting-age population (CVAP: citizens 18+) from the Census Bureau's
## ACS 1-year estimates, table B29001, latest vintage published. This is the same series
## the EAC's EAVS report uses (its 2023 value, 5,384,019, matches B29001 for 2023).
## Fetched with tidycensus (needs CENSUS_API_KEY) and cached so renders work offline.
az_vap <- function(year = 2024, cache_dir = "_cache") {
  cache <- file.path(cache_dir, sprintf("census_cvap_az_%d.rds", year))
  if (file.exists(cache)) return(readRDS(cache))
  est <- tidycensus::get_acs("state", variables = "B29001_001", state = "AZ",
                             year = year, survey = "acs1", progress_bar = FALSE)
  out <- list(year = year, vap = est$estimate)
  dir.create(cache_dir, showWarnings = FALSE, recursive = TRUE)
  saveRDS(out, cache)
  out
}

## Statewide active registrants as a share of citizen voting-age population, per build.
az_registration_rate <- function(builds = AZ_BUILDS) {
  v <- az_vap()
  map_dfr(builds, function(b) {
    out <- tryCatch(read_avp(sprintf("data/v001_%s/county/summary.json", b)),
                    error = function(e) NULL)
    if (is.null(out)) return(NULL)
    out |>
      as_tibble() |>
      filter(variable %in% c("total_active", "total_registered", "turnout_gen_2024")) |>
      select(geoid, variable, value) |>
      pivot_wider(names_from = variable, values_from = value) |>
      mutate(act = coalesce(total_active, total_registered)) |>
      # 2024 general turnout share from the build, weighted by each county's active registrants
      summarise(active = sum(act),
                turnout24 = 100 * sum(turnout_gen_2024 * act) / sum(act)) |>
      mutate(build = as.Date(b))
  }) |>
    mutate(vap = v$vap, vap_year = v$year, rate = 100 * active / vap) |>
    arrange(build)
}

## 2024 general election, official statewide totals. Source: Arizona Secretary of State,
## "2024 General Election Official Canvass" (signed 2024-11-22), page 1:
## https://apps.azsos.gov/election/2024/ge/canvass/20241105_GeneralCanvass_Signed.pdf
## The PDF is a scan, so these are pinned by hand.
AZ_2024_CANVASS <- list(ballots_cast = 3428011, eligible_registration = 4367593,
                        turnout_registered = 78.49)
