// ═══════════════════════════════════════════════════════
//  Portfolio Script — Awwwards Interactive Motion Engine
// ═══════════════════════════════════════════════════════

(() => {
  "use strict";

  // ─── DOM Cache ───────────────────────────────────
  const container = document.getElementById("main-container");
  const sections = document.querySelectorAll(".section");
  const navDots = document.querySelectorAll(".nav-dot");
  const cursor = document.querySelector(".custom-cursor");
  const cursorDot = document.querySelector(".custom-cursor-dot");
  const cursorText = document.querySelector(".cursor-badge-text");
  const progressBar = document.querySelector(".scroll-progress-bar");
  const loader = document.querySelector(".page-loader");
  const loaderNumber = document.querySelector(".loader-number");
  const loaderFill = document.querySelector(".loader-progress-bar-fill");
  const loaderStatus = document.querySelector(".loader-text-status");

  let currentSection = 0;
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let cursorDotX = 0, cursorDotY = 0;
  
  // ─── Technical Status Messages ────────────────────
  const techStatuses = [
    "SYNCHRONIZING POWER...",
    "LOADING DATASETS...",
    "CALIBRATING AI ENGINE...",
    "RENDER GRID READY...",
    "ACCESS GRANTED"
  ];

  // ═══════════════════════════════════════════════════
  //  1. ADVANCED DYNAMIC PAGE PRELOADER
  // ═══════════════════════════════════════════════════
  function initLoader() {
    if (!loader || !loaderNumber || !loaderFill) return;

    document.body.classList.add("is-loading");
    
    let progress = 0;
    const duration = 1600; // ms
    const startTime = performance.now();

    function updateProgress(timestamp) {
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Beautiful ease-out progress physics
      const easedT = 1 - Math.pow(1 - t, 3);
      progress = Math.round(easedT * 100);

      // Render percentage & bar width
      loaderNumber.textContent = progress.toString().padStart(2, '0');
      loaderFill.style.width = `${progress}%`;

      // technical logs switcher
      const statusIdx = Math.min(Math.floor(easedT * techStatuses.length), techStatuses.length - 1);
      loaderStatus.textContent = techStatuses[statusIdx];

      if (t < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        // Load finished
        setTimeout(() => {
          loader.classList.add("loaded");
          document.body.classList.remove("is-loading");

          // Staggered launch animations
          setTimeout(() => {
            const hero = document.getElementById("section1");
            if (hero) hero.classList.add("active");
            initTypingEffect();
          }, 400);

          // Purge loader from layout
          setTimeout(() => {
            loader.style.display = "none";
          }, 1400);
        }, 300);
      }
    }

    requestAnimationFrame(updateProgress);
  }

  // ═══════════════════════════════════════════════════
  //  2. DUAL-STAGE CURSOR WITH CONTEXT BADGES
  // ═══════════════════════════════════════════════════
  function initCursor() {
    if (!cursor || !cursorDot) return;

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.body.classList.add("has-custom-cursor");

      document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }, { passive: true });

      // Butter-smooth spring interpolation (lerp)
      function updateCursorPositions() {
        const ringSpeed = 0.12;
        const dotSpeed = 0.3;

        cursorX += (mouseX - cursorX) * ringSpeed;
        cursorY += (mouseY - cursorY) * ringSpeed;
        
        cursorDotX += (mouseX - cursorDotX) * dotSpeed;
        cursorDotY += (mouseY - cursorDotY) * dotSpeed;

        // GPU accelerated translates
        cursor.style.transform = `translate3d(${cursorX - (cursor.offsetWidth / 2)}px, ${cursorY - (cursor.offsetHeight / 2)}px, 0)`;
        cursorDot.style.transform = `translate3d(${cursorDotX - 3}px, ${cursorDotY - 3}px, 0)`;

        requestAnimationFrame(updateCursorPositions);
      }
      updateCursorPositions();

      // Dynamic Contextual Hover Badge States
      const viewTargets = document.querySelectorAll(".project-card, .cert-scroll-item, .main-cert-image");
      const exploreTargets = document.querySelectorAll(".cta-btn, .social-icon");
      const hoverTargets = document.querySelectorAll("a, button, .nav-dot, .badge-item");

      // Card hovering: VIEW badge
      viewTargets.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursor.classList.add("cursor-view");
          if (cursorText) cursorText.textContent = "VIEW";
        });
        el.addEventListener("mouseleave", () => {
          cursor.classList.remove("cursor-view");
        });
      });

      // Primary Actions: EXPLORE badge
      exploreTargets.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursor.classList.add("cursor-explore");
          if (cursorText) cursorText.textContent = "EXPLORE";
        });
        el.addEventListener("mouseleave", () => {
          cursor.classList.remove("cursor-explore");
        });
      });

      // Standard buttons: Scale circle
      hoverTargets.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          if (!cursor.classList.contains("cursor-view") && !cursor.classList.contains("cursor-explore")) {
            cursor.classList.add("cursor-hover");
          }
        });
        el.addEventListener("mouseleave", () => {
          cursor.classList.remove("cursor-hover");
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  3. HIGH-PERFORMANCE MAGNETIC PULL INTERACTION
  // ═══════════════════════════════════════════════════
  function initMagnetics() {
    // Disable magnetics on mobile
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const magneticElements = document.querySelectorAll(".cta-btn, .social-icon, .nav-dot");

    magneticElements.forEach((el) => {
      // Add visual wrapper structure for clean offsets
      el.classList.add("magnetic-item");

      el.addEventListener("mousemove", (e) => {
        const bound = el.getBoundingClientRect();
        const centerX = bound.left + bound.width / 2;
        const centerY = bound.top + bound.height / 2;
        
        // Calculate offset from mouse to button center
        const offsetLeft = e.clientX - centerX;
        const offsetTop = e.clientY - centerY;

        // Pull values (Awwwards 35% magnetic capture threshold)
        const pullX = offsetLeft * 0.35;
        const pullY = offsetTop * 0.35;

        el.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate3d(0, 0, 0)";
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  4. MOUSE 3D CARD HOVER TILT
  // ═══════════════════════════════════════════════════
  function initCardTilt() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const cards = document.querySelectorAll(".project-card, .main-cert-card");

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const bound = card.getBoundingClientRect();
        const mouseX = e.clientX - bound.left;
        const mouseY = e.clientY - bound.top;
        
        const xPercent = (mouseX / bound.width - 0.5) * 15; // Max 15 degree rotate
        const yPercent = (mouseY / bound.height - 0.5) * -15;

        card.style.transform = `perspective(1000px) rotateX(${yPercent}px) rotateY(${xPercent}px) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = "transform 0.08s ease-out";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        card.style.transition = "transform 0.6s var(--ease-out-expo)";
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  5. STAGGERED CHARACTER & WORD SPLITTING REVEAL
  // ═══════════════════════════════════════════════════
  function initTextSplitting() {
    const splitHeaders = document.querySelectorAll(".text-reveal-split");

    splitHeaders.forEach((header) => {
      const rawText = header.textContent.trim();
      header.textContent = "";
      header.style.visibility = "visible";

      // Split into characters, maintain masks
      const words = rawText.split(" ");
      words.forEach((word) => {
        const wordSpan = document.createElement("span");
        wordSpan.className = "text-mask";
        wordSpan.style.marginRight = "0.25em";

        const chars = Array.from(word);
        chars.forEach((char, idx) => {
          const charSpan = document.createElement("span");
          charSpan.className = "char-reveal";
          charSpan.textContent = char;
          charSpan.style.setProperty("--char-index", idx);
          wordSpan.appendChild(charSpan);
        });

        header.appendChild(wordSpan);
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  6. SCROLL PROGRESS & TIMING
  // ═══════════════════════════════════════════════════
  function initScrollProgress() {
    if (!progressBar) return;

    let ticking = false;

    function updateProgress() {
      if (!ticking) {
        requestAnimationFrame(() => {
          let scrollTop, scrollHeight;
          
          if (window.innerWidth <= 1024) {
            scrollTop = window.scrollY || document.documentElement.scrollTop;
            scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          } else {
            if (!container) return;
            scrollTop = container.scrollTop;
            scrollHeight = container.scrollHeight - container.clientHeight;
          }
          
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          progressBar.style.width = `${Math.min(progress, 100)}%`;
          ticking = false;
        });
        ticking = true;
      }
    }

    if (container) {
      container.addEventListener("scroll", updateProgress, { passive: true });
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
  }

  // ═══════════════════════════════════════════════════
  //  7. INTERSECTION OBSERVER — Section Active states
  // ═══════════════════════════════════════════════════
  function initSectionObserver() {
    const observerOptions = {
      threshold: 0.35,
      rootMargin: "-2% 0px -2% 0px",
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sections.forEach((s) => s.classList.remove("active"));
          entry.target.classList.add("active");

          const idx = Array.from(sections).indexOf(entry.target);
          navDots.forEach((dot, i) => {
            dot.classList.toggle("active", i === idx);
          });
          currentSection = idx;
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  function initNavDots() {
    navDots.forEach((dot, index) => {
      dot.addEventListener("click", () => scrollToSection(index));
    });
  }

  function scrollToSection(index) {
    if (index >= 0 && index < sections.length) {
      sections[index].scrollIntoView({ behavior: "smooth" });
    }
  }

  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      const lightbox = document.getElementById("imageLightbox");
      if (lightbox && lightbox.classList.contains("active")) {
        if (e.key === "Escape") closeLightbox(e);
        else if (e.key === "ArrowLeft") navigateLightbox(-1, e);
        else if (e.key === "ArrowRight") navigateLightbox(1, e);
        return;
      }

      if (e.key === "ArrowDown" && currentSection < sections.length - 1) {
        scrollToSection(currentSection + 1);
      } else if (e.key === "ArrowUp" && currentSection > 0) {
        scrollToSection(currentSection - 1);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  8. GPU-ACCELERATED LERP PARALLAX
  // ═══════════════════════════════════════════════════
  function initParallax() {
    const layerShapes = document.querySelectorAll(".layer-shape");
    if (layerShapes.length === 0) return;

    let scrollY = 0;
    let targetScrollY = 0;
    let mX = 0, mY = 0;
    let targetMX = 0, targetMY = 0;

    if (container) {
      container.addEventListener("scroll", () => {
        targetScrollY = container.scrollTop;
      }, { passive: true });
    }

    document.addEventListener("mousemove", (e) => {
      targetMX = e.clientX / window.innerWidth - 0.5;
      targetMY = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    function updateParallax() {
      scrollY += (targetScrollY - scrollY) * 0.08;
      mX += (targetMX - mX) * 0.06;
      mY += (targetMY - mY) * 0.06;

      layerShapes.forEach((shape) => {
        const speed = parseFloat(shape.dataset.speed) || 0.5;
        const yPos = -(scrollY * speed * 0.25);
        const xMouse = mX * 30 * speed;
        const yMouse = mY * 30 * speed;

        shape.style.transform = `translate3d(${xMouse}px, ${yPos + yMouse}px, 0)`;
      });

      requestAnimationFrame(updateParallax);
    }
    updateParallax();

    // Technical spotlight follow
    const spotlight = document.getElementById("spotlight");
    if (spotlight) {
      document.addEventListener("mousemove", (e) => {
        spotlight.style.transform = `translate3d(${e.clientX - 300}px, ${e.clientY - 300}px, 0)`;
      }, { passive: true });
    }
  }

  // ═══════════════════════════════════════════════════
  //  9. TYPING EFFECT
  // ═══════════════════════════════════════════════════
  function initTypingEffect() {
    const typedEl = document.querySelector(".typed-text");
    if (!typedEl) return;

    const text = typedEl.dataset.text || typedEl.textContent;
    typedEl.textContent = "";
    typedEl.style.visibility = "visible";

    let charIndex = 0;

    function typeChar() {
      if (charIndex < text.length) {
        typedEl.textContent += text.charAt(charIndex);
        charIndex++;
        setTimeout(typeChar, 60 + Math.random() * 40);
      } else {
        typedEl.classList.add("typing-done");
      }
    }

    setTimeout(typeChar, 1000);
  }

  // ═══════════════════════════════════════════════════
  //  10. INTERACTION COUNTERS & WATER PROGRESS
  // ═══════════════════════════════════════════════════
  function initCounters() {
    const counters = document.querySelectorAll(".skill-percentage");
    if (counters.length === 0) return;

    let animated = false;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          counters.forEach((counter, i) => {
            const target = parseInt(counter.textContent);
            if (isNaN(target)) return;

            counter.textContent = "0%";
            setTimeout(() => {
              animateCounter(counter, 0, target, 1200);
            }, i * 80);
          });
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const skillsSection = document.getElementById("section3");
    if (skillsSection) counterObserver.observe(skillsSection);
  }

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = current + "%";

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  function initWaterFill() {
    const waterFills = document.querySelectorAll(".water-fill");
    if (waterFills.length === 0) return;

    let filled = false;

    const skillsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !filled) {
          filled = true;
          waterFills.forEach((fill, i) => {
            const percentage = fill.getAttribute("data-percentage");
            if (percentage) {
              setTimeout(() => {
                fill.style.height = percentage + "%";
              }, 200 + i * 100);
            }
          });
          skillsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const skillsSection = document.getElementById("section3");
    if (skillsSection) skillsObserver.observe(skillsSection);
  }

  // ═══════════════════════════════════════════════════
  //  11. LIGHTBOX IMAGES CAROUSEL
  // ═══════════════════════════════════════════════════
  const allCertImages = [
    "images/c1.png",
    "images/c2.png",
    "images/c3.png",
    "images/c4.png",
    "images/coe.jpg",
    "images/toeic1.png",
  ];
  let currentImageIndex = 0;

  function openLightbox(imageSrc) {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    if (!lightbox || !lightboxImage) return;

    currentImageIndex = allCertImages.indexOf(imageSrc);
    if (currentImageIndex === -1) currentImageIndex = 0;

    lightboxImage.src = imageSrc;
    lightbox.style.display = "flex";
    lightbox.offsetHeight; // Force reflow
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox(event) {
    if (event && event.target.id !== "imageLightbox" && !event.target.closest(".lightbox-close")) return;

    const lightbox = document.getElementById("imageLightbox");
    if (!lightbox) return;

    lightbox.classList.remove("active");
    document.body.style.overflow = "";

    setTimeout(() => {
      if (!lightbox.classList.contains("active")) {
        lightbox.style.display = "none";
      }
    }, 450);

    if (event) event.stopPropagation();
  }

  function navigateLightbox(direction, event) {
    if (event) event.stopPropagation();

    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = allCertImages.length - 1;
    else if (currentImageIndex >= allCertImages.length) currentImageIndex = 0;

    const lightboxImage = document.getElementById("lightboxImage");
    if (!lightboxImage) return;

    lightboxImage.style.opacity = "0";
    lightboxImage.style.transform = `translate3d(${direction * 30}px, 0, 0)`;

    setTimeout(() => {
      lightboxImage.src = allCertImages[currentImageIndex];
      lightboxImage.style.transform = `translate3d(${-direction * 30}px, 0, 0)`;
      lightboxImage.offsetHeight; // force reflow
      lightboxImage.style.opacity = "1";
      lightboxImage.style.transform = "translate3d(0, 0, 0)";
    }, 200);
  }

  function initGridPatterns() {
    sections.forEach((section) => {
      if (!section.querySelector(".grid-pattern")) {
        const grid = document.createElement("div");
        grid.className = "grid-pattern";
        section.insertBefore(grid, section.firstChild);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  12. THAILAND STANDARD TIME ENGINE (GMT+7)
  // ═══════════════════════════════════════════════════
  function initLiveClock() {
    const clockEl = document.getElementById("live-clock");
    if (!clockEl) return;

    function updateClock() {
      const now = new Date();
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
        clockEl.textContent = formatter.format(now);
      } catch (err) {
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const bangkokTime = new Date(utc + (3600000 * 7));
        const hours = bangkokTime.getHours().toString().padStart(2, '0');
        const minutes = bangkokTime.getMinutes().toString().padStart(2, '0');
        const seconds = bangkokTime.getSeconds().toString().padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
      }
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // ═══════════════════════════════════════════════════
  //  CORE SYSTEM INITIALIZATION
  // ═══════════════════════════════════════════════════
  function init() {
    initLoader();
    initGridPatterns();
    initTextSplitting();
    initSectionObserver();
    initNavDots();
    initKeyboard();
    initParallax();
    initScrollProgress();
    initCursor();
    initMagnetics();
    initCardTilt();
    initCounters();
    initWaterFill();
    initLiveClock();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Global APIs
  window.scrollToSection = scrollToSection;
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.navigateLightbox = navigateLightbox;
})();
