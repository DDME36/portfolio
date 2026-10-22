// ═══════════════════════════════════════════════════════
//  Blueprint × Paper — scroll storytelling engine
//  Lenis (desktop wheel only) + GSAP ScrollTrigger
// ═══════════════════════════════════════════════════════

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduce = reduceQuery.matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE = "expo.out";

// Motion choice changed mid-visit: rebuild from scratch rather than patch every tween
reduceQuery.addEventListener("change", () => window.location.reload());

const main = document.querySelector(".story");
const chapters = [...document.querySelectorAll(".chapter")];
const wide = () => window.innerWidth >= 768;

// ─── Smooth wheel scroll (never hijack touch) ─────────
let lenis = null;
if (!reduce && fine) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initAnchors() {
  document.querySelectorAll("[data-scroll-to]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  });
}

// ─── Thai-aware word & line splitting ─────────────────
// Thai has no spaces between words, so split on Intl.Segmenter boundaries.
const segmenter = new Intl.Segmenter("th", { granularity: "word" });

function wrapWords(el) {
  const nodes = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, " ");
      for (const { segment } of segmenter.segment(text)) {
        if (/^\s+$/.test(segment)) {
          nodes.push(document.createTextNode(" "));
        } else {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = segment;
          nodes.push(span);
        }
      }
    } else {
      const span = document.createElement("span");
      span.className = "word";
      span.append(node.cloneNode(true));
      nodes.push(span);
    }
  });
  el.textContent = "";
  el.append(...nodes);
  return nodes;
}

function splitLines(el) {
  const nodes = wrapWords(el);
  const lines = [];
  let top = null;
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const t = node.offsetTop;
      if (top === null || Math.abs(t - top) > 4) {
        lines.push([]);
        top = t;
      }
    }
    if (lines.length) lines[lines.length - 1].push(node);
  });
  el.textContent = "";
  return lines.map((group) => {
    const line = document.createElement("span");
    const inner = document.createElement("span");
    line.className = "line";
    inner.className = "line-inner";
    group.forEach((n) => inner.append(...(n.nodeType === Node.ELEMENT_NODE ? n.childNodes : [n])));
    line.append(inner);
    el.append(line);
    return inner;
  });
}

function initLineReveals() {
  document.querySelectorAll("[data-lines]").forEach((el) => {
    const original = el.innerHTML.trim();
    el.innerHTML = original;
    // opacity, not visibility: hidden headings would vanish from the outline
    gsap.set(el, { opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const lines = splitLines(el);
        gsap.set(el, { opacity: 1 });
        gsap.from(lines, {
          yPercent: 110,
          rotation: 3,
          duration: 1.2,
          ease: EASE,
          stagger: 0.09,
          // Restore real text so later resizes re-flow naturally
          onComplete: () => { el.innerHTML = original; },
        });
      },
    });
  });
}

// ─── Hero: name scatters upward, glow drifts ──────────
async function initHero() {
  const hero = document.querySelector(".hero");
  const chars = gsap.utils.toArray(".hero .ch");
  // GSAP must read the letters at rest, not halfway through the CSS intro
  await Promise.allSettled(chars.flatMap((c) => c.getAnimations()).map((a) => a.finished));
  const scroll = { trigger: hero, start: "top top", end: "bottom 20%", scrub: true };
  gsap.fromTo(chars, { y: 0, rotation: 0, opacity: 1 }, {
    y: (i) => -(90 + (i % 4) * 55),
    rotation: (i) => (i % 2 ? 9 : -7),
    opacity: 0,
    ease: "none",
    stagger: { each: 0.015, from: "start" },
    scrollTrigger: scroll,
  });
  gsap.fromTo([".hero-meta", ".hero-foot"], { y: 0, opacity: 1 }, { y: -120, opacity: 0, ease: "none", scrollTrigger: scroll });
  gsap.to(".hero-glow", { yPercent: 25, scale: 1.2, ease: "none", scrollTrigger: { ...scroll, end: "bottom top" } });
}

