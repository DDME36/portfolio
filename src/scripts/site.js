const root = document.documentElement;
// ผู้ใช้ที่ปิดแอนิเมชันในระบบ (Windows: Animation effects) จะได้การเคลื่อนไหวแบบเบา: ไม่มี parallax, ตัวอักษรวิ่ง และเคอร์เซอร์พิเศษ แต่เนื้อหายังเลื่อนเข้ามาตามปกติ
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reduced = false;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ───────── Hero intro ───────── */
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

/* ───────── Menu ───────── */
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.getElementById('menu');
const label = document.querySelector('[data-menu-label]');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  label.textContent = open ? 'Close' : 'Menu';
  if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
}
toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });


/* ───────── Split headings into words (Thai-aware) ───────── */
const segmenter = 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
document.querySelectorAll('.rise').forEach((h) => {
  const text = h.textContent.replace(/\s+/g, ' ').trim();
  h.setAttribute('aria-label', text);
  let n = 0;
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const parts = segmenter ? Array.from(segmenter.segment(child.textContent), (x) => x.segment) : [child.textContent];
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement('span');
          outer.className = 'rw';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--w', n++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    });
  };
  walk(h);
});

/* ───────── Rolling-text links ───────── */
document.querySelectorAll('[data-roll]').forEach((el) => {
  const t = el.textContent.trim();
  el.textContent = '';
  const roll = document.createElement('span');
  roll.className = 'roll';
  roll.dataset.text = t;
  roll.setAttribute('aria-label', t);
  const inner = document.createElement('span');
  inner.setAttribute('aria-hidden', 'true');
  inner.textContent = t;
  roll.appendChild(inner);
  el.appendChild(roll);
});

/* ───────── Progress bar ───────── */
const bar = document.createElement('div');
bar.className = 'progress';
bar.setAttribute('aria-hidden', 'true');
document.body.appendChild(bar);

