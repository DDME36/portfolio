// ═══════════════════════════════════════════════════════
//  Single-Line Diagram — scroll storytelling engine
//  Lenis (desktop wheel only) + GSAP ScrollTrigger
// ═══════════════════════════════════════════════════════

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reduce = reduceQuery.matches;
const fine = fineQuery.matches;
const EASE = "expo.out";

// Motion choice changed mid-visit: rebuild from scratch rather than patch every tween
reduceQuery.addEventListener("change", () => window.location.reload());

const main = document.querySelector(".story");
const chapters = [...document.querySelectorAll(".chapter")];

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

// ─── Reveals ──────────────────────────────────────────
function initLineReveals() {
  document.querySelectorAll("[data-lines]").forEach((el) => {
    const original = el.innerHTML.trim();
    el.innerHTML = original;
    gsap.set(el, { autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const lines = splitLines(el);
        gsap.set(el, { autoAlpha: 1 });
        gsap.from(lines, {
          yPercent: 110,
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

function initBlockReveals() {
  gsap.set("[data-reveal]", { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (batch) => {
      batch.forEach((el) => el.classList.add("is-in"));
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08, overwrite: true });
    },
  });

  document.querySelectorAll("[data-reveal-clip]").forEach((frame) => {
    gsap.fromTo(
      frame,
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.6,
        ease: "power4.inOut",
        scrollTrigger: { trigger: frame, start: "top 85%", once: true },
      }
    );
  });
}

// ─── Parallax: images drift inside their frames, hero layers peel apart ─
function initParallax() {
  document.querySelectorAll("[data-parallax-img]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -15 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  const hero = document.querySelector(".hero");
  hero.querySelectorAll("[data-depth]").forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth);
    gsap.to(layer, {
      y: () => -window.innerHeight * depth,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
  });
  gsap.to(".hero-inner", {
    autoAlpha: 0.15,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "center top", end: "bottom top", scrub: true },
  });

  // Ambient glow floats slower than the content for the whole read
  gsap.to(".backdrop-glow", {
    yPercent: -18,
    rotate: 8,
    ease: "none",
    scrollTrigger: { trigger: main, start: "top top", end: "bottom bottom", scrub: 1.5 },
  });

  document.querySelectorAll("[data-drift]").forEach((line) => {
    const d = parseFloat(line.dataset.drift);
    gsap.fromTo(
      line,
      { xPercent: d * 8 },
      {
        xPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: ".contact-title", start: "top bottom", end: "bottom 40%", scrub: true },
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
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: pin
        ? { trigger: ".statement", start: "top top", end: "+=110%", pin: true, scrub: 0.6 }
        : { trigger: text, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
    }
  );
}

// ─── Journey: the active entry carries current ────────
function initTimeline() {
  document.querySelectorAll("[data-live]").forEach((item) => {
    ScrollTrigger.create({ trigger: item, start: "top 62%", end: "bottom 38%", toggleClass: "is-live" });
  });
}

// ─── Credentials gallery: vertical scroll → horizontal travel ─
function initGallery() {
  const gallery = document.querySelector("[data-horizontal]");
  const viewport = gallery.querySelector(".gallery-viewport");
  const track = gallery.querySelector(".gallery-track");
  if (!fine || window.innerWidth <= 1024) return;

  gallery.closest(".chapter").classList.add("is-pinned-gallery");
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: gallery,
      start: "center center",
      end: () => "+=" + distance(),
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
}

// ─── The wire ─────────────────────────────────────────
const wire = {
  svg: document.querySelector(".wire"),
  startY: 0,
  length: 0,
  nodes: [],
};

function buildWire() {
  const { svg } = wire;
  const header = document.querySelector(".site-header");
  const mainTop = main.getBoundingClientRect().top + window.scrollY;
  const mainLeft = main.getBoundingClientRect().left;
  const x = parseFloat(getComputedStyle(header).paddingLeft) + 6;

  const nodes = [...document.querySelectorAll("[data-node], [data-wire-end]")].map((el) => {
    const r = el.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const isEnd = el.hasAttribute("data-wire-end");
    return {
      y: r.top + window.scrollY - mainTop + (isEnd ? r.height / 2 : Math.min(r.height / 2, fontSize * 0.62)),
      to: r.left - mainLeft - 14,
    };
  });

  const startY = document.querySelector(".hero").offsetTop + 24;
  const endY = nodes[nodes.length - 1].y;
  const d = `M ${x} ${startY} V ${endY}`;
  svg.querySelector(".wire-base").setAttribute("d", d);
  const live = svg.querySelector(".wire-live");
  live.setAttribute("d", d);
  wire.startY = startY;
  wire.length = endY - startY;
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
    dot.setAttribute("r", 4.5);
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
  const mainTop = main.offsetTop;
  // Tip sits at 60% of the viewport, easing to the bottom edge as the read ends
  const tipY = window.scrollY + window.innerHeight * (0.6 + 0.4 * progress) - mainTop;
  const drawn = gsap.utils.clamp(0, wire.length, tipY - wire.startY);
  live.style.strokeDashoffset = wire.length - drawn;
  tip.setAttribute("cx", live.getAttribute("d").split(" ")[1]);
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

// ─── Chapter index + background tone ──────────────────
function initChapters() {
  const names = [...new Set(chapters.map((c) => c.dataset.chapter))];
  const nameEl = document.querySelector(".chapter-name");
  const countEl = document.querySelector(".chapter-current");
  const navLinks = [...document.querySelectorAll(".site-nav a")];

  const activate = (chapter) => {
    const idx = names.indexOf(chapter.dataset.chapter);
    document.documentElement.style.setProperty("--bg", chapter.dataset.tone);
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
      a.toggleAttribute("aria-current", target?.dataset.chapter === chapter.dataset.chapter);
      if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "true");
    });
  };

  chapters.forEach((chapter) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && activate(chapter),
    });
  });
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
    img.alt = source ? source.alt : "";
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
  const el = document.querySelector(".clock");
  const fmt = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
  const tick = () => {
    const now = new Date();
    el.textContent = `${fmt.format(now)} น.`;
    el.dateTime = now.toISOString();
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

  // Pinned scenes first: later triggers must measure positions with their pin spacing
  if (!reduce) {
    initStatement();
    await yieldToMain();
    initGallery();
    await yieldToMain();
  }
  initChapters();
  initWire();
  await yieldToMain();

  if (!reduce) {
    initCursor();
    initLineReveals();
    await yieldToMain();
    initBlockReveals();
    await yieldToMain();
    initParallax();
    initTimeline();
  } else {
    document.querySelectorAll(".timeline-item").forEach((el) => el.classList.add("is-live"));
  }

  await yieldToMain();
  buildWire();
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === "complete") ScrollTrigger.refresh();
  else window.addEventListener("load", () => ScrollTrigger.refresh());
}

boot();
