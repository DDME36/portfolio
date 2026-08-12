// ═══════════════════════════════════════════════════════
//  Portfolio Script — Awwwards Interactive Motion Engine
// ═══════════════════════════════════════════════════════

(() => {
  "use strict";

  // ─── DOM Cache ───────────────────────────────────
  const container = document.getElementById("main-container");
  const sections = document.querySelectorAll(".section");
  const navDots = document.querySelectorAll(".nav-dot");
  const mobileNavLinks = document.querySelectorAll(".mobile-quick-nav a");
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
    "INITIALIZING SYSTEM...",
    "LOADING GRID MODULES...",
    "CALIBRATING VOLTAGE...",
    "GRID SYNCHRONIZATION...",
    "SYSTEM READY"
  ];

  // ═══════════════════════════════════════════════════
  //  1. ADVANCED DYNAMIC PAGE PRELOADER
  // ═══════════════════════════════════════════════════
  function initLoader() {
    if (!loader || !loaderNumber || !loaderFill) return;

    document.body.classList.add("is-loading");
    
    let progress = 0;
    let isLoaded = document.readyState === "complete";
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      loaderNumber.textContent = "100";
      loaderFill.style.width = "100%";
      loaderStatus.textContent = techStatuses[techStatuses.length - 1];
      loader.classList.add("loaded");
      loader.style.display = "none";
      document.body.classList.remove("is-loading");
      const hero = document.getElementById("section1");
      if (hero) hero.classList.add("active");
      initTypingEffect();
      return;
    }

    // Listen to actual page resources loading completion
    window.addEventListener("load", () => {
      isLoaded = true;
    }, { once: true });

    const startTime = performance.now();
    const nominalDuration = isTouchDevice ? 650 : 1050;
    const maxResourceWait = isTouchDevice ? 1200 : 1800;

    // External fonts/icons should never be able to trap visitors behind the loader.
    const loadFailsafe = window.setTimeout(() => {
      isLoaded = true;
    }, maxResourceWait);

    function updateProgress(timestamp) {
      const elapsed = timestamp - startTime;
      
      if (!isLoaded) {
        // Incrementally approach 85% smoothly
        const t = Math.min(elapsed / nominalDuration, 1);
        const easedT = 1 - Math.pow(1 - t, 3); // Cubic ease out
        progress = Math.round(easedT * 85);
        
        loaderNumber.textContent = progress.toString().padStart(2, '0');
        loaderFill.style.width = `${progress}%`;

        const statusIdx = Math.min(Math.floor(easedT * (techStatuses.length - 1)), techStatuses.length - 2);
        loaderStatus.textContent = techStatuses[statusIdx];

        requestAnimationFrame(updateProgress);
      } else {
        // Fast-forward from current progress to 100%
        if (progress < 100) {
          progress += isTouchDevice ? 5 : 2; // Count up quickly once resources are ready
          if (progress > 100) progress = 100;

          loaderNumber.textContent = progress.toString().padStart(2, '0');
          loaderFill.style.width = `${progress}%`;

          // Show final status message
          loaderStatus.textContent = techStatuses[techStatuses.length - 1];

          requestAnimationFrame(updateProgress);
        } else {
          window.clearTimeout(loadFailsafe);
          // Launch sequence when progress reaches 100%
          setTimeout(() => {
            loader.classList.add("loaded");
            document.body.classList.remove("is-loading");

            // Staggered launch animations
            setTimeout(() => {
              const hero = document.getElementById("section1");
              if (hero) hero.classList.add("active");
              initTypingEffect();
            }, isTouchDevice ? 120 : 220);

            // Purge loader from layout
            setTimeout(() => {
              loader.style.display = "none";
            }, isTouchDevice ? 650 : 900);
          }, 160);
        }
      }
    }

    requestAnimationFrame(updateProgress);
  }

  // ═══════════════════════════════════════════════════
  //  2. DUAL-STAGE CURSOR WITH CONTEXT BADGES
  // ═══════════════════════════════════════════════════
  function initCursor() {
    if (!cursor || !cursorDot) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

      // Dynamic Contextual Hover Badge States using Event Delegation
      document.addEventListener("mouseover", (e) => {
        const target = e.target.closest && e.target.closest("[data-cursor], .project-card, .cert-scroll-item, .main-cert-card, .main-cert-image, .cta-btn, .hud-social-node, a, button, .nav-dot, .badge-item");
        if (!target) return;
        
        const label = target.getAttribute("data-cursor");
        if (label) {
          cursor.classList.add("cursor-view");
          if (cursorText) cursorText.textContent = label;
        } else if (target.matches(".project-card, .cert-scroll-item, .main-cert-card, .main-cert-image")) {
          cursor.classList.add("cursor-view");
          if (cursorText) cursorText.textContent = "VIEW";
        } else if (target.matches(".cta-btn, .hud-social-node")) {
          cursor.classList.add("cursor-explore");
          if (cursorText) cursorText.textContent = "EXPLORE";
        } else if (target.matches("a, button, .nav-dot, .badge-item")) {
          if (!cursor.classList.contains("cursor-view") && !cursor.classList.contains("cursor-explore")) {
            cursor.classList.add("cursor-hover");
          }
        }
      });

      document.addEventListener("mouseout", (e) => {
        const target = e.target.closest && e.target.closest("[data-cursor], .project-card, .cert-scroll-item, .main-cert-card, .main-cert-image, .cta-btn, .hud-social-node, a, button, .nav-dot, .badge-item");
        if (!target) return;
        
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && target.contains(relatedTarget)) return;

        cursor.classList.remove("cursor-view", "cursor-explore", "cursor-hover");
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  3. HIGH-PERFORMANCE MAGNETIC PULL INTERACTION
  // ═══════════════════════════════════════════════════
  function initMagnetics() {
    // Disable magnetics on mobile
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = document.querySelectorAll(".project-card, .main-cert-card");

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const bound = card.getBoundingClientRect();
        const mouseX = e.clientX - bound.left;
        const mouseY = e.clientY - bound.top;
        
        const xPercent = (mouseX / bound.width - 0.5) * 7;
        const yPercent = (mouseY / bound.height - 0.5) * -7;

        card.style.transform = `perspective(1000px) rotateX(${yPercent}deg) rotateY(${xPercent}deg) scale3d(1.012, 1.012, 1.012)`;
        card.style.transition = "transform 0.16s ease-out";
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
    const scrollContainer = document.getElementById("main-container");
    const isMobile = window.innerWidth <= 1024;
    const observerRoot = (!isMobile && scrollContainer && getComputedStyle(scrollContainer).overflowY === "scroll")
      ? scrollContainer
      : null;

    const observerOptions = {
      root: observerRoot,
      threshold: isMobile ? [0.05, 0.15, 0.3, 0.5] : [0.35, 0.55, 0.75, 0.9],
      rootMargin: "0px",
    };

    const sectionRatios = {};

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        sectionRatios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      let maxRatio = 0;
      let activeSection = null;

      sections.forEach((section) => {
        const ratio = sectionRatios[section.id] || 0;
        if (ratio > maxRatio) {
          maxRatio = ratio;
          activeSection = section;
        }
      });

      if (activeSection) {
        const idx = Array.from(sections).indexOf(activeSection);
        
        sections.forEach((s, i) => {
          if (i === idx || isMobile) {
            s.classList.add("active");
          } else {
            s.classList.remove("active");
          }
        });

        if (idx !== currentSection) {
          navDots.forEach((dot, i) => {
            const isActive = i === idx;
            dot.classList.toggle("active", isActive);
            if (isActive) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
          });

          mobileNavLinks.forEach((link, i) => {
            const isActive = i === idx;
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
          });

          currentSection = idx;

          const indexCurrent = document.querySelector(".index-current");
          if (indexCurrent) {
            indexCurrent.textContent = (idx + 1).toString().padStart(2, '0');
          }
        }
      }
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  function initNavDots() {
    navDots.forEach((dot, index) => {
      dot.addEventListener("click", () => scrollToSection(index));
    });

    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const index = parseInt(link.dataset.section, 10);
        if (Number.isNaN(index)) return;
        e.preventDefault();
        scrollToSection(index);
      });
    });

    const siteLogo = document.querySelector(".site-logo");
    if (siteLogo) {
      siteLogo.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToSection(0);
      });
    }

    const ctaBtn = document.querySelector(".cta-btn");
    if (ctaBtn) {
      ctaBtn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToSection(1);
      });
    }
  }

  function scrollToSection(index) {
    if (index >= 0 && index < sections.length) {
      const target = sections[index];
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isPageScroll = window.innerWidth <= 1024;
      const behavior = reduceMotion ? "auto" : "smooth";

      if (isPageScroll) {
        const top = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior });
      } else if (container) {
        container.scrollTo({ top: target.offsetTop, behavior });
      } else {
        target.scrollIntoView({ behavior });
      }
    }
  }


  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      const lightbox = document.getElementById("imageLightbox");
      if (lightbox && lightbox.classList.contains("active")) {
        if (e.key === "Escape") {
          closeLightbox(e);
        } else if (e.key === "ArrowLeft") {
          navigateLightbox(-1, e);
        } else if (e.key === "ArrowRight") {
          navigateLightbox(1, e);
        } else if (e.key === "Tab") {
          // Trap focus inside lightbox modal
          const focusableElements = lightbox.querySelectorAll('button, [tabindex="0"]');
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
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
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let scrollY = 0;
    let targetScrollY = 0;
    let mX = 0, mY = 0;
    let targetMX = 0, targetMY = 0;

    const getScrollTop = () => {
      if (window.innerWidth <= 1024) {
        return window.scrollY || document.documentElement.scrollTop;
      }
      return container ? container.scrollTop : 0;
    };

    if (container) {
      container.addEventListener("scroll", () => {
        targetScrollY = getScrollTop();
      }, { passive: true });
    }
    window.addEventListener("scroll", () => {
      targetScrollY = getScrollTop();
    }, { passive: true });

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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typedEl.textContent = text;
      typedEl.style.visibility = "visible";
      typedEl.classList.add("typing-done");
      return;
    }

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
  let lastActiveElement = null;

  function openLightbox(imageSrc) {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    if (!lightbox || !lightboxImage) return;

    lastActiveElement = document.activeElement;

    currentImageIndex = allCertImages.indexOf(imageSrc);
    if (currentImageIndex === -1) currentImageIndex = 0;

    lightboxImage.src = imageSrc;
    lightbox.style.display = "flex";
    lightbox.offsetHeight; // Force reflow
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";

    // Set focus to the close button inside the modal
    const closeBtn = lightbox.querySelector(".lightbox-close");
    if (closeBtn) {
      closeBtn.focus();
    }
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

    // Restore focus back to the triggering element
    if (lastActiveElement && lastActiveElement.focus) {
      lastActiveElement.focus();
    }
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
  function initAccessibility() {
    const certs = document.querySelectorAll(".cert-scroll-item, .main-cert-image");
    certs.forEach((el) => {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
    });
  }

  function initScrollReveals() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth <= 1024) {
      sections.forEach((section) => section.classList.add("active"));
      return;
    }

    const motionGroups = [
      { section: "#section1", selector: ".section-label, h1, .subtitle, p, .hero-badge-wrap, .hero-proof-grid, .cta-btn, .hero-right-col" },
      { section: "#section2", selector: ".about-image-box, .about-text-box" },
      { section: "#section3", selector: ".section-label, h1, .section-subtitle, .skill-item" },
      { section: "#section4", selector: ".section-label, h1, .section-subtitle, .education-section h3, .timeline-item" },
      { section: "#section5", selector: ".section-label, h1, .section-subtitle, .project-card" },
      { section: "#section6", selector: ".section-label, h1, .section-subtitle, .cert-scroll-section, .main-cert-card" },
      { section: "#section7", selector: ".contact-editorial-head, .contact-editorial-title span, .contact-editorial-intro, .contact-mail-row, .contact-editorial-footer" },
    ];

    const revealElements = [];

    motionGroups.forEach(({ section, selector }) => {
      const root = document.querySelector(section);
      if (!root) return;

      root.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("motion-reveal");
        element.style.setProperty("--motion-order", String(index % 6));

        if (element.matches(".about-image-box")) element.dataset.motion = "left";
        if (element.matches(".about-text-box")) element.dataset.motion = "right";

        revealElements.push(element);
      });
    });

    if (revealElements.length === 0) return;

    document.documentElement.classList.add("motion-enhanced");

    const scrollContainer = document.getElementById("main-container");
    const observerRoot = (scrollContainer && getComputedStyle(scrollContainer).overflowY === "scroll")
      ? scrollContainer
      : null;

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, {
      root: observerRoot,
      threshold: 0.15,
      rootMargin: "-30% 0px -30% 0px",
    });

    requestAnimationFrame(() => {
      revealElements.forEach((element) => revealObserver.observe(element));
    });
  }

  function init() {
    initLoader();
    initGridPatterns();
    initTextSplitting();
    initScrollReveals();
    initSectionObserver();
    initNavDots();
    initKeyboard();
    initParallax();
    initScrollProgress();
    initCursor();
    initMagnetics();
    initCardTilt();
    initWaterFill();
    initLiveClock();
    initAccessibility();
    initCertSlider();
  }

  function initCertSlider() {
    const track = document.querySelector(".cert-scroll-track");
    if (!track) return;

    let x = 0;
    const speed = 0.9; // Smooth continuous 60fps movement speed

    function animate() {
      x += speed;
      const limit = track.scrollWidth > 0 ? track.scrollWidth / 2 : 0;
      if (limit > 0 && x >= limit) {
        x -= limit;
      }
      track.style.setProperty("transform", `translate3d(-${x}px, 0, 0)`, "important");
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
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