/* ───────── Magnetic elements ───────── */
document.querySelectorAll('[data-magnet]').forEach((el) => {
  if (calm) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'translate .15s';
    el.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`;
  });
  el.addEventListener('pointerleave', () => {
    el.style.transition = 'translate .7s cubic-bezier(.16,1,.3,1)';
    el.style.translate = '0 0';
  });
});

/* ───────── Reveal on enter ───────── */
const revealTargets = document.querySelectorAll('[data-reveal], .rise, .work, .foot-name');
const markIn = (el) => { el.classList.add('is-in'); el.querySelector?.('.work-media')?.classList.add('is-in'); };
if (reduced || !('IntersectionObserver' in window)) {
  revealTargets.forEach(markIn);
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      markIn(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach((el) => io.observe(el));
}

/* ───────── Statement: words light up with scroll ───────── */
const wordBlocks = Array.from(document.querySelectorAll('[data-words]')).map((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', words.join(' '));
  el.textContent = '';
  const spans = words.map((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word + (i < words.length - 1 ? ' ' : '');
    el.appendChild(span);
    return span;
  });
  return { el, spans };
});

/* ───────── Number reels ───────── */
const numbers = Array.from(document.querySelectorAll('[data-value]')).map((fig) => {
  const value = fig.dataset.value;
  fig.textContent = '';
  const reels = [];
  value.split('').forEach((ch, i) => {
    const digit = document.createElement('span');
    digit.className = 'digit';
    digit.setAttribute('aria-hidden', 'true');
    const reel = document.createElement('span');
    reel.className = 'reel';
    reel.style.setProperty('--i', i);
    for (let n = 0; n < 10; n++) {
      const s = document.createElement('span');
      s.textContent = n;
      reel.appendChild(s);
    }
    digit.appendChild(reel);
    fig.appendChild(digit);
    reels.push({ reel, target: Number(ch) });
  });
  return { fig, reels, done: false };
});

/* ───────── Marquee: speed follows scroll ───────── */
const marquee = document.querySelector('[data-marquee] .marquee-track');
let marqueeAnim = null;
if (marquee && !calm && marquee.animate) {
  marqueeAnim = marquee.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 38000, iterations: Infinity, easing: 'linear' });
}

/* ───────── Scroll-linked effects ───────── */
const expands = Array.from(document.querySelectorAll('[data-expand]'));
const parallax = Array.from(document.querySelectorAll('[data-parallax]'));
const heroLetters = Array.from(document.querySelectorAll('.hero-name .ch'));
const heroTexts = Array.from(document.querySelectorAll('.hero-intro, .hero-meta'));
const drifters = Array.from(document.querySelectorAll('.sec-title, .contact-title'));
let lastY = window.scrollY;
let velocity = 0;
let ticking = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;


  const sy = window.scrollY;
  bar.style.transform = `scaleX(${clamp(sy / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4)})`;

  if (!calm) {
    const hp = clamp(sy / vh);
    heroLetters.forEach((ch, i) => {
      ch.style.translate = `0 ${(-hp * (30 + i * 55)).toFixed(1)}px`;
    });
    heroTexts.forEach((el) => { el.style.translate = `0 ${(-hp * 60).toFixed(1)}px`; });
    drifters.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = (r.top + r.height / 2) / vh;
      el.style.translate = `${((c - 0.5) * 110).toFixed(1)}px 0`;
    });
  }

  wordBlocks.forEach(({ el, spans }) => {
    const r = el.getBoundingClientRect();
    const p = reduced ? 1 : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.18));
    const lit = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < lit));
  });

  expands.forEach((el) => {
    const r = el.getBoundingClientRect();
    const p = reduced ? 1 : clamp(-r.top / (r.height - vh));
    el.querySelector('.expand-frame').style.setProperty('--p', p.toFixed(3));
  });

  if (!calm) parallax.forEach((img) => {
    const host = img.parentElement.getBoundingClientRect();
    if (host.bottom < -100 || host.top > vh + 100) return;
    const center = host.top + host.height / 2 - vh / 2;
    img.style.setProperty('--py', `${(center * -0.07).toFixed(1)}px`);
  });

  numbers.forEach((n) => {
    if (n.done) return;
    const r = n.fig.getBoundingClientRect();
    if (r.top < vh * 0.9) {
      n.done = true;
      n.reels.forEach(({ reel, target }) => { reel.style.transform = `translateY(${-target * 10}%)`; });
    }
  });

  if (marqueeAnim) {
    const y = window.scrollY;
    velocity = velocity * 0.85 + (y - lastY) * 0.15;
    lastY = y;
    marqueeAnim.playbackRate = 1 + clamp(Math.abs(velocity) / 4, 0, 8) * (velocity < 0 ? -1 : 1);
  }
}

if (reduced) {
  numbers.forEach((n) => n.reels.forEach(({ reel, target }) => { reel.style.transform = `translateY(${-target * 10}%)`; }));
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
update();

/* decay the marquee speed back to its idle pace when scrolling stops */
if (marqueeAnim) {
  setInterval(() => {
    if (Math.abs(velocity) > 0.05) { velocity *= 0.7; marqueeAnim.playbackRate = 1 + clamp(Math.abs(velocity) / 4, 0, 8) * (velocity < 0 ? -1 : 1); }
    else marqueeAnim.playbackRate = 1;
  }, 60);
}

/* ───────── Cursor ───────── */
if (!calm && window.matchMedia('(pointer: fine)').matches) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span></span>';
  document.body.appendChild(cursor);
  const text = cursor.querySelector('span');
  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    cursor.classList.add('is-on');
    const target = e.target.closest?.('[data-cursor]');
    cursor.classList.toggle('is-big', Boolean(target));
    text.textContent = target ? target.dataset.cursor : '';
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  (function loop() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* ───────── Lightbox ───────── */
const dialog = document.getElementById('imageLightbox');
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
      root.classList.add('dialog-open');
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
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => root.classList.remove('dialog-open'));
}
