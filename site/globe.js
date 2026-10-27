(() => {
  'use strict';

  const canvas = document.querySelector('#web-globe');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const toggle = document.querySelector('#globe-toggle');
  const locate = document.querySelector('#globe-locate');
  const status = document.querySelector('#globe-location');
  const youLegend = document.querySelector('#globe-you');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const radians = Math.PI / 180;
  const center = 160;
  const radius = 130;
  let rotation = -95 * radians;
  let tilt = 18 * radians;
  let land = [];
  let yourSpot = null;
  let paused = motion.matches;
  let visible = false;
  let frame = null;
  let previousTime = 0;

  function sphere(latitude, longitude) {
    const angle = latitude * radians;
    return { longitude: longitude * radians, sin: Math.sin(angle), cos: Math.cos(angle) };
  }

  function project(point) {
    const longitude = point.longitude - rotation;
    const depth = point.cos * Math.cos(longitude);
    return {
      x: center + radius * point.cos * Math.sin(longitude),
      y: center - radius * (Math.cos(tilt) * point.sin - Math.sin(tilt) * depth),
      z: Math.sin(tilt) * point.sin + Math.cos(tilt) * depth,
    };
  }

  // A handful of decorative signals, never a claim about live visitors.
  const regions = [
    [[49.3, -123.1], [34.1, -118.2]],
    [[19.4, -99.1], [20.7, -103.3]],
    [[40.7, -74], [25.8, -80.2]],
    [[-23.6, -46.6], [-34.6, -58.4]],
    [[51.5, -.1], [52.5, 13.4]],
    [[-1.3, 36.8], [-33.9, 18.4], [30, 31.2]],
    [[35.7, 139.7], [1.4, 103.8], [19.1, 72.9]],
    [[-33.9, 151.2], [-36.8, 174.8]],
  ];
  const signals = regions.map((cities) => {
    const [latitude, longitude] = cities[Math.floor(Math.random() * cities.length)];
    return sphere(latitude, longitude);
  });
  const grid = [];
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    grid.push(Array.from({ length: 121 }, (_, i) => sphere(latitude, -180 + i * 3)));
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    grid.push(Array.from({ length: 61 }, (_, i) => sphere(-90 + i * 3, longitude)));
  }

  function marker(point, color, size, time) {
    const position = project(point);
    if (position.z <= .03) return;
    const pulse = 1 + .25 * Math.sin(time / 700);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.globalAlpha = .3;
    context.beginPath();
    context.arc(position.x, position.y, size * 2.3 * pulse, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.beginPath();
    context.arc(position.x, position.y, size, 0, Math.PI * 2);
    context.fill();
  }

  function draw(time = 0) {
    context.clearRect(0, 0, 320, 320);
    const ocean = context.createRadialGradient(112, 105, 12, 175, 170, 170);
    ocean.addColorStop(0, '#4e526b');
    ocean.addColorStop(.5, '#303448');
    ocean.addColorStop(1, '#151925');
    context.fillStyle = ocean;
    context.shadowColor = '#c7b4eb66';
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = '#a898c3';
    context.lineWidth = .8;
    context.stroke();
    context.save();
    context.clip();
    context.strokeStyle = '#c7b4eb25';
    context.lineWidth = .7;
    for (const line of grid) {
      context.beginPath();
      let connected = false;
      for (const point of line) {
        const position = project(point);
        if (position.z < 0) { connected = false; continue; }
        if (connected) context.lineTo(position.x, position.y);
        else context.moveTo(position.x, position.y);
        connected = true;
      }
      context.stroke();
    }
    context.fillStyle = '#c6d8a6';
    for (const point of land) {
      const position = project(point);
      if (position.z <= 0) continue;
      context.globalAlpha = .35 + position.z * .65;
      context.beginPath();
      context.arc(position.x, position.y, 1.8, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    signals.forEach((point, index) => marker(point, '#d4b4ff', 4, time + index * 700));
    if (yourSpot) marker(yourSpot, '#dff693', 5.2, time);
    context.restore();
  }

  function animate(time) {
    frame = null;
    if (!visible || document.hidden || paused) return;
    // Limit drawing to 25 fps and make one gentle turn every 90 seconds.
    if (!previousTime || time - previousTime >= 40) {
      if (previousTime) rotation += Math.min(time - previousTime, 100) * Math.PI * 2 / 90000;
      previousTime = time;
      draw(time);
    }
    frame = requestAnimationFrame(animate);
  }

  function update() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    draw();
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Rotate globe' : 'Pause globe rotation');
    if (visible && !document.hidden && !paused) frame = requestAnimationFrame(animate);
  }

  toggle.addEventListener('click', () => { paused = !paused; update(); });
  motion.addEventListener('change', () => { paused = motion.matches; update(); });
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(canvas);
  } else {
    visible = true;
  }

  locate.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = 'Location is unavailable in this browser.';
      return;
    }
    locate.disabled = true;
    locate.textContent = 'Finding your spot…';
    navigator.geolocation.getCurrentPosition((position) => {
      // Keep a coarse point in this tab only. No reverse lookup or storage.
      const latitude = Math.round(position.coords.latitude);
      const longitude = Math.round(position.coords.longitude);
      yourSpot = sphere(latitude, longitude);
      rotation = longitude * radians;
      tilt = Math.max(-60, Math.min(60, latitude)) * radians;
      youLegend.hidden = false;
      status.textContent = 'Your approximate spot is highlighted.';
      canvas.setAttribute('aria-label', 'Rotating Earth with your approximate location highlighted in lime.');
      locate.disabled = false;
      locate.textContent = 'Show my spot';
      update();
    }, (error) => {
      status.textContent = error.code === 1 ? 'Location permission is off.' : 'Could not find your spot. Try again.';
      locate.disabled = false;
      locate.textContent = 'Show my spot';
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  });

  fetch('site/globe-land.json').then((response) => {
    if (!response.ok) throw new Error('Earth map unavailable');
    return response.json();
  }).then((data) => {
    land = data.points.map(([latitude, longitude]) => sphere(latitude, longitude));
    update();
  }).catch(() => {
    status.textContent = 'A little world, in grid view.';
  });
  update();
})();
