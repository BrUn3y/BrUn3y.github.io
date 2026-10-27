# Maintaining BrUn3y's personal website

## Scope and repository layout

This repository, [BrUn3y/BrUn3y.github.io](https://github.com/BrUn3y/BrUn3y.github.io), is the canonical home of the Y2K personal website at https://brun3y.github.io/. Edit website files, scripts, and guides here on `main`. Read [WEBSITE.md](WEBSITE.md) for the site overview.

The user explicitly asked to remove all website changes from the separate public profile repository, `BrUn3y/Brun3y`. Do not put website files, guides, links, or deployment workflows there. Its public README and published Strava widget remain external information sources for the website.

This website repository is **public** at the user's explicit request so GitHub Pages can serve https://brun3y.github.io/ on the current plan. Preserve this arrangement. GitHub Pages from a private personal repository requires GitHub Pro; changing this repository to private without a supported plan would disable the website.

| File | Purpose |
| --- | --- |
| `index.html` | Biography, selected projects, ads, writing, community, and Strava section |
| `site/style.css` | Y2K design and responsive layout |
| `site/activity.js` | Public GitHub feed and filters |
| `site/activity.json` | Safe fallback for public GitHub events and authored issues/PRs |
| `site/strava.js` | Strava training log and summary cards |
| `site/strava.json` | Sanitized snapshot of already-published Strava statistics |
| `scripts/refresh_site_data.py` | Repeatable GitHub and Strava refresh command |
| `.github/workflows/refresh-data.yml` | Scheduled refresh of public GitHub and Strava snapshots |
| `.github/workflows/pages.yml` | Deployment from this repository when Pages is supported and enabled |
| `site/chat.js`, `site/chat-messages.json` | Ephemeral chat, 550 messages including 50 generic radio comments, unread indicator, greetings, and funny replies |
| `site/radio.js` | Controls BRUN3YAMP's direct HTTPS stream for The Cyber Music Lover Radio; playback starts only after Play |
| `site/globe.js`, `site/globe-land.json` | Small rotating globe, eight decorative markers, and an optional approximate location kept only in the visitor's tab |
| `agent.md`, `AGENTS.md` | Website maintenance and credential-handling instructions |

## User preferences to preserve

- Keep all website UI and editorial copy in English.
- Preserve the owner's Google Analytics tag `G-GSG3QV8LMM` in `index.html`. Do not send chat nicknames or messages as analytics events or parameters.
- Preserve the Y2K browser window, chrome lettering, lavender/lime palette, retro project ads, and pixelated portrait.
- Keep GitHub activity on the right and the small chat on the left on desktop. Preserve the mobile layout.
- The user removed the **MY TOOLBOX / FOR THE FUTURE** section; do not restore it.
- Chat messages must remain local to the current tab and disappear on reload. Never add storage, analytics, API calls carrying user messages, or a backend to the chat. Keep the local submit handler and disabled-until-ready controls.
- Keep the 550-message shuffled deck (including generic radio/song comments), irregular timing, welcome mentioning a visitor's nickname, and humorous replies. Render visitor text with `textContent`. Highlight new arrivals briefly; preserve the unread counter and jump-to-latest button when a visitor is reading older messages.
- The user asked to omit fiction/demo/simulation labels from the visible chat. Keep the factual refresh notice. Do not invent online-user counts or claim real-time communication between visitors.
- Project ads link to the owner's projects and community; preserve those destinations and avoid adding an ad network.
- Preserve the six classic 88×31-style web buttons directly below Open Source in the right sidebar. They link to the real Medium RSS feed, chat, radio, quantum workshop, website source, and home; do not add fabricated subscriber counts or a nonfunctional subscription form.
- Keep the globe below Last activity. Its random dots are decorative, not live visitor records. The user asked to omit their visible legend and the initial globe tagline; do not add a visitor count or claims of live connections. Request geolocation only after the visitor clicks Show my spot; round coordinates to whole degrees, keep them in memory, and never store, transmit, or send them to analytics. Respect reduced motion and suspend rotation offscreen or in hidden tabs.

## Credentials and secrets

- Never upload, commit, push, or publish credentials, passwords, access or refresh tokens, API secrets, private keys, credential files, or `.env` files containing secrets. This applies to both public and private repositories, website assets, deployment artifacts, logs, and documentation.
- Keep secrets in GitHub Actions secrets or local environment variables. Never print secret values in tool output, logs, examples, or messages. Do not open credential files such as `strava_tokens.json` or `token.json` for routine website maintenance.
- Before staging or pushing, check the exact files being included and use the repository's secret checks. Keep local credential files ignored; `.gitignore` does not protect files already tracked. Do not bypass a secret-detection failure.
- If an exposed secret is discovered, do not copy or republish it. Report the affected location without revealing the value, and arrange revocation or rotation with the owner. Removing a value from the latest revision does not remove it from Git history.
- The Google Analytics measurement ID `G-GSG3QV8LMM` is a public website identifier, not an authentication credential.

## Update GitHub activity

1. Check the working tree and incorporate remote changes without overwriting the user's work. Automated data refresh commits may arrive during the update.
2. Run the supported refresh command from this repository root:

   ```sh
   python3 scripts/refresh_site_data.py --github
   ```

   It uses the authenticated `gh` CLI against `github.com`. It queries public user events and authored issues/PRs with `is:public`, stores only allowlisted fields, and writes `site/activity.json` atomically after both requests succeed. No token is included in the output.

3. Keep `updated_at`, `events`, and `issue_events` compatible with `site/activity.js`. Preserve actual event dates, repository names, commit SHAs, issue numbers, and PR numbers. Search results use their `updated_at` as an update timestamp; do not invent an event action or merge status.
4. Verify the **All**, **Code**, **Issues**, and **Repos** filters. Empty results should remain an honest empty state. Do not invent activity to fill a category.
5. If GitHub is unavailable or rate limited, retain the previous good snapshot and report the limitation. The browser also attempts an anonymous live refresh and falls back to the saved data. Keep the source label accurate.

## Update the profile and project information

Use public GitHub repositories, verified PRs/releases, and the public profile README in `BrUn3y/Brun3y` as sources. The profile README is AI-maintained and may contain stale claims; verify changing facts before reusing them. An authenticated public-repository lookup is:

```sh
gh api 'users/BrUn3y/repos?sort=pushed&per_page=100' --jq '[.[] | select(.private == false) | {name, description, html_url, pushed_at, language, archived, fork}]'
```

- Update project descriptions and links in `index.html` only when the new information is verified. Prefer a curated set over listing every repository.
- If project cards change, synchronize category tags, the initial project count, the All badge, and the directory's project count. `site/app.js` updates the filtered count after interaction.
- Check links in related retro banners, writing links, and community content when their destination changes.
- Avoid unstable star counts, relative event claims such as "this week," or unsupported career claims. Use exact dates when dates matter.
- Keep the website's editorial copy consistent with verified profile facts. Website maintenance must not modify the separate profile repository.

## Update Strava activity

Strava is already connected to the profile's existing fitness automation. The website fetches only the already-public [profile Strava widget](https://github.com/BrUn3y/Brun3y/blob/master/assets/strava-widget.svg); it does not authenticate to Strava.

```sh
python3 scripts/refresh_site_data.py --strava
```

This extracts up to six published sessions and writes `site/strava.json`. It uses `gh api` to find the latest public widget revision and its commit date, then downloads that exact revision from `raw.githubusercontent.com`. It does not read credential files or contact the Strava API. Run it from this website repository; no checkout of the profile repository is needed.

- Supported data: English title/type, published month/day, duration, distance when present, published average heart rate, and calories.
- The summary totals refer to the displayed sessions, not a calendar week or month. Do not describe them as weekly totals.
- Workout distance may be absent. Preserve `null` rather than inventing a distance. Missing metrics should be omitted from cards.
- The SVG has month/day labels without a year. Preserve those labels; do not guess an activity year. `updated_at` records when the widget was published, not when every workout happened.
- If a new activity title needs translation, extend the title map in `refresh_site_data.py` or keep an honest English activity-type label. Do not change the metrics.
- If the widget format changes, update its parser and validate the result against the actual public SVG. If parsing fails, preserve the last successful JSON.
- Do not publish route coordinates, maps, start locations, raw API responses, or private activities.
- The profile's existing fitness automation publishes new widget data independently. Refresh the website after that public widget changes; do not copy its automation or credentials into this repository. Never print, commit, or copy `strava_tokens.json`, `token.json`, refresh tokens, or client secrets into the website.

Refresh both data sources with:

```sh
python3 scripts/refresh_site_data.py
```

## Validate changes

For a data refresh, check JSON shapes, real links, session counts, and totals against their sources. For code or layout changes, also run:

```sh
python3 -m py_compile scripts/refresh_site_data.py
node --check site/app.js
node --check site/activity.js
node --check site/strava.js
node --check site/chat.js
node --check site/radio.js
node --check site/globe.js
git diff --check
python3 -m http.server 8080 --bind 127.0.0.1
```

Use the browser to review the Strava section and GitHub feed, including narrow mobile and desktop widths. Check for horizontal overflow, broken images, JavaScript errors, and incorrect source labels. If chat code changes, verify submission, nickname welcome, literal rendering of HTML-like text, and clearing on refresh. Avoid unrelated edits and broad test suites for simple content changes.

## Publish and verify

Commit the relevant website files and push to `main` in this repository. Keep both agent guides in its root. There is no cross-repository publishing step and no SSH deployment key is needed.

**Refresh public website data** runs daily at 06:41 UTC and manually. It uses the repository's `GITHUB_TOKEN`, requests only public source information, and commits only `site/activity.json` and `site/strava.json`. `--best-effort` preserves each last good snapshot if its refresh fails. No Strava credentials are required.

**Deploy personal website to GitHub Pages** uses the official Pages actions. It copies only `index.html`, `site/`, and `.nojekyll` into the website artifact. Scripts, workflows, and guides are available in the public repository but are excluded from the website artifact. The deployment job is enabled by the repository variable `PAGES_ENABLED=true`.

Pages uses **GitHub Actions** as the source in this repository's Settings → Pages. Keep the repository Actions variable `PAGES_ENABLED` set to `true`. Website pushes and successful data refreshes trigger deployment; the Pages workflow can also be run manually. Verify the Pages run and confirm https://brun3y.github.io/ serves the updated page publicly. Also check `gh api repos/BrUn3y/BrUn3y.github.io --jq '{private,has_pages}'` and the Pages settings API; an HTTP 200 alone may be cached content after a visibility change. Include any genuine refresh/deployment limitation in the final report.
