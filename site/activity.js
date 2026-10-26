(() => {
  const list = document.querySelector('#activity-list');
  const source = document.querySelector('#activity-source');
  const buttons = [...document.querySelectorAll('[data-activity-filter]')];
  let publicEvents = [];
  let issueEvents = [];
  let selected = 'all';

  function describe(event) {
    const repo = event.repo?.name;
    if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
    const payload = event.payload || {};
    const base = `https://github.com/${repo}`;
    const details = { repo, date: event.created_at, category: 'repos', url: base, icon: '◇' };
    switch (event.type) {
      case 'PushEvent': {
        const sha = payload.head || payload.commits?.[0]?.sha;
        return { ...details, category: 'code', label: 'PUSHED CODE', icon: '↥', title: `Pushed to ${(payload.ref || 'main').replace('refs/heads/', '')}`, note: payload.commits?.[0]?.message?.split('\n')[0] || (sha ? `Commit ${sha.slice(0, 7)}` : 'Repository updated'), url: sha ? `${base}/commit/${encodeURIComponent(sha)}` : `${base}/commits` };
      }
      case 'IssuesEvent':
        return { ...details, category: 'issues', label: 'ISSUE', icon: '⊙', title: `${payload.action || 'Updated'} issue #${payload.issue?.number || ''}`, note: payload.issue?.title || 'Issue activity', url: `${base}/issues/${payload.issue?.number || ''}` };
      case 'IssueCommentEvent':
        return { ...details, category: 'issues', label: 'COMMENT', icon: '≡', title: `Commented on #${payload.issue?.number || ''}`, note: payload.issue?.title || 'Joined the conversation', url: `${base}/issues/${payload.issue?.number || ''}` };
      case 'PullRequestEvent':
        return { ...details, category: 'code', label: 'PULL REQUEST', icon: '⑂', title: `${payload.action || 'Updated'} PR #${payload.pull_request?.number || payload.number || ''}`, note: payload.pull_request?.title || 'Pull request activity', url: `${base}/pull/${payload.pull_request?.number || payload.number || ''}` };
      case 'PullRequestReviewEvent':
      case 'PullRequestReviewCommentEvent':
        return { ...details, category: 'code', label: 'CODE REVIEW', icon: '✓', title: `Reviewed PR #${payload.pull_request?.number || ''}`, note: payload.pull_request?.title || 'Code review activity', url: `${base}/pull/${payload.pull_request?.number || ''}` };
      case 'CreateEvent':
        return { ...details, label: 'CREATED', title: payload.ref ? `Created ${payload.ref_type || 'branch'} ${payload.ref}` : 'Created a repository', note: payload.description || 'A new experiment begins' };
      case 'ForkEvent':
        return { ...details, label: 'FORKED', title: 'Forked a repository', note: 'An open-source rabbit hole' };
      case 'WatchEvent':
        return { ...details, label: 'STARRED', icon: '☆', title: 'Starred a repository', note: 'Something worth exploring' };
      case 'ReleaseEvent':
        return { ...details, label: 'RELEASE', icon: '◈', title: payload.release?.name || payload.release?.tag_name || 'Published a release', url: `${base}/releases` };
      default: return null;
    }
  }

  function relativeTime(date) {
    const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
    if (!Number.isFinite(seconds)) return '';
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
  }

  function render() {
    const events = [...publicEvents, ...issueEvents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(describe).filter(Boolean).filter((event) => selected === 'all' || event.category === selected).slice(0, 8);
    list.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('li');
      empty.className = 'activity-empty';
      empty.textContent = 'No matching events in the latest public activity. Explore more on GitHub.';
      list.append(empty);
      return;
    }
    for (const event of events) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = event.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const meta = document.createElement('div');
      meta.className = 'activity-item-meta';
      const label = document.createElement('span');
      label.textContent = `${event.icon} ${event.label}`;
      const time = document.createElement('time');
      time.dateTime = event.date;
      time.title = new Date(event.date).toLocaleString('en', { timeZone: 'America/Mexico_City' });
      time.textContent = relativeTime(event.date);
      meta.append(label, time);
      const repo = document.createElement('strong');
      repo.textContent = event.repo.split('/')[1];
      const title = document.createElement('p');
      title.textContent = event.title;
      const note = document.createElement('small');
      note.textContent = (event.note || event.repo.split('/')[0]).slice(0, 100);
      link.append(meta, repo, title, note);
      item.append(link);
      list.append(item);
    }
  }

  function authoredIssueEvent(issue) {
    const isPullRequest = Boolean(issue.pull_request);
    const repo = issue.repository_url?.split('/repos/')[1];
    if (!repo) return null;
    return {
      id: `issue-${issue.id}`,
      type: isPullRequest ? 'PullRequestEvent' : 'IssuesEvent',
      repo: { name: repo },
      created_at: issue.updated_at,
      payload: {
        action: 'Updated', number: issue.number,
        [isPullRequest ? 'pull_request' : 'issue']: { number: issue.number, title: issue.title },
      },
    };
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      selected = button.dataset.activityFilter;
      for (const other of buttons) {
        const active = other === button;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      }
      render();
    });
  }

  async function load() {
    try {
      const response = await fetch('site/activity.json');
      if (response.ok) {
        const snapshot = await response.json();
        publicEvents = snapshot.events;
        issueEvents = snapshot.issue_events || [];
        render();
        const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(snapshot.updated_at));
        source.textContent = `Saved snapshot · ${date}`;
      }
    } catch { /* The public GitHub link is always available. */ }
    const urls = [
      'https://api.github.com/users/BrUn3y/events/public?per_page=50',
      'https://api.github.com/search/issues?q=author%3ABrUn3y&sort=updated&order=desc&per_page=12',
    ];
    const [eventsResult, issuesResult] = await Promise.allSettled(urls.map(async (url) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000), credentials: 'omit' });
      if (!response.ok) throw new Error('Public feed unavailable');
      return response.json();
    }));
    const eventsUpdated = eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value);
    const issuesUpdated = issuesResult.status === 'fulfilled' && Array.isArray(issuesResult.value.items);
    if (eventsUpdated) publicEvents = eventsResult.value;
    if (issuesUpdated) issueEvents = issuesResult.value.items.map(authoredIssueEvent).filter(Boolean);
    if (eventsUpdated && issuesUpdated) source.textContent = 'Updated from GitHub just now';
    else if (eventsUpdated || issuesUpdated) source.textContent = 'GitHub updates + saved public snapshot';
    else if (!publicEvents.length && !issueEvents.length) source.textContent = 'GitHub feed temporarily unavailable';
    render();
  }
  load();
})();
