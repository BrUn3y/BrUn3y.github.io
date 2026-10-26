# Maintaining BrUn3y's personal website

## Scope and repository layout

The canonical source repository, [BrUn3y/Brun3y](https://github.com/BrUn3y/Brun3y), contains both the public GitHub profile and the Y2K personal website at https://brun3y.github.io/. Read [WEBSITE.md](https://github.com/BrUn3y/Brun3y/blob/master/WEBSITE.md) for the site overview.

`agent.md` and `AGENTS.md` are also mirrored in the root of `BrUn3y/BrUn3y.github.io`. If you are reading this in that publishing repository, open or clone the canonical source repository and make maintenance changes there. Run all commands below from its checkout; the refresh scripts and profile data exist only in the source repository. Direct edits in the publishing repository will be overwritten by the next automated publication. All file paths below refer to the source checkout.

The publishing repository, `BrUn3y/BrUn3y.github.io`, is **private** at the user's explicit request. GitHub Pages from a private personal repository requires GitHub Pro. After the visibility change, GitHub disabled Pages and rejected re-enabling it because the current plan does not support it. Preserve the repository's privacy; do not make it public or purchase a plan without the user's authorization. Edit files in the canonical source repository and let `.github/workflows/pages.yml` publish them; do not maintain a second independent copy in the publishing repository.

| File | Purpose |
| --- | --- |
| `index.html` | Biography, selected projects, ads, writing, community, and Strava section |
| `site/style.css` | Y2K design and responsive layout |
| `site/activity.js` | Public GitHub feed and filters |
| `site/activity.json` | Safe fallback for public GitHub events and authored issues/PRs |
| `site/strava.js` | Strava training log and summary cards |
| `site/strava.json` | Sanitized snapshot of already-published Strava statistics |
| `scripts/refresh_site_data.py` | Repeatable GitHub and Strava refresh command |
| `assets/strava-widget.svg` | Existing published profile data; source of Strava website statistics |
| `site/chat.js`, `site/chat-messages.json` | Ephemeral chat, 500 messages, greetings, and funny replies |
| `readme.source.md` | Editable source for the generated profile README |
| `README.md` | Generated profile output; its generator can overwrite manual changes |

## User preferences to preserve

- Keep all website UI and editorial copy in English.
- Preserve the owner's Google Analytics tag `G-GSG3QV8LMM` in `index.html`. Do not send chat nicknames or messages as analytics events or parameters.
- Preserve the Y2K browser window, chrome lettering, lavender/lime palette, retro project ads, and pixelated portrait.
- Keep GitHub activity on the right and the small chat on the left on desktop. Preserve the mobile layout.
- The user removed the **MY TOOLBOX / FOR THE FUTURE** section; do not restore it.
- Chat messages must remain local to the current tab and disappear on reload. Never add storage, analytics, API calls carrying user messages, or a backend to the chat. Keep the local submit handler and disabled-until-ready controls.
- Keep the 500-message shuffled deck, irregular timing, welcome mentioning a visitor's nickname, and humorous replies. Render visitor text with `textContent`.
- The user asked to omit fiction/demo/simulation labels from the visible chat. Keep the factual refresh notice. Do not invent online-user counts or claim real-time communication between visitors.
- Project ads link to the owner's projects and community; preserve those destinations and avoid adding an ad network.

## Credentials and secrets

- Never upload, commit, push, or publish credentials, passwords, access or refresh tokens, API secrets, private keys, credential files, or `.env` files containing secrets. This applies to both public and private repositories, website assets, deployment artifacts, logs, and documentation.
- Keep secrets in GitHub Actions secrets or local environment variables. Never print secret values in tool output, logs, examples, or messages. Do not open credential files such as `strava_tokens.json` or `token.json` for routine website maintenance.
- Before staging or pushing, check the exact files being included and use the repository's secret checks. Keep local credential files ignored; `.gitignore` does not protect files already tracked. Do not bypass a secret-detection failure.
- If an exposed secret is discovered, do not copy or republish it. Report the affected location without revealing the value, and arrange revocation or rotation with the owner. Removing a value from the latest revision does not remove it from Git history.
- The Google Analytics measurement ID `G-GSG3QV8LMM` is a public website identifier, not an authentication credential.

## Update GitHub activity

1. Check the working tree and incorporate remote changes without overwriting the user's work. Automated profile commits may arrive during the update.
2. Run the supported refresh command from this repository root:

   ```sh
   python3 scripts/refresh_site_data.py --github
   ```

   It uses the authenticated `gh` CLI against `github.com`. It queries public user events and authored issues/PRs with `is:public`, stores only allowlisted fields, and writes `site/activity.json` atomically after both requests succeed. No token is included in the output.

3. Keep `updated_at`, `events`, and `issue_events` compatible with `site/activity.js`. Preserve actual event dates, repository names, commit SHAs, issue numbers, and PR numbers. Search results use their `updated_at` as an update timestamp; do not invent an event action or merge status.
4. Verify the **All**, **Code**, **Issues**, and **Repos** filters. Empty results should remain an honest empty state. Do not invent activity to fill a category.
5. If GitHub is unavailable or rate limited, retain the previous good snapshot and report the limitation. The browser also attempts an anonymous live refresh and falls back to the saved data. Keep the source label accurate.

## Update the profile and project information

Use public GitHub repositories, verified PRs/releases, and the existing README as sources. The README is AI-maintained and may contain stale claims; verify changing facts before reusing them. An authenticated public-repository lookup is:

```sh
gh api 'users/BrUn3y/repos?sort=pushed&per_page=100' --jq '[.[] | select(.private == false) | {name, description, html_url, pushed_at, language, archived, fork}]'
```

- Update project descriptions and links in `index.html` only when the new information is verified. Prefer a curated set over listing every repository.
- If project cards change, synchronize category tags, the initial project count, the All badge, and the directory's project count. `site/app.js` updates the filtered count after interaction.
- Check links in related retro banners, writing links, and community content when their destination changes.
- Avoid unstable star counts, relative event claims such as "this week," or unsupported career claims. Use exact dates when dates matter.
- To change the profile README, edit `readme.source.md` and preserve the link to https://brun3y.github.io/. Keep the website's editorial copy consistent with verified profile facts.

## Update Strava activity

Strava is already connected to the profile's existing fitness automation. The website reuses the public `assets/strava-widget.svg`; it does not authenticate to Strava from the browser.

```sh
python3 scripts/refresh_site_data.py --strava
```

This extracts up to six published sessions and writes `site/strava.json`. It reads only public widget statistics and the widget's Git commit date. It does not read credential files or contact the Strava API.

- Supported data: English title/type, published month/day, duration, distance when present, published average heart rate, and calories.
- The summary totals refer to the displayed sessions, not a calendar week or month. Do not describe them as weekly totals.
- Workout distance may be absent. Preserve `null` rather than inventing a distance. Missing metrics should be omitted from cards.
- The SVG has month/day labels without a year. Preserve those labels; do not guess an activity year. `updated_at` records when the widget was published, not when every workout happened.
- If a new activity title needs translation, extend the title map in `refresh_site_data.py` or keep an honest English activity-type label. Do not change the metrics.
- If the widget format changes, update its parser and validate the result against the actual public SVG. If parsing fails, preserve the last successful JSON.
- Do not publish route coordinates, maps, start locations, raw API responses, or private activities.
- To obtain newer Strava data, use the existing **Update Profile** automation, then regenerate the site data. Its Strava step uses existing Actions secrets. Never print, commit, or copy `strava_tokens.json`, `token.json`, refresh tokens, or client secrets into the website.

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
git diff --check
python3 -m http.server 8080 --bind 127.0.0.1
```

Use the browser to review the Strava section and GitHub feed, including narrow mobile and desktop widths. Check for horizontal overflow, broken images, JavaScript errors, and incorrect source labels. If chat code changes, verify submission, nickname welcome, literal rendering of HTML-like text, and clearing on refresh. Avoid unrelated edits and broad test suites for simple content changes.

## Publish and verify

When publication is part of the requested task, commit the relevant source/data files and push to `master`. Use the configured workflow rather than manually copying the repository root.

The Pages workflow refreshes public GitHub and published Strava data before copying only `index.html`, `site/`, `.nojekyll`, `agent.md`, and `AGENTS.md`. Both agent guides must remain in the publishing repository's root and be kept in sync automatically. It also runs daily, after successful profile/fitness workflows, and manually. `--best-effort` keeps the last good snapshots if a refresh fails. Build-time refreshes are included in the deployed artifact; they do not create source commits.

`PAGES_DEPLOY_KEY` allows publishing only to the private `BrUn3y/BrUn3y.github.io` repository. Do not print it or replace it with a broad personal access token. Preserve the workflow's pinned deployment action and the publishing repository's private visibility.

Pushing files to the publishing repository can succeed while Pages is disabled. Once the account has a supported plan, re-enable Pages for the publishing repository's `main` branch and `/` directory in Settings → Pages. Check both the source publishing run and the destination GitHub Pages run, then confirm https://brun3y.github.io/ serves the updated page publicly. Verify `gh api repos/BrUn3y/BrUn3y.github.io --jq '{private,has_pages}'` and the Pages settings API as well; an HTTP 200 alone may be cached content after a visibility change. Include any genuine refresh/deployment limitation in the final report.
