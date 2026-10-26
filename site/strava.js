(() => {
  const list = document.querySelector('#strava-activities');
  const summary = document.querySelector('#strava-summary');
  const status = document.querySelector('#strava-source');
  if (!list || !summary || !status) return;

  function metric(value, label) {
    const item = document.createElement('div');
    const number = document.createElement('strong');
    const caption = document.createElement('span');
    number.textContent = value;
    caption.textContent = label;
    item.append(number, caption);
    return item;
  }

  async function load() {
    try {
      const response = await fetch('site/strava.json');
      if (!response.ok) throw new Error('Snapshot unavailable');
      const data = await response.json();
      if (!Array.isArray(data.activities) || !data.activities.length) throw new Error('No activities');
      const hours = Math.floor(data.summary.moving_time_seconds / 3600);
      const minutes = Math.floor(data.summary.moving_time_seconds % 3600 / 60);
      summary.replaceChildren(
        metric(String(data.activities.length).padStart(2, '0'), 'RECENT SESSIONS'),
        metric(`${data.summary.distance_km.toFixed(2)} km`, 'DISTANCE LOGGED'),
        metric(`${hours}h ${minutes}m`, 'TIME IN MOTION'),
      );
      list.replaceChildren();
      for (const activity of data.activities) {
        const item = document.createElement('li');
        item.className = 'strava-session';
        const header = document.createElement('div');
        header.className = 'strava-session-top';
        const type = document.createElement('span');
        type.textContent = `${activity.type === 'Run' ? '↗' : '◇'} ${activity.type.toUpperCase()}`;
        const date = document.createElement('span');
        date.textContent = activity.date_label;
        header.append(type, date);
        const title = document.createElement('h3');
        title.textContent = activity.title;
        const stats = document.createElement('div');
        stats.className = 'strava-session-stats';
        stats.append(metric(activity.duration, 'TIME'));
        if (activity.distance_km !== null) stats.append(metric(`${activity.distance_km.toFixed(2)} km`, 'DISTANCE'));
        if (activity.heart_rate !== 'N/A') stats.append(metric(activity.heart_rate, 'AVG. HEART RATE'));
        if (activity.calories !== 'N/A kcal' && activity.calories !== 'N/A') stats.append(metric(activity.calories, 'ENERGY'));
        item.append(header, title, stats);
        list.append(item);
      }
      const updated = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Mexico_City' }).format(new Date(data.updated_at));
      status.textContent = `Published Strava snapshot · ${updated}`;
    } catch {
      list.textContent = 'Recent workouts are temporarily unavailable. The published activity source is linked below.';
      status.textContent = 'Training log unavailable';
    }
  }
  load();
})();
