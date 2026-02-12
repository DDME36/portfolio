// ═══════════════════════════════════════════════════════
//  Portfolio Script — Premium Smooth Experience
// ═══════════════════════════════════════════════════════

(() => {
  "use strict";

  // ─── DOM Cache ───────────────────────────────────
  const container = document.getElementById("main-container");
  const sections = document.querySelectorAll(".section");
  const navDots = document.querySelectorAll(".nav-dot");
  const cursor = document.querySelector(".custom-cursor");
  const cursorDot = document.querySelector(".custom-cursor-dot");
  const progressBar = document.querySelector(".scroll-progress-bar");
  const loader = document.querySelector(".page-loader");

  let currentSection = 0;
  let rafId = null;
  let mouseX = 0,
    mouseY = 0;
  let cursorX = 0,
    cursorY = 0;

  // ─── Premium Easing ──────────────────────────────
  const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

  // ═══════════════════════════════════════════════════
  //  1. PAGE LOADER
  // ═══════════════════════════════════════════════════
  function initLoader() {
    if (!loader) return;

    // Prevent scrolling while loading
    document.body.classList.add("is-loading");

    window.addEventListener("load", () => {
      setTimeout(() => {
        loader.classList.add("loaded");
        document.body.classList.remove("is-loading");

        // Trigger hero section animations after loader
        setTimeout(() => {
          const hero = document.getElementById("section1");
          if (hero) hero.classList.add("active");
        }, 300);

        // Remove loader from DOM after animation
        setTimeout(() => {
          loader.style.display = "none";
        }, 1200);
      }, 800);
    });
  }

  // ═══════════════════════════════════════════════════
  //  2. CUSTOM CURSOR
  // ═══════════════════════════════════════════════════
  function initCursor() {
    if (!cursor || !cursorDot) return;

    // Only show on desktop
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.body.classList.add("has-custom-cursor");

      document.addEventListener(
        "mousemove",
        (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
        },
        { passive: true },
      );

      // Smooth cursor follow with lerp
      function updateCursor() {
        const speed = 0.15;
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;

        cursor.style.transform = `translate3d(${cursorX - 20}px, ${cursorY - 20}px, 0)`;
        cursorDot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;

        requestAnimationFrame(updateCursor);
      }
      updateCursor();

      // Cursor hover effects
      const hoverTargets = document.querySelectorAll(
        "a, button, .project-card, .cert-scroll-item, .main-cert-image, .nav-dot, .social-icon, .cta-btn, .badge-item",
      );
      hoverTargets.forEach((el) => {
        el.addEventListener(
          "mouseenter",
          () => {
            cursor.classList.add("cursor-hover");
          },
          { passive: true },
        );
        el.addEventListener(
          "mouseleave",
          () => {
            cursor.classList.remove("cursor-hover");
          },
          { passive: true },
        );
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  3. SCROLL PROGRESS BAR
  // ═══════════════════════════════════════════════════
  function initScrollProgress() {
    if (!progressBar || !container) return;

    let ticking = false;

    container.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollTop = container.scrollTop;
            const scrollHeight =
              container.scrollHeight - container.clientHeight;
            const progress =
              scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );

    // Also handle window scroll for mobile (no snap)
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollTop =
              window.scrollY || document.documentElement.scrollTop;
            const scrollHeight =
              document.documentElement.scrollHeight - window.innerHeight;
            const progress =
              scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  // ═══════════════════════════════════════════════════
  //  4. INTERSECTION OBSERVER — Section Activation
  // ═══════════════════════════════════════════════════
  function initSectionObserver() {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: "-5% 0px -5% 0px",
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Remove active from all, add to current
          sections.forEach((s) => s.classList.remove("active"));
          entry.target.classList.add("active");

          // Update nav dots
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

  // ─── Nav Dots Click ──────────────────────────────
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

  // ─── Keyboard navigation ─────────────────────────
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
  //  5. PARALLAX — RAF-based, GPU accelerated
  // ═══════════════════════════════════════════════════
  function initParallax() {
    const layerShapes = document.querySelectorAll(".layer-shape");
    if (layerShapes.length === 0) return;

    let scrollY = 0;
    let targetScrollY = 0;
    let mX = 0,
      mY = 0;
    let targetMX = 0,
      targetMY = 0;

    container.addEventListener(
      "scroll",
      () => {
        targetScrollY = container.scrollTop;
      },
      { passive: true },
    );

    document.addEventListener(
      "mousemove",
      (e) => {
        targetMX = e.clientX / window.innerWidth - 0.5;
        targetMY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true },
    );

    function updateParallax() {
      // Lerp for buttery smoothness
      scrollY += (targetScrollY - scrollY) * 0.08;
      mX += (targetMX - mX) * 0.06;
      mY += (targetMY - mY) * 0.06;

      layerShapes.forEach((shape) => {
        const speed = parseFloat(shape.dataset.speed) || 0.5;
        const yPos = -(scrollY * speed * 0.3);
        const xMouse = mX * 30 * speed;
        const yMouse = mY * 30 * speed;

        shape.style.transform = `translate3d(${xMouse}px, ${yPos + yMouse}px, 0)`;
      });

      requestAnimationFrame(updateParallax);
    }
    updateParallax();

    // Spotlight effect
    const spotlight = document.getElementById("spotlight");
    if (spotlight) {
      document.addEventListener(
        "mousemove",
        (e) => {
          spotlight.style.transform = `translate3d(${e.clientX - 300}px, ${e.clientY - 300}px, 0)`;
        },
        { passive: true },
      );
    }
  }

  // ═══════════════════════════════════════════════════
  //  6. TYPING EFFECT
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

    // Start after loader finishes
    setTimeout(typeChar, 1800);
  }

  // ═══════════════════════════════════════════════════
  //  7. ANIMATED COUNTERS
  // ═══════════════════════════════════════════════════
  function initCounters() {
    const counters = document.querySelectorAll(".skill-percentage");
    if (counters.length === 0) return;

    let animated = false;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            counters.forEach((counter, i) => {
              const target = parseInt(counter.textContent);
              if (isNaN(target)) return;

              counter.textContent = "0%";

              setTimeout(() => {
                animateCounter(counter, 0, target, 1200);
              }, i * 100);
            });
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );

    const skillsSection = document.getElementById("section3");
    if (skillsSection) counterObserver.observe(skillsSection);
  }

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * eased);

      el.textContent = current + "%";

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // ═══════════════════════════════════════════════════
  //  8. WATER FILL ANIMATION
  // ═══════════════════════════════════════════════════
  function initWaterFill() {
    const waterFills = document.querySelectorAll(".water-fill");
    if (waterFills.length === 0) return;

    let filled = false;

    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !filled) {
            filled = true;
            waterFills.forEach((fill, i) => {
              const percentage = fill.getAttribute("data-percentage");
              if (percentage) {
                setTimeout(
                  () => {
                    fill.style.height = percentage + "%";
                  },
                  200 + i * 120,
                );
              }
            });
            skillsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );

    const skillsSection = document.getElementById("section3");
    if (skillsSection) skillsObserver.observe(skillsSection);
  }

  // ═══════════════════════════════════════════════════
  //  9. IMAGE LIGHTBOX — Smooth transitions
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

    // Show lightbox with smooth transition
    lightbox.style.display = "flex";
    // Force reflow for transition
    lightbox.offsetHeight;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox(event) {
    if (
      event &&
      event.target.id !== "imageLightbox" &&
      !event.target.closest(".lightbox-close")
    )
      return;

    const lightbox = document.getElementById("imageLightbox");
    if (!lightbox) return;

    lightbox.classList.remove("active");
    document.body.style.overflow = "";

    // Wait for transition to complete before hiding
    setTimeout(() => {
      if (!lightbox.classList.contains("active")) {
        lightbox.style.display = "none";
      }
    }, 400);

    if (event) event.stopPropagation();
  }

  function navigateLightbox(direction, event) {
    if (event) event.stopPropagation();

    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = allCertImages.length - 1;
    else if (currentImageIndex >= allCertImages.length) currentImageIndex = 0;

    const lightboxImage = document.getElementById("lightboxImage");
    if (!lightboxImage) return;

    // Add transition class for image swap
    lightboxImage.style.opacity = "0";
    lightboxImage.style.transform = `translate3d(${direction * 30}px, 0, 0)`;

    setTimeout(() => {
      lightboxImage.src = allCertImages[currentImageIndex];
      lightboxImage.style.transform = `translate3d(${-direction * 30}px, 0, 0)`;

      // Force reflow
      lightboxImage.offsetHeight;

      lightboxImage.style.opacity = "1";
      lightboxImage.style.transform = "translate3d(0, 0, 0)";
    }, 200);
  }

  // ═══════════════════════════════════════════════════
  //  10. GRID PATTERN INJECTION
  // ═══════════════════════════════════════════════════
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
  //  11. STAGGER REVEAL — Animate children on scroll
  // ═══════════════════════════════════════════════════
  function initStaggerReveal() {
    const revealItems = document.querySelectorAll(".stagger-reveal");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // ═══════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════
  function init() {
    initLoader();
    initGridPatterns();
    initSectionObserver();
    initNavDots();
    initKeyboard();
    initParallax();
    initScrollProgress();
    initCursor();
    initTypingEffect();
    initCounters();
    initWaterFill();
    initStaggerReveal();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ─── Global API ──────────────────────────────────
  window.scrollToSection = scrollToSection;
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.navigateLightbox = navigateLightbox;
})();
