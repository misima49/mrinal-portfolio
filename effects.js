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

function createPhotographyLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'photography-lightbox';
  overlay.setAttribute('hidden', '');
  overlay.setAttribute('aria-hidden', 'true');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'photography-lightbox-close';
  closeButton.setAttribute('aria-label', 'Close full size image');
  closeButton.textContent = '×';

  const image = document.createElement('img');
  image.className = 'photography-lightbox-image';
  image.alt = '';

  overlay.appendChild(closeButton);
  overlay.appendChild(image);
  document.body.appendChild(overlay);

  const closeLightbox = () => {
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-visible');
    image.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
  };

  closeButton.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-visible')) {
      closeLightbox();
    }
  });

  return {
    open(src, alt) {
      image.src = src;
      image.alt = alt || '';
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-visible');
      document.body.classList.add('lightbox-open');
    }
  };
}

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

  const lightbox = createPhotographyLightbox();

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

    const imageLink = document.createElement('a');
    imageLink.className = 'carousel-slide-link';
    imageLink.href = slide.fullSrc || slide.src;
    imageLink.addEventListener('click', (event) => {
      event.preventDefault();
      lightbox.open(slide.fullSrc || slide.src, slide.alt || slide.title || `Photo ${index + 1}`);
    });

    const image = document.createElement('img');
    image.className = 'd-block w-100';
    image.dataset.src = slide.src;
    image.alt = slide.alt || slide.title || `Photo ${index + 1}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    imageLink.appendChild(image);
    content.appendChild(imageLink);

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

  const items = Array.from(inner.querySelectorAll('.carousel-item'));
  const loadSlideImage = (itemIndex) => {
    const slideItem = items[itemIndex];

    if (!slideItem) {
      return;
    }

    const slideImage = slideItem.querySelector('img[data-src]');

    if (!slideImage) {
      return;
    }

    slideImage.src = slideImage.dataset.src;
    slideImage.removeAttribute('data-src');
  };

  const loadNearbySlides = (activeIndex) => {
    const indexesToLoad = new Set([
      activeIndex,
      (activeIndex + 1) % items.length,
      (activeIndex - 1 + items.length) % items.length
    ]);

    indexesToLoad.forEach(loadSlideImage);
  };

  loadNearbySlides(0);

  carousel.addEventListener('slid.bs.carousel', (event) => {
    if (typeof event.to === 'number') {
      loadNearbySlides(event.to);
    }
  });

  if (window.bootstrap && typeof window.bootstrap.Carousel === 'function') {
    window.bootstrap.Carousel.getOrCreateInstance(carousel);
  }
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
