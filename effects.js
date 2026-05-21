var typed = new Typed('#typed', {
  stringsElement: '#typed-strings',
  loop: true,
  typeSpeed: 100,
  backSpeed: 20,
  showCursor: true,
  smartBackspace: false,
});

document.addEventListener('aos:in:skill-bars', ({ detail }) => {
  $(".progress-bar").each(function (i) {
    $(this).delay(500 * i).animate({
      width: $(this).attr('aria-valuenow') + '%'
    }, 500);
  });
});

$(".nav-item i").mouseover(function (e) {
  console.log($(e.target).text());
  switch ($(e.target).text()) {
    case "home": $("<span> Home</span>").insertAfter($(e.target));
      break;
    case "engineering": $("<span> Skills</span>").insertAfter($(e.target));
      break;
    case "description": $("<span> About</span>").insertAfter($(e.target));
      break;
    case "work": $("<span> Experience</span>").insertAfter($(e.target));
      break;
    case "code": $("<span> Projects</span>").insertAfter($(e.target));
      break;
    case "email": $("<span> Contact me</span>").insertAfter($(e.target));
      break;
  }
}).mouseout(function (e) {
  $(e.target).next().remove();
})

const parallaxSections = document.querySelectorAll('.parallax');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let parallaxFrame = null;

function getParallaxValue(section, propertyName, fallbackValue) {
  const value = parseFloat(window.getComputedStyle(section).getPropertyValue(propertyName));
  return Number.isFinite(value) ? value : fallbackValue;
}

function updateParallax() {
  parallaxFrame = null;

  if (reducedMotionQuery.matches) {
    parallaxSections.forEach((section) => {
      section.style.setProperty('--parallax-shift-x', '0px');
      section.style.setProperty('--parallax-shift-y', '0px');
    });
    return;
  }

  const viewportHeight = window.innerHeight || 1;
  const viewportCenter = viewportHeight / 2;

  parallaxSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + (rect.height / 2);
    const distanceFromCenter = (sectionCenter - viewportCenter) / viewportHeight;
    const clampedDistance = Math.max(-1, Math.min(1, distanceFromCenter));
    const direction = getParallaxValue(section, '--parallax-direction', 1);
    const rotation = getParallaxValue(section, '--parallax-rotation', 0);
    const angle = getParallaxValue(section, '--parallax-angle', 0);
    const shift = clampedDistance * 160 * direction;
    const localAngle = ((angle - rotation) * Math.PI) / 180;
    const shiftX = Math.round(Math.cos(localAngle) * shift);
    const shiftY = Math.round(Math.sin(localAngle) * shift);

    section.style.setProperty('--parallax-shift-x', `${shiftX}px`);
    section.style.setProperty('--parallax-shift-y', `${shiftY}px`);
  });
}

function requestParallaxUpdate() {
  if (parallaxFrame !== null) {
    return;
  }

  parallaxFrame = window.requestAnimationFrame(updateParallax);
}

window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
window.addEventListener('resize', requestParallaxUpdate);

if (typeof reducedMotionQuery.addEventListener === 'function') {
  reducedMotionQuery.addEventListener('change', requestParallaxUpdate);
} else if (typeof reducedMotionQuery.addListener === 'function') {
  reducedMotionQuery.addListener(requestParallaxUpdate);
}

requestParallaxUpdate();