// Orange band drifts on its own, reverses and skews with scroll speed
function initMarquee() {
  const band = document.querySelector(".marquee");
  const track = band.querySelector(".marquee-track");
  let x = 0, skew = 0, velocity = 0, dir = -1, visible = true;
  ScrollTrigger.create({
    trigger: band,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => { visible = self.isActive; },
    onUpdate: (self) => {
      velocity = self.getVelocity();
      if (Math.abs(velocity) > 50) dir = velocity > 0 ? -1 : 1;
    },
  });
  gsap.ticker.add((time, delta) => {
    if (!visible) return;
    const half = track.scrollWidth / 2;
    const boost = 1 + Math.min(Math.abs(velocity) / 400, 5);
    x = gsap.utils.wrap(-half, 0, x + dir * 0.05 * delta * boost);
    skew += (gsap.utils.clamp(-14, 14, -velocity / 180) - skew) * 0.12;
    velocity *= 0.92;
    track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
  });
}

// ─── Morph: the portrait flies from the hero into the story, like a slide morph ─
function initMorph() {
  const el = document.querySelector(".morph");
  const slots = [...document.querySelectorAll("[data-morph-slot]")];
  let A, B;

  const measure = () => {
    const mainRect = main.getBoundingClientRect();
    [A, B] = slots.map((slot) => {
      const r = slot.getBoundingClientRect();
      const cs = getComputedStyle(slot);
      const w = slot.offsetWidth;
      const h = slot.offsetHeight;
      return {
        x: r.left - mainRect.left + r.width / 2 - w / 2,
        y: r.top - mainRect.top + r.height / 2 - h / 2,
        w, h,
        rot: parseFloat(cs.rotate) || 0,
        rad: parseFloat(cs.borderTopLeftRadius) || 0,
      };
    });
  };

  const render = (p) => {
    const t = gsap.parseEase("power2.inOut")(p);
    const lerp = (a, b) => a + (b - a) * t;
    el.style.width = `${lerp(A.w, B.w)}px`;
    el.style.height = `${lerp(A.h, B.h)}px`;
    el.style.borderRadius = `${lerp(A.rad, B.rad)}px`;
    el.style.transform = `translate3d(${lerp(A.x, B.x)}px, ${lerp(A.y, B.y)}px, 0) rotate(${lerp(A.rot, B.rot)}deg)`;
  };

  const enable = () => {
    main.classList.add("has-morph");
    const mainTop = () => main.getBoundingClientRect().top + window.scrollY;
    ScrollTrigger.create({
      // From "portrait centred in the hero" to "portrait centred in the story"
      start: () => { measure(); return Math.max(0, mainTop() + A.y + A.h / 2 - window.innerHeight / 2); },
      end: () => mainTop() + B.y + B.h / 2 - window.innerHeight / 2,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    measure();
    render(0);
  };

  // Let the hero portrait finish its own reveal before handing over to the morph layer
  Promise.all(slots[0].getAnimations().map((a) => a.finished)).then(enable, enable);
}

// ─── Chapter panels grow over the previous chapter ────
function initGrow() {
  document.querySelectorAll(".grow").forEach((section) => {
    const bg = section.querySelector(".chapter-bg");
    const circle = section.classList.contains("grow--circle");
    gsap.fromTo(
      bg,
      { clipPath: circle ? "circle(6% at 50% 100%)" : "inset(5% 5% 0% 5% round 56px)" },
      {
        clipPath: circle ? "circle(150% at 50% 100%)" : "inset(0% 0% 0% 0% round 0px)",
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: circle ? "top top" : "top 15%", scrub: true },
      }
    );
  });
}

// ─── Statement: words light up as current reaches them ─
function initStatement() {
  const text = document.querySelector("[data-scrub-words]");
  const words = wrapWords(text).filter((n) => n.nodeType === Node.ELEMENT_NODE);
  const pin = fine && window.innerWidth > 1024;
  gsap.fromTo(
    words,
    { opacity: 0.12, y: 12 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: pin
        ? { trigger: ".statement", start: "top top", end: "+=110%", pin: true, scrub: 0.6 }
        : { trigger: text, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
    }
  );
}

// ─── Bento: tiles fly in and assemble with scroll ─────
function initBento() {
  const tiles = gsap.utils.toArray("[data-tile]");
  const counters = gsap.utils.toArray("[data-count]");
  counters.forEach((el) => { el.textContent = "0"; });

  const light = () => {
    tiles.forEach((t) => t.classList.add("is-in"));
    counters.forEach((el) => {
      const obj = { v: 0 };
      gsap.to(obj, { v: Number(el.dataset.count), duration: 1.8, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(obj.v); } });
    });
  };

  if (wide()) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".bento", start: "top 92%", end: "top 30%", scrub: 0.8 } });
    tiles.forEach((tile, i) => {
      const [x, y, r] = tile.dataset.from.split(",").map(Number);
      tl.from(tile, { x, y, rotation: r, scale: 0.86, opacity: 0, ease: "power3.out", duration: 1 }, i * 0.07);
    });
  } else {
    tiles.forEach((tile) => {
      gsap.from(tile, { y: 70, scale: 0.94, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: tile, start: "top 92%", once: true } });
    });
  }
  ScrollTrigger.create({ trigger: ".tile--toeic", start: "top 75%", once: true, onEnter: light });

  // Spotlight that follows the pointer inside each tile
  document.querySelector(".bento").addEventListener("pointermove", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
    tile.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

// ─── Journey: vertical scroll rides a horizontal timeline ─
function initJourney() {
  const section = document.querySelector(".journey");
  const viewport = section.querySelector(".journey-viewport");
  const track = section.querySelector(".journey-track");
  const progress = section.querySelector(".journey-progress");
  const cards = [...track.children];

  if (!wide()) {
    gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: track, start: "top 70%", end: "bottom 70%", scrub: true } });
    cards.forEach((card) => {
      ScrollTrigger.create({ trigger: card, start: "top 70%", end: "bottom 70%", toggleClass: "is-live" });
      gsap.from(card, { x: 40, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: card, start: "top 90%", once: true } });
    });
    return;
  }

  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const ride = { trigger: section, start: "top top", end: () => "+=" + distance(), scrub: 0.8, invalidateOnRefresh: true };
  const move = gsap.to(track, { x: () => -distance(), ease: "none", scrollTrigger: { ...ride, pin: true } });
  gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: ride });

  cards.forEach((card) => {
    gsap.from(card, {
      y: 80, rotation: 4, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: move, start: "left 100%", end: "left 65%", scrub: true },
    });
    ScrollTrigger.create({ trigger: card, containerAnimation: move, start: "left 55%", end: "right 45%", toggleClass: "is-live" });
  });
}

