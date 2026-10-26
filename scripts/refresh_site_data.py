#!/usr/bin/env python3
"""Refresh public website data. Uses gh for GitHub and the published Strava SVG."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


def save_json(path, data):
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def github_api(endpoint):
    result = subprocess.run(
        ['gh', 'api', '--hostname', 'github.com', endpoint],
        capture_output=True, text=True, timeout=35, check=False,
    )
    if result.returncode:
        raise RuntimeError('GitHub public API request failed; existing snapshot was preserved')
    return json.loads(result.stdout)


def refresh_github():
    endpoints = [
        'users/BrUn3y/events/public?per_page=50',
        'search/issues?q=author%3ABrUn3y+is%3Apublic&sort=updated&order=desc&per_page=12',
    ]
    with ThreadPoolExecutor(max_workers=2) as pool:
        events, search = list(pool.map(github_api, endpoints))
    if not isinstance(events, list) or not isinstance(search.get('items'), list):
        raise ValueError('Unexpected GitHub response; existing snapshot was preserved')
    clean_events = []
    for event in events:
        payload = event.get('payload', {})
        clean_payload = {key: payload[key] for key in ['action', 'ref', 'ref_type', 'head', 'number', 'description'] if key in payload}
        for key in ['issue', 'pull_request', 'release']:
            if isinstance(payload.get(key), dict):
                clean_payload[key] = {name: value for name, value in payload[key].items() if name in ['number', 'title', 'name', 'tag_name']}
        if payload.get('commits'):
            clean_payload['commits'] = [{key: commit[key] for key in ['sha', 'message'] if key in commit} for commit in payload['commits'][:1]]
        clean_events.append({
            'id': event['id'], 'type': event['type'], 'repo': {'name': event['repo']['name']},
            'created_at': event['created_at'], 'payload': clean_payload,
        })
    issue_events = []
    for issue in search['items']:
        is_pr = 'pull_request' in issue
        issue_events.append({
            'id': f"issue-{issue['id']}",
            'type': 'PullRequestEvent' if is_pr else 'IssuesEvent',
            'repo': {'name': issue['repository_url'].split('/repos/')[1]},
            'created_at': issue['updated_at'],
            'payload': {
                'action': 'Updated', 'number': issue['number'],
                'pull_request' if is_pr else 'issue': {'number': issue['number'], 'title': issue['title']},
            },
        })
    save_json(ROOT / 'site/activity.json', {
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'events': sorted(clean_events, key=lambda item: item['created_at'], reverse=True),
        'issue_events': issue_events,
    })
    print(f'GitHub: {len(clean_events)} public events and {len(issue_events)} authored issue/PR updates.')


def duration_seconds(label):
    units = {'h': 3600, 'm': 60, 's': 1}
    matches = re.findall(r'(\d+)\s*([hms])', label)
    if not matches:
        raise ValueError(f'Unexpected duration in published widget: {label}')
    return sum(int(number) * units[unit] for number, unit in matches)


def refresh_strava():
    revisions = github_api('repos/BrUn3y/Brun3y/commits?path=assets%2Fstrava-widget.svg&per_page=1')
    if not isinstance(revisions, list) or not revisions:
        raise ValueError('Cannot determine the publication date of the public Strava widget')
    revision = revisions[0]['commit']['committer']['date']
    datetime.fromisoformat(revision.replace('Z', '+00:00'))
    widget_sha = revisions[0]['sha']
    if not re.fullmatch(r'[0-9a-f]{40}', widget_sha):
        raise ValueError('Unexpected public Strava widget revision')
    request = Request(
        f'https://raw.githubusercontent.com/BrUn3y/Brun3y/{widget_sha}/assets/strava-widget.svg',
        headers={'User-Agent': 'BrUn3y-personal-website'},
    )
    with urlopen(request, timeout=35) as response:
        root = ET.fromstring(response.read())
    texts = {}
    for node in root.findall('{http://www.w3.org/2000/svg}text'):
        position = (int(float(node.attrib.get('x', 0))), int(float(node.attrib.get('y', 0))))
        texts[position] = ' '.join(' '.join(node.itertext()).split())
    titles = {
        'Entrenamiento matutino': 'Morning workout',
        'Entrenamiento con pesas a la tarde': 'Afternoon weight training',
        'Crossfit a la tarde': 'Afternoon CrossFit',
        'Carrera por la tarde': 'Afternoon run',
    }
    types = {'RUN': 'Run', 'WALK': 'Walk', 'RIDE': 'Ride', 'WORKOUT': 'Workout'}
    activities = []
    for (x, y), text in sorted(texts.items(), key=lambda item: item[0][1]):
        match = re.match(r'^\[(RUN|WALK|RIDE|WORKOUT)\]\s*(.*)', text)
        if x != 24 or not match:
            continue
        activity_type = types[match.group(1)]
        duration = texts.get((500, y), '')
        distance = texts.get((1000, y), '')
        distance_match = re.fullmatch(r'(\d+(?:\.\d+)?) km', distance)
        activities.append({
            'title': titles.get(match.group(2), activity_type),
            'type': activity_type,
            'date_label': texts.get((24, y + 18), ''),
            'duration': duration,
            'moving_time_seconds': duration_seconds(duration),
            'distance_km': float(distance_match.group(1)) if distance_match else None,
            'heart_rate': texts.get((650, y), 'N/A'),
            'calories': texts.get((800, y), 'N/A'),
        })
    if not activities:
        raise ValueError('No activities found in published Strava widget; existing snapshot was preserved')
    if len(activities) > 6:
        activities = activities[:6]
    save_json(ROOT / 'site/strava.json', {
        'updated_at': revision,
        'source': 'Published profile Strava widget',
        'source_url': 'https://github.com/BrUn3y/Brun3y/blob/master/assets/strava-widget.svg',
        'activities': activities,
        'summary': {
            'activity_count': len(activities),
            'distance_km': round(sum(item['distance_km'] or 0 for item in activities), 2),
            'moving_time_seconds': sum(item['moving_time_seconds'] for item in activities),
        },
    })
    print(f'Strava: {len(activities)} already-published activities. No credentials or route data read.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--github', action='store_true', help='Refresh public GitHub events and authored issues/PRs.')
    parser.add_argument('--strava', action='store_true', help='Rebuild Strava data from the published profile SVG; no authentication.')
    parser.add_argument('--best-effort', action='store_true', help='Keep successful snapshots and continue if an optional refresh fails.')
    args = parser.parse_args()
    both = not (args.github or args.strava)
    failed = False
    for enabled, refresh in [(args.github or both, refresh_github), (args.strava or both, refresh_strava)]:
        if enabled:
            try:
                refresh()
            except (OSError, ValueError, KeyError, TypeError, RuntimeError, subprocess.SubprocessError, ET.ParseError) as error:
                print(f'{refresh.__name__}: {error}', file=sys.stderr)
                failed = True
    return int(failed and not args.best_effort)


if __name__ == '__main__':
    raise SystemExit(main())
