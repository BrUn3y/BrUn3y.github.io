# BrUn3y personal website

A Y2K-inspired static website based on the profile README. Built with HTML, CSS, and JavaScript, with no build dependencies. All website copy is in English.

- `index.html`: content, links, projects, and retro self-promotion banners.
- `site/style.css`: desktop and mobile styles.
- `site/app.js`: project filters, navigation, and the Mexico City clock.
- `site/radio.js`: Play/Pause controls, current song from Icecast metadata, and playback indicator for The Cyber Music Lover Radio.
- `site/chat.js` and `site/chat-messages.json`: local chat, 500 original English messages, randomized pacing, personalized greetings, and funny replies.
- `site/activity.js` and `site/activity.json`: public GitHub events and authored issues/PRs, with a saved fallback for network errors or API rate limits.
- `site/strava.js` and `site/strava.json`: the latest six published workouts and totals, based on the existing profile Strava widget.
- `scripts/refresh_site_data.py`: safe, repeatable GitHub and Strava refreshes. Run without flags to refresh both, or use `--github` / `--strava`.
- `AGENTS.md` (also linked from `agent.md`): maintenance instructions for agents, including data sources, refresh commands, design constraints, validation, and publishing. Both guides live in this repository's root.
- `site/assets/`: original SVG illustrations and the public GitHub avatar.

## Local development

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Editorial content is maintained manually; existing profile README automation runs independently. BRUN3YAMP plays The Cyber Music Lover Radio only after the visitor presses Play. Pause releases the live connection; Play rejoins the broadcast. The player shows connection, playback, and error states and links to the station on radio.net. While playing in a visible tab, it reads the station's public Icecast metadata every 30 seconds to display the current artist/song, falling back to the station name if unavailable. The bars use a simple CSS animation as a playback indicator, stop on pause/buffering, and respect reduced-motion preferences. Native audio controls remain available without JavaScript. Retro banners link to the owner's own projects and do not use an advertising network.

Google Analytics uses the owner's Google tag, `G-GSG3QV8LMM`, loaded asynchronously in the document head. No custom analytics events send chat nicknames or messages.

The project chat is entirely simulated. Visitors can add a nickname and a message to the current tab; messages are rendered with `textContent`, never sent over the network, and never stored in cookies, localStorage, sessionStorage, or a backend. Reloading resets the room. Fictional participants draw from 500 unique English messages shuffled without repeating a message until the deck is exhausted. Messages arrive at irregular intervals while the tab is visible. A nickname receives a welcome and a humorous reply on its first message in the current tab. The displayed log is limited to 18 messages. The UI only notes that messages clear on refresh.

Last activity uses GitHub's public events and authored issue search APIs without authentication. It supports pushes, pull requests, reviews, issues, comments, repositories, forks, stars, and releases. A checked-in public snapshot remains available when the API fails or rate limits requests. The displayed source indicates whether the feed is live, saved, or mixed. All links point to the actual GitHub resources.

The Strava section reuses the already-public `assets/strava-widget.svg` from `BrUn3y/Brun3y`. The refresh script finds its latest public commit and downloads that exact revision without checking out the profile repository. It includes six sessions, duration, available distance, heart rate, and calories. Totals cover those displayed sessions. The publication date comes from that widget commit, and workout dates keep the month/day labels supplied by the widget. The browser reads only the sanitized static JSON; no Strava credentials, route data, or raw API responses are published.

## Deployment

Website URL: https://brun3y.github.io/

All website files, maintenance scripts, guides, and workflows live in **`BrUn3y/BrUn3y.github.io`**, on `main`. It is **public** at the user's request so GitHub Pages works on the current plan. The separate `BrUn3y/Brun3y` repository contains the public profile and its existing automation; do not put website changes there. Public profile information and its Strava widget are external data sources only.

Pages uses **GitHub Actions** as its source in Settings → Pages, with the repository Actions variable `PAGES_ENABLED=true`. Keep the repository public: serving Pages from a private personal repository requires GitHub Pro. Verify successful deployments and updated public content; cached HTTP 200 responses alone do not establish that Pages is enabled.

`.github/workflows/refresh-data.yml` refreshes both data snapshots daily at 06:41 UTC and manually, then commits only the two sanitized JSON files. It uses the repository's built-in token and requires no custom credentials. Run `python3 scripts/refresh_site_data.py` locally for both sources, or use `--github` / `--strava` for one. `--best-effort` preserves the previous good snapshot if an optional refresh fails.

`.github/workflows/pages.yml` deploys relevant pushes to `main` and follows successful data refreshes. It uses the official GitHub Pages actions with repository-scoped permissions; no cross-repository deploy key is needed. The job runs when `PAGES_ENABLED=true`. The website artifact contains only `index.html`, `site/`, and `.nojekyll`; the guides, scripts, and workflows remain available in the public repository but are excluded from that artifact.
