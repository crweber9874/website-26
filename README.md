# christopher-weber.com

Personal academic site for **Christopher R. Weber** — Professor of Political
Science, University of Arizona; Director, The Arizona Voter Project.

Built on **Astro 7** with the
[Astro Scholar](https://github.com/mychiffonn/astro-scholar) theme (Apache-2.0 —
see `THEME-LICENSE`), native CSS, and **React islands** for the Arizona Voter
Project dashboards, which are ported from the `avp-web-modules` repo as native
React components (not iframed).

## Sections

| Route | What it is |
|---|---|
| `/` | Profile, career highlights, latest updates, selected publications |
| `/publications` | Full publication list from `src/content/publications/main.bib`, with abstracts and keyword filters |
| `/projects` | Research programs (The Arizona Voter Project) + tech stack |
| `/voter` | Arizona Voter Project hub → launches the native dashboards |
| `/voter/story` | Guided tour through the voter file |
| `/voter/understanding` | The voter file: growth, churn, build-over-build |
| `/voter/explorer` | Choropleth explorer across six geographies (MapLibre) |
| `/voter/party` | Party-transition Markov model + Sankey |
| `/voter/opinion` | Arizona Voter Survey (affect, tolerance, norms) |
| `/voter/agreement` | Overlapping-coefficient "common ground" tool |
| `/voter/voting` | Certified precinct returns, 2022 & 2024 |
| `/teaching` | POL 682 & POL 683 course readers with their companion texts |
| `/teaching/pol682/` | Linear Regression Analysis (Quarto book) |
| `/teaching/pol683/` | Advanced Regression & Causal Inference (Quarto book) |
| `/cv` | Appointments, education, honors, service, works in progress, full publication list |
| `/now` | Current work |
| `/blog` | Empty until the first post lands in `src/content/blog/` |

## Develop

Requires **Node ≥ 22.12** and **pnpm**.

```bash
pnpm install
pnpm dev            # http://localhost:4321
pnpm build          # static output -> dist/
pnpm preview
pnpm astro check    # types
pnpm generate:social # regenerate the OG card + placeholder avatar
pnpm sync:readers   # pull the rendered course readers from methodology_ground_up
```

Astro telemetry is disabled in CI via `ASTRO_TELEMETRY_DISABLED=1`; set it
locally too if your machine blocks writes to `~/Library/Preferences`.

## Teaching readers (POL 682 & POL 683)