// ─── Work: each project card sinks back as the next stacks over it ─
function initStack() {
  const cards = gsap.utils.toArray(".stack-card");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.timeline({
      scrollTrigger: {
        trigger: next,
        start: "top bottom",
        end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
      .to(card, { scale: 0.9, ease: "none" }, 0)
      .to(card.querySelector(".stack-shade"), { opacity: 0.5, ease: "none" }, 0);
  });
  cards.forEach((card) => {
    gsap.from(card.querySelector(".stack-copy"), { y: 60, opacity: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: card, start: "top 70%", once: true } });
  });
}

// ─── Parallax: images drift inside their frames ───────
function initParallax() {
  document.querySelectorAll("[data-parallax-img]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -15 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // Certificates tip up from a drawing-table angle
  document.querySelectorAll("[data-tilt-in]").forEach((el, i) => {
    gsap.fromTo(el, { rotationX: 32, y: 140, opacity: 0.15 }, {
      rotationX: 0, y: 0, opacity: 1, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: `top ${55 - (i % 2) * 8}%`, scrub: true },
    });
  });

  document.querySelectorAll("[data-drift]").forEach((line) => {
    const d = parseFloat(line.dataset.drift);
    gsap.fromTo(line, { xPercent: d * 12 }, {
      xPercent: 0, ease: "none",
      scrollTrigger: { trigger: ".contact-title", start: "top bottom", end: "bottom 45%", scrub: true },
    });
  });
}

