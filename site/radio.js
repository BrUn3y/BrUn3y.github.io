// Direct stream listed by https://mx.radio.net/s/tcmlradio.
(() => {
  'use strict';

  const audio = document.getElementById('radio-audio');
  const toggle = document.getElementById('radio-toggle');
  const status = document.getElementById('radio-status');
  if (!audio || !toggle || !status) return;

  const icon = toggle.querySelector('.play-icon');
  const action = toggle.querySelector('.player-action');
  let request = 0;
  let pending = false;

  function render(message, active) {
    status.textContent = message;
    icon.textContent = active ? 'Ⅱ' : '▶';
    action.textContent = active ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', `${active ? 'Pause' : 'Play'} The Cyber Music Lover Radio`);
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
  });
  audio.addEventListener('waiting', () => {
    if (!audio.paused) render('BUFFERING…', true);
  });
  audio.addEventListener('pause', () => {
    render(audio.error ? 'UNAVAILABLE · RETRY' : 'PAUSED', false);
  });
  audio.addEventListener('ended', () => render('PRESS PLAY', false));
  audio.addEventListener('error', unavailable);

  // Keep native controls available when JavaScript is disabled.
  audio.controls = false;
  audio.hidden = true;
  toggle.hidden = false;
})();
