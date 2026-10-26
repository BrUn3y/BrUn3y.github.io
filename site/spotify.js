/**
 * spotify.js — Pulls live track data from the spotify-github-profile widget
 * (https://github.com/kittinan/spotify-github-profile) and injects it into
 * the BRUN3YAMP player. No credentials required — the widget endpoint is public.
 *
 * DOM targets (already in index.html):
 *   .player-track   — song/artist marquee line
 *   .player-quality — "MY SOUNDTRACK  STEREO" quality row
 *   .player-open    — the Spotify deep-link button
 */

(function () {
  'use strict';

  var WIDGET_URL =
    'https://spotify-github-profile.kittinanx.com/api/view' +
    '?uid=brun3y&cover_image=true&theme=default&show_offline=false' +
    '&background_color=121212&interchange=false&profanity=false&hide_remaster=false';

  /** Strip HTML tags from a string (widget inlines <img class="logo"> in some nodes). */
  function stripTags(str) {
    return str.replace(/<[^>]*>/g, '').trim();
  }

  /** Parse the SVG string and return { artist, song, isPlaying, trackUrl } or null. */
  function parseWidget(svgText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(svgText, 'image/svg+xml');
    var fo = doc.querySelector('foreignObject');
    if (!fo) return null;

    // The foreignObject contains an HTML fragment rendered inside the SVG.
    // Re-parse it as HTML so class selectors work normally.
    var html = fo.innerHTML || fo.textContent || '';
    var tmp = document.createElement('div');
    tmp.innerHTML = html;

    var artistEl = tmp.querySelector('.artist');
    var songEl = tmp.querySelector('.song');
    var playingEl = tmp.querySelector('.playing');
    var notPlayEl = tmp.querySelector('.not-play');
    var linkEl = tmp.querySelector('a[href]');

    var artist = artistEl ? stripTags(artistEl.innerHTML) : '';
    var song = songEl ? stripTags(songEl.innerHTML) : '';
    var isPlaying = Boolean(playingEl) && !notPlayEl;
    var trackUrl = linkEl ? linkEl.getAttribute('href') : null;

    if (!artist && !song) return null;
    return { artist: artist, song: song, isPlaying: isPlaying, trackUrl: trackUrl };
  }

  /** Update the BRUN3YAMP player with real Spotify data. */
  function applyToPlayer(data) {
    var trackEl = document.querySelector('.player-track');
    var qualityEl = document.querySelector('.player-quality');
    var openEl = document.querySelector('.player-open');

    if (trackEl) {
      var label = data.song && data.artist
        ? data.song.toUpperCase() + ' — ' + data.artist.toUpperCase()
        : (data.song || data.artist || 'HEAVY MUSIC. HEAVY CODE.').toUpperCase();
      trackEl.textContent = label;
    }

    if (qualityEl) {
      var statusText = data.isPlaying ? 'NOW PLAYING' : 'RECENTLY PLAYED';
      // Preserve the inner <span>STEREO</span> structure
      var stereoSpan = qualityEl.querySelector('span');
      qualityEl.textContent = statusText + ' ';
      if (stereoSpan) {
        qualityEl.appendChild(stereoSpan);
      } else {
        var span = document.createElement('span');
        span.textContent = 'STEREO';
        qualityEl.appendChild(span);
      }
    }

    if (openEl && data.trackUrl) {
      openEl.setAttribute('href', data.trackUrl);
    }
  }

  /** Main: fetch → parse → apply. Silently no-ops on any error. */
  function refresh() {
    fetch(WIDGET_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('widget fetch failed');
        return res.text();
      })
      .then(function (svgText) {
        var data = parseWidget(svgText);
        if (data) applyToPlayer(data);
      })
      .catch(function () {
        // Widget unavailable — static fallback text stays in place.
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();