// ─── The wire ─────────────────────────────────────────
const wire = { svg: document.querySelector(".wire"), startY: 0, length: 0, x: 0, nodes: [] };

function buildWire() {
  const { svg } = wire;
  const header = document.querySelector(".site-header");
  const mainRect = main.getBoundingClientRect();
  const x = parseFloat(getComputedStyle(header).paddingLeft) + 6;

  const nodes = [...document.querySelectorAll("[data-node], [data-wire-end]")].map((el) => {
    const r = el.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const isEnd = el.hasAttribute("data-wire-end");
    return {
      y: r.top - mainRect.top + (isEnd ? r.height / 2 : Math.min(r.height / 2, fontSize * 0.62)),
      to: r.left - mainRect.left - 14,
    };
  });

  const startY = document.querySelector(".hero").offsetTop + 24;
  const endY = nodes[nodes.length - 1].y;
  const d = `M ${x} ${startY} V ${endY}`;
  svg.querySelector(".wire-base").setAttribute("d", d);
  const live = svg.querySelector(".wire-live");
  live.setAttribute("d", d);
  Object.assign(wire, { startY, x, length: endY - startY });
  live.style.strokeDasharray = `${wire.length} ${wire.length}`;

  const group = svg.querySelector(".wire-nodes");
  group.textContent = "";
  const ns = "http://www.w3.org/2000/svg";
  wire.nodes = nodes.map((n) => {
    const len = Math.max(0, n.to - x);
    const base = document.createElementNS(ns, "path");
    base.setAttribute("d", `M ${x} ${n.y} H ${n.to}`);
    base.setAttribute("class", "wire-base");
    const branch = document.createElementNS(ns, "path");
    branch.setAttribute("d", `M ${x} ${n.y} H ${n.to}`);
    branch.setAttribute("class", "wire-live wire-branch");
    branch.style.strokeDasharray = `${len} ${len}`;
    branch.style.strokeDashoffset = reduce ? 0 : len;
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", n.y);
    dot.setAttribute("r", 3.5);
    dot.setAttribute("class", "wire-node");
    group.append(base, branch, dot);
    return { y: n.y, len, branch, dot, live: false };
  });
  drawWire();
}

function drawWire() {
  const live = wire.svg.querySelector(".wire-live");
  const tip = wire.svg.querySelector(".wire-tip");
  if (reduce) {
    live.style.strokeDashoffset = 0;
    wire.nodes.forEach((n) => n.dot.classList.add("is-live"));
    return;
  }
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  // Tip sits at 60% of the viewport, easing to the bottom edge as the read ends
  const tipY = window.scrollY + window.innerHeight * (0.6 + 0.4 * progress) - main.offsetTop;
  const drawn = gsap.utils.clamp(0, wire.length, tipY - wire.startY);
  live.style.strokeDashoffset = wire.length - drawn;
  tip.setAttribute("cx", wire.x);
  tip.setAttribute("cy", wire.startY + drawn);

  wire.nodes.forEach((n) => {
    const on = n.y <= wire.startY + drawn + 1;
    if (on === n.live) return;
    n.live = on;
    n.dot.classList.toggle("is-live", on);
    gsap.to(n.branch, { strokeDashoffset: on ? 0 : n.len, duration: on ? 0.9 : 0.4, ease: on ? EASE : "power2.in" });
  });
}

function initWire() {
  ScrollTrigger.addEventListener("refresh", buildWire);
  ScrollTrigger.create({ trigger: main, start: "top top", end: "bottom bottom", onUpdate: drawWire });
}

