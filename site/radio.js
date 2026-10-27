// Direct stream listed by https://mx.radio.net/s/tcmlradio.
(() => {
  'use strict';

  const audio = document.getElementById('radio-audio');
  const toggle = document.getElementById('radio-toggle');
  const status = document.getElementById('radio-status');
  if (!audio || !toggle || !status) return;

  const icon = toggle.querySelector('.play-icon');
  const action = toggle.querySelector('.player-action');
  const player = audio.closest('.music-player');
  const track = player.querySelector('.player-track');
  const station = track.textContent;
  const metadataUrl = new URL('/status-json.xsl', audio.src);
  let request = 0;
  let pending = false;
  let metadataTimer;
  let metadataRequest;

  function stopMetadata() {
    clearTimeout(metadataTimer);
    metadataRequest?.abort();
    metadataRequest = null;
  }

  function showTrack(title) {
    track.textContent = title || station;
    track.title = title || station;
  }

  async function refreshTrack() {
    stopMetadata();
    if (audio.paused || document.hidden) return;

    const controller = new AbortController();
    metadataRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(metadataUrl, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Radio metadata unavailable');
      const data = await response.json();
      const sources = [data.icestats?.source].flat().filter(Boolean);
      const source = sources.find((item) => {
        try { return new URL(item.listenurl).pathname === new URL(audio.src).pathname; }
        catch { return false; }
      });
      const title = typeof source?.title === 'string'
        ? source.title.replace(/^The Cyber Music Lover Radio(?: Rocks)?:\s*/i, '').trim()
        : '';
      if (!controller.signal.aborted && !audio.paused) showTrack(title);
    } catch {
      // Metadata failure must never interrupt the audio or leave a stale song.
      if (metadataRequest === controller) showTrack();
    } finally {
      clearTimeout(timeout);
      if (metadataRequest === controller) {
        metadataRequest = null;
        if (!audio.paused && !document.hidden) metadataTimer = setTimeout(refreshTrack, 30000);
      }
    }
  }

  function render(message, active) {
    status.textContent = message;
    player.classList.toggle('is-playing', message === 'LIVE RADIO');
    icon.textContent = active ? 'Ⅱ' : '▶';
    action.textContent = active ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', `${active ? 'Pause' : 'Play'} The Cyber Music Lover Radio`);
    if (!active) {
      stopMetadata();
      showTrack();
    }
  }

  function unavailable() {
    request += 1;
    pending = false;
    audio.pause();
    render('UNAVAILABLE · RETRY', false);
  }

  toggle.addEventListener('click', async () => {
    const current = ++request;
    if (pending || !audio.paused) {
      pending = false;
      audio.pause();
      // Release the live connection so the next play rejoins the broadcast.
      audio.load();
      render('PAUSED', false);
      return;
    }

    pending = true;
    render('CONNECTING…', true);
    try {
      if (audio.error) audio.load();
      await audio.play();
      if (current === request) pending = false;
    } catch (error) {
      if (current !== request) return;
      unavailable();
    }
  });

  audio.addEventListener('playing', () => {
    pending = false;
    render('LIVE RADIO', true);
    refreshTrack();
  });
  audio.addEventListener('waiting', () => {
    if (!audio.paused) render('BUFFERING…', true);
  });
  audio.addEventListener('pause', () => {
    render(audio.error ? 'UNAVAILABLE · RETRY' : 'PAUSED', false);
  });
  audio.addEventListener('ended', () => render('PRESS PLAY', false));
  audio.addEventListener('error', unavailable);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMetadata();
    else if (!audio.paused) refreshTrack();
  });

  // Keep native controls available when JavaScript is disabled.
  audio.controls = false;
  audio.hidden = true;
  toggle.hidden = false;
})();
