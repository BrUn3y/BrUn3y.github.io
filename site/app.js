const clock = document.querySelector('#clock');
const localTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false,
});

function updateClock() {
  const now = new Date();
  clock.textContent = localTime.format(now);
  clock.dateTime = now.toISOString();
}
updateClock();
setInterval(updateClock, 30_000);

const currentYear = String(new Date().getFullYear());
document.querySelector('#year').textContent = currentYear;
document.querySelector('#copyright-year').textContent = currentYear;

const featuredAds = [...document.querySelectorAll('[data-featured-project]')];
const featuredStorageKey = 'brun3y-featured-project';
let featuredIndex = -1;

function showFeaturedProject() {
  let previousIndex = featuredIndex;
  try {
    const previousProject = localStorage.getItem(featuredStorageKey);
    if (previousProject) {
      previousIndex = featuredAds.findIndex(ad => ad.dataset.featuredProject === previousProject);
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  featuredIndex = previousIndex < 0
    ? Math.floor(Math.random() * featuredAds.length)
    : (previousIndex + 1) % featuredAds.length;

  for (const [index, ad] of featuredAds.entries()) ad.hidden = index !== featuredIndex;
  try {
    localStorage.setItem(featuredStorageKey, featuredAds[featuredIndex].dataset.featuredProject);
  } catch {
    // The ad still works when preferences cannot be saved.
  }
}

if (featuredAds.length) {
  showFeaturedProject();
  addEventListener('pageshow', event => {
    if (event.persisted) showFeaturedProject();
  });
}

const filters = [...document.querySelectorAll('[data-filter]')];
const projects = [...document.querySelectorAll('[data-category]')];
const projectCount = document.querySelector('#project-count');

for (const filter of filters) {
  filter.addEventListener('click', () => {
    for (const button of filters) {
      const selected = button === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    let count = 0;
    for (const project of projects) {
      const visible = filter.dataset.filter === 'all' || project.dataset.category.split(' ').includes(filter.dataset.filter);
      project.hidden = !visible;
      if (visible) count++;
    }
    projectCount.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
  });
}

const navLinks = [...document.querySelectorAll('.nav-link')];
if ('IntersectionObserver' in window) {
  const visibleSections = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSections.add(entry.target.id);
      else visibleSections.delete(entry.target.id);
    }
    const activeLink = navLinks.find((link) => visibleSections.has(link.hash.slice(1)));
    if (!activeLink) return;
    for (const link of navLinks) {
      const active = link === activeLink;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-5% 0px -35% 0px' });
  for (const link of navLinks) observer.observe(document.querySelector(link.hash));
}