// ─── Chapter index + header theme ─────────────────────
function initChapters() {
  const names = [...new Set(chapters.map((c) => c.dataset.chapter))];
  const nameEl = document.querySelector(".chapter-name");
  const countEl = document.querySelector(".chapter-current");
  const navLinks = [...document.querySelectorAll(".site-nav a")];

  const activate = (chapter) => {
    const idx = names.indexOf(chapter.dataset.chapter);
    document.documentElement.classList.toggle("theme-dark", chapter.dataset.theme === "dark");
    if (nameEl.textContent !== chapter.dataset.chapter) {
      const swap = () => {
        nameEl.textContent = chapter.dataset.chapter;
        countEl.textContent = String(idx + 1).padStart(2, "0");
      };
      if (reduce) swap();
      else gsap.timeline()
        .to([nameEl, countEl], { yPercent: -60, autoAlpha: 0, duration: 0.25, ease: "power2.in" })
        .add(swap)
        .fromTo([nameEl, countEl], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: EASE });
    }
    navLinks.forEach((a) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target?.dataset.chapter === chapter.dataset.chapter) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  chapters.forEach((chapter) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: "top 40px",
      end: "bottom 40px",
      onToggle: (self) => self.isActive && activate(chapter),
    });
  });
  activate(chapters[0]);
}

// ─── Cursor ───────────────────────────────────────────
function initCursor() {
  if (reduce || !fine) return;
  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor-label");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.4, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.4, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    document.body.classList.add("has-cursor");
    xTo(e.clientX);
    yTo(e.clientY);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => document.body.classList.remove("has-cursor"));

  document.addEventListener("pointerover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button");
    cursor.classList.toggle("is-label", !!labelled);
    cursor.classList.toggle("is-link", !labelled && !!link);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });
}

// ─── Lightbox ─────────────────────────────────────────
function initLightbox() {
  const dialog = document.querySelector(".lightbox");
  const img = dialog.querySelector(".lightbox-img");
  const triggers = [...document.querySelectorAll("[data-lightbox]")];
  let index = 0;

  const show = (i) => {
    index = (i + triggers.length) % triggers.length;
    const source = triggers[index].querySelector("img");
    img.src = triggers[index].dataset.lightbox;
    img.alt = source?.alt || triggers[index].getAttribute("aria-label") || triggers[index].textContent.trim();
  };

  triggers.forEach((btn, i) => btn.addEventListener("click", () => {
    show(i);
    dialog.showModal();
    lenis?.stop();
  }));
  dialog.addEventListener("close", () => lenis?.start());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}

// ─── Local time (Chiang Mai) ──────────────────────────
function initClock() {
  const clocks = document.querySelectorAll(".clock");
  const fmt = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
  const tick = () => {
    const now = new Date();
    clocks.forEach((el) => {
      el.textContent = `${fmt.format(now)} น.`;
      el.dateTime = now.toISOString();
    });
  };
  tick();
  setInterval(tick, 30000);
}

// ─── Boot ─────────────────────────────────────────────
// The hero intro is pure CSS, so scroll scenes can wait until the first paint
// is done; yielding between steps keeps every task short on slow phones.
const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));
const whenIdle = () => new Promise((resolve) =>
  "requestIdleCallback" in window ? requestIdleCallback(resolve, { timeout: 800 }) : setTimeout(resolve, 200)
);

async function boot() {
  initAnchors();
  initLightbox();
  initClock();
  await whenIdle();

  if (reduce) {
    document.querySelectorAll(".journey-card").forEach((el) => el.classList.add("is-live"));
  } else {
    // Pinned scenes first: later triggers must measure positions with their pin spacing
    initStatement();
    await yieldToMain();
    initJourney();
    await whenIdle();
    initGrow();
    initMarquee();
    await yieldToMain();
    initBento();
    await whenIdle();
    initStack();
    await yieldToMain();
    initParallax();
    await yieldToMain();
    initLineReveals();
    initCursor();
    await whenIdle();
    await initHero();
    initMorph();
  }
  await yieldToMain();
  initChapters();
  initWire();
  buildWire();
  // ScrollTrigger refreshes itself on load; fonts can land later and shift layout
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

boot();
