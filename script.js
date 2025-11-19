const container = document.getElementById('main-container');
const sections = document.querySelectorAll('.section');
const navDots = document.querySelectorAll('.nav-dot');
let currentSection = 0;

// Performance: Use Intersection Observer efficiently
const observerOptions = {
    threshold: 0.3, // Lower threshold triggers earlier
    rootMargin: '0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Update Nav Dots
            const sectionIndex = Array.from(sections).indexOf(entry.target);
            navDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === sectionIndex);
            });
            
            // Add active class to section for animations
            sections.forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');
            currentSection = sectionIndex;
            
            // Trigger Skills Animation only when needed
            if (entry.target.id === 'section3') {
                animateWaterFill();
            }
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// Nav dots click
navDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        scrollToSection(index);
    });
});

function scrollToSection(index) {
    if (index >= 0 && index < sections.length) {
        sections[index].scrollIntoView({ behavior: 'smooth' });
    }
}

// Parallax Effect Optimization (Throttling & Mobile Check)
const layerShapes = document.querySelectorAll('.layer-shape');
const spotlight = document.getElementById('spotlight');
let isRequestingAnimation = false;

function handleMouseMove(e) {
    if (isRequestingAnimation) return;

    isRequestingAnimation = true;
    requestAnimationFrame(() => {
        // Only run heavy calculations on desktop
        if (window.innerWidth > 1024) {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            layerShapes.forEach(shape => {
                const speed = parseFloat(shape.dataset.speed) || 0.5;
                const x = mouseX * 30 * speed; // Reduced movement range for performance
                const y = mouseY * 30 * speed;
                // Use translate3d for hardware acceleration
                shape.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });

            if (spotlight) {
                spotlight.style.left = `${e.clientX - 300}px`;
                spotlight.style.top = `${e.clientY - 300}px`;
            }
        }
        isRequestingAnimation = false;
    });
}

// Only add mousemove listener if device supports hover (Desktop)
if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener('mousemove', handleMouseMove);
}

// Skills Animation
function animateWaterFill() {
    const waterFills = document.querySelectorAll('.water-fill');
    waterFills.forEach(fill => {
        const percentage = fill.getAttribute('data-percentage');
        if (percentage) {
            // Add slight delay
            setTimeout(() => {
                fill.style.height = percentage + '%';
            }, 200);
        }
    });
}

// Lightbox Functionality
const allCertImages = [
    'images/c1.png', 'images/c2.png', 'images/c3.png', 'images/c4.png',
    'images/coe.jpg', 'images/toeic1.png'
];
let currentImageIndex = 0;

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');

    // Find clean index (remove duplicates logic from HTML needed)
    // Simplified: just match string
    let index = allCertImages.findIndex(src => imageSrc.includes(src));
    if (index === -1) index = 0;
    currentImageIndex = index;

    lightboxImage.src = allCertImages[currentImageIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

function closeLightbox(event) {
    if (!event || event.target.id === 'imageLightbox' || event.target.closest('.lightbox-close')) {
        const lightbox = document.getElementById('imageLightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function navigateLightbox(direction, event) {
    if(event) event.stopPropagation();
    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = allCertImages.length - 1;
    } else if (currentImageIndex >= allCertImages.length) {
        currentImageIndex = 0;
    }

    const lightboxImage = document.getElementById('lightboxImage');
    // Add simple fade effect
    lightboxImage.style.opacity = 0;
    setTimeout(() => {
        lightboxImage.src = allCertImages[currentImageIndex];
        lightboxImage.style.opacity = 1;
    }, 200);
}

// Keyboard Navigation for Lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    }
    // Section navigation
    if (!lightbox.classList.contains('active')) {
        if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
            scrollToSection(currentSection + 1);
        } else if (e.key === 'ArrowUp' && currentSection > 0) {
            scrollToSection(currentSection - 1);
        }
    }
});

// Export functions globally for HTML inline calls
window.scrollToSection = scrollToSection;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
