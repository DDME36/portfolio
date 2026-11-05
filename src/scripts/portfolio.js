const dialog = document.getElementById('imageLightbox');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroScene = document.querySelector('.hero-scene');
if (heroScene) {
  const finePointer = window.matchMedia('(pointer: fine)');
  const resetPan = () => {
    heroScene.style.removeProperty('--pan-x');
    heroScene.style.removeProperty('--pan-y');
  };
  heroScene.addEventListener('pointermove', (event) => {
    if (!finePointer.matches) return;
    const bounds = heroScene.getBoundingClientRect();
    const depth = reducedMotion.matches ? .008 : .025;
    heroScene.style.setProperty('--pan-x', `${(event.clientX - bounds.left - bounds.width / 2) * depth}px`);
    heroScene.style.setProperty('--pan-y', `${(event.clientY - bounds.top - bounds.height / 2) * depth}px`);
  });
  heroScene.addEventListener('pointerleave', resetPan);
  reducedMotion.addEventListener('change', resetPan);
}
if (typeof IntersectionObserver === 'function') {
  const elements = document.querySelectorAll('.reveal, .reveal-row, .reveal-picture, .practice-track');
  const loops = document.querySelectorAll('[data-loop]');
  const loopObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => { target.toggleAttribute('data-visible', isIntersecting); });
  });
  loops.forEach(element => loopObserver.observe(element));
  document.addEventListener('visibilitychange', () => {
    document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      const index = Array.from(target.parentElement.children).indexOf(target);
      const columns = window.innerWidth <= 600 ? 2 : 3;
      const picture = target.matches('.reveal-picture');
      const heading = target.matches('h2, h3');
      const row = target.matches('.reveal-row');
      const tool = target.matches('.tool-item');
      const banner = target.matches('.practice-track');
      const reduced = reducedMotion.matches;
      const travel = reduced ? 6 : 20;
      const delay = (index % columns) * (reduced ? 45 : 65);
      const frames = picture ? [
        { clipPath: target.closest('.credential') ? 'inset(100% 0 0 0)' : target.closest('.project-secondary') ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0)' },
      ] : heading ? [
        { clipPath: 'inset(0 0 100% 0)', transform: `translateY(${travel}px)` },
        { clipPath: 'inset(0)', transform: 'none' },
      ] : banner || target.matches('.contact-email') ? [
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0)' },
      ] : [
        { opacity: .4, transform: row && !tool ? `translateX(${target.matches('.education-entry') ? travel : -travel}px)` : `translateY(${travel}px)` },
        { opacity: 1, transform: 'none' },
      ];
      target.animate(frames, { duration: picture ? reduced ? 420 : 620 : heading || banner ? reduced ? 340 : 500 : reduced ? 280 : 400, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      if (tool) {
        target.querySelector('img').animate([
          { transform: `translateY(${reduced ? 6 : 16}px) scale(${reduced ? .9 : .7}) rotate(${reduced ? -4 : -12}deg)` },
          { transform: `translateY(0) scale(${reduced ? 1.015 : 1.06}) rotate(1deg)`, offset: .7 },
          { transform: 'none' },
        ], { duration: reduced ? 360 : 520, delay: delay + 35, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      }
    });
  }, { threshold: 0.08 });
  elements.forEach(element => observer.observe(element));
}

if (dialog && typeof dialog.showModal === 'function') {
  const image = document.getElementById('lightboxImage');
  const caption = document.getElementById('lightboxCaption');
  const counter = document.getElementById('lightboxCounter');
  const imageLinks = Array.from(document.querySelectorAll('[data-lightbox]'));
  let gallery = [];
  let currentIndex = 0;

  function showImage(index) {
    currentIndex = (index + gallery.length) % gallery.length;
    const link = gallery[currentIndex];
    image.src = link.href;
    image.alt = link.dataset.caption;
    caption.textContent = link.dataset.caption;
    counter.textContent = `${currentIndex + 1} / ${gallery.length}`;
  }

  imageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      gallery = imageLinks.filter((item) => item.dataset.gallery === link.dataset.gallery);
      showImage(gallery.indexOf(link));
      dialog.showModal();
      document.documentElement.classList.add('dialog-open');
    });
  });

  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-image-prev]').addEventListener('click', () => showImage(currentIndex - 1));
  dialog.querySelector('[data-image-next]').addEventListener('click', () => showImage(currentIndex + 1));

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
  });
}
