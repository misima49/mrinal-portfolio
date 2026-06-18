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
    case "camera_alt": $("<span> Photography</span>").insertAfter($(e.target));
      break;
    case "email": $("<span> Contact me</span>").insertAfter($(e.target));
      break;
  }
}).mouseout(function (e) {
  $(e.target).next().remove();
})

function initializePhotographyCarousel() {
  const carousel = document.querySelector('#photographySlides');

  if (!carousel) {
    return;
  }

  const indicators = carousel.querySelector('.carousel-indicators');
  const inner = carousel.querySelector('.carousel-inner');
  const controls = carousel.querySelectorAll('.carousel-control-prev, .carousel-control-next');
  const slides = Array.isArray(window.photographySlidesData) ? window.photographySlidesData : [];

  if (!indicators || !inner || slides.length === 0) {
    carousel.hidden = true;
    return;
  }

  indicators.replaceChildren();
  inner.replaceChildren();

  slides.forEach((slide, index) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.setAttribute('data-bs-target', '#photographySlides');
    indicator.setAttribute('data-bs-slide-to', index);
    indicator.setAttribute('aria-label', slide.title || `Photo ${index + 1}`);

    if (index === 0) {
      indicator.classList.add('active');
      indicator.setAttribute('aria-current', 'true');
    }

    indicators.appendChild(indicator);

    const item = document.createElement('div');
    item.className = 'carousel-item';

    if (index === 0) {
      item.classList.add('active');
    }

    const content = document.createElement('div');
    content.className = 'carousel-slide-content';

    const image = document.createElement('img');
    image.className = 'd-block w-100';
    image.src = slide.src;
    image.alt = slide.alt || slide.title || `Photo ${index + 1}`;
    content.appendChild(image);

    const caption = document.createElement('div');
    caption.className = 'carousel-caption';

    const title = document.createElement('h5');
    title.textContent = slide.title || `Photo ${index + 1}`;
    caption.appendChild(title);

    if (slide.description) {
      const subtitle = document.createElement('p');
      subtitle.textContent = slide.description;
      caption.appendChild(subtitle);
    }

    content.appendChild(caption);
    item.appendChild(content);
    inner.appendChild(item);
  });

  controls.forEach((control) => {
    control.hidden = slides.length < 2;
  });
}

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
initializePhotographyCarousel();
