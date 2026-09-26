import { homeHighlights, homeSteps } from './data';

const stepsRoot = document.getElementById('home-steps');
if (stepsRoot) {
  stepsRoot.innerHTML = homeSteps
    .map(
      (step) =>
        '<li class="home-step-card">' +
          '<span class="home-step-number">' + step.number + '</span>' +
          '<h3 class="home-card-title">' + step.title + '</h3>' +
          '<p class="home-card-copy">' + step.description + '</p>' +
        '</li>',
    )
    .join('');
}

const highlightsRoot = document.getElementById('home-highlights');
if (highlightsRoot) {
  highlightsRoot.innerHTML = homeHighlights
    .map(
      (item) =>
        '<article class="home-feature-card">' +
          '<span class="home-feature-label">' + item.label + '</span>' +
          '<h3 class="home-card-title">' + item.title + '</h3>' +
          '<p class="home-card-copy">' + item.description + '</p>' +
        '</article>',
    )
    .join('');
}

const homeSections = document.querySelectorAll<HTMLElement>('.home-page main > section');
if (
  homeSections.length > 0 &&
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
  );

  homeSections.forEach((section) => {
    section.classList.add('home-reveal');
    revealObserver.observe(section);
  });
}