**The books are no longer authored in this repo.** They live in
[crweber9874/methodology_ground_up](https://github.com/crweber9874/methodology_ground_up),
the shared graduate-methodology hub maintained with Chad Westerland. This site
only *publishes* them.

| Course | Source (in the hub) | Published path |
|--------|---------------------|----------------|
| POL 682 | `readers/weber/linear-regression/` (Quarto) | `/teaching/pol682/` |
| POL 683 | `readers/weber/advanced-regression/` (Quarto, converted from bookdown) | `/teaching/pol683/` |

**Workflow when a book changes**

1. Edit and render in the hub repo (`scripts/render-readers.sh weber/<slug>`).
2. Here, run `pnpm sync:readers` — it copies the rendered books into
   `public/teaching/` and re-injects the back-to-site bar. Add `--render` to
   render in the hub first (needs [Quarto](https://quarto.org) and R/`renv`).
3. Commit the updated HTML under `public/teaching/`.
4. Push — GitHub Actions deploys the Astro site (including the books).

The sync assumes the hub is cloned beside this repo; override with
`HUB=/path/to/methodology_ground_up pnpm sync:readers`. Only
`public/teaching/**` is the deployable artifact, and nothing under it should be
hand-edited — a sync overwrites it.

The legacy `teaching/pol682/` and `teaching/pol683/` source trees in this repo
are superseded by the hub and can be deleted once you are satisfied the hub
copies are complete.

### Retiring advancedregression.com (Netlify)

The POL 683 book previously lived at `advancedregression.com` on Netlify. It now
lives at `https://christopher-weber.com/teaching/pol683/`.

1. At your DNS / Netlify host, set up a **301 redirect** from
   `advancedregression.com` (and `www`) → `https://christopher-weber.com/teaching/pol683/`.
2. Disable or delete the Netlify site for `advancedRegression_text` once the
   redirect is confirmed.
3. Do **not** attach `advancedregression.com` as a second GitHub Pages custom
   domain on this repo (Pages supports one primary custom domain —
   `christopher-weber.com`). Use a redirect instead.

The old POL 682 course Pages URL
(`crweber9874.github.io/linear_regression_class/`) is no longer linked from this
site; the book is served from `/teaching/pol682/`.

## Architecture notes

- **Design system**: the theme's `src/styles/*.css` (native CSS, no Tailwind).
  `src/styles/color.css` carries the palette — `--primary` is UA azurite,
  `--accent` is UA chili. Site identity, nav, and publication display rules live
  in `src/site.config.ts`.
- **Content**: Astro content collections under `src/content/` — `about.md`,
  `services.md`, `misc.md`, `now.md`, `experience.json`, `people.toml`,
  `publications/main.bib`, `projects/`, `updates/`, `blog/`. Remaining hand-kept
  data (`cv.ts`, `teaching.ts`, `voter.ts`) lives in `src/data/`.
- **Ported AVP modules**: `src/modules/avp/*` (copied from `avp-web-modules`,
  then adapted for Astro — `next/link` → local `Link` shim, `NEXT_PUBLIC_BASE_PATH`
  → Astro `BASE_URL`, JSX `.js` files renamed to `.jsx`).
- **Data**: `public/data` and `public/tiles` are copied from the AVP repo so the
  site is fully self-contained. Small modules load their JSON at build time and
  pass it to `client:only` islands; large map layers are fetched client-side.
- **AVP styling** is isolated: dashboard routes use `src/layouts/AvpLayout.astro`
  (AVP's own `src/styles/avp.css`), so the AVP look never bleeds into the main
  site aesthetic.

## Deploying to GitHub Pages + christopher-weber.com

The repo is preconfigured:

- `astro.config.ts` → `site: "https://christopher-weber.com"`
- `public/CNAME` → `christopher-weber.com`
- `.github/workflows/deploy.yml` → builds and deploys on push to `main`/`master`

### One-time setup

1. **Push** this repo to GitHub as a private repo named **`Personal`** (requires
   GitHub Pro for Pages from a private repo), e.g. `crweber9874/Personal`.
2. **Repo → Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`/`master` to trigger the deploy workflow.
4. In **Settings → Pages → Custom domain**, enter `christopher-weber.com` and save,
   then enable **Enforce HTTPS** (after DNS propagates).

### Point Squarespace DNS at GitHub Pages

Domain registrar: **Squarespace** (`christopher-weber.com`).

1. In Squarespace: **Domains → christopher-weber.com → DNS → DNS Settings**.
2. **Remove** any Squarespace website/parking A or CNAME records that point the
   apex or `www` at Squarespace hosting (keep Squarespace nameservers if the
   domain stays registered there — you only change the records).
3. Add:

   **Apex (`christopher-weber.com` / `@`) — four A records**, Host `@` (or blank):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **`www` — CNAME**, Host `www`, Data:
   ```
   <your-github-username>.github.io
   ```
   (e.g. `crweber9874.github.io` — not `christopher-weber.com`)

4. Optional IPv6 — four AAAA records for `@`:
   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```

5. Wait for propagation (often under an hour; can take up to 48h), confirm in
   GitHub Pages that the domain shows a green check / DNS verified, then turn on
   **Enforce HTTPS**.

**Squarespace tip:** If the UI offers “Connect domain” to a Squarespace site,
do **not** use that for this project — you want custom DNS to GitHub, not
Squarespace hosting.

**`www` vs apex:** After both records work, GitHub will usually redirect
`www` ↔ apex once the custom domain is set. Prefer the apex
`https://christopher-weber.com` as the canonical URL (already set in Astro).

## Editing content

- **Publications**: `src/content/publications/main.bib`. `selected={true}`
  features an entry on the home page; `keywords` become the filter chips on
  `/publications`. Abstracts written for this site rather than taken from the
  publisher are marked "(Editorial summary — not the published abstract.)".
- **Bio / profile**: `src/content/about.md` and `PROFILE` in `src/site.config.ts`.
- **Appointments & education**: `src/content/experience.json`.
- **Service, honors, media**: `src/content/services.md`, `src/content/misc.md`.
- **Works in progress**: `src/content/now.md` (and `src/data/cv.ts` for `/cv`).
- **Updates** (home page + `/now`): `src/content/updates/YYYY-MM-DD-slug.md`.
- **Courses**: `src/data/teaching.ts` — description, what the reader covers, and the
  companion texts. Readers are served from `/teaching/pol682|683/`.
- **Book chapters**: edited in the methodology_ground_up hub, then `pnpm sync:readers`.
- **CV extras**: `src/data/cv.ts` (honors, service, skills, media, working papers).
- **Voter sandbox charts**: `src/data/voter.ts`; the module cards are in `src/pages/voter.astro`.
- **Headshot**: replace `src/assets/avatar.png` (currently a generated `CW` placeholder).
