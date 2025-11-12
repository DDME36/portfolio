const container = document.getElementById('main-container');
const sections = document.querySelectorAll('.section');
const navDots = document.querySelectorAll('.nav-dot');
let currentSection = 0;
let isScrolling = false;

// Intersection Observer for section activation
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Remove active class from all sections
            sections.forEach(s => s.classList.remove('active'));
            // Add active class to current section
            entry.target.classList.add('active');

            // Update nav dots
            const sectionIndex = Array.from(sections).indexOf(entry.target);
            navDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === sectionIndex);
            });
            currentSection = sectionIndex;
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

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
        scrollToSection(currentSection + 1);
    } else if (e.key === 'ArrowUp' && currentSection > 0) {
        scrollToSection(currentSection - 1);
    }
});

// Mouse wheel navigation (optional - smoother experience)
let scrollTimeout;
container.addEventListener('wheel', (e) => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Scroll handling is done by CSS scroll-snap
    }, 100);
});

// Parallax effect for layered shapes
container.addEventListener('scroll', () => {
    const scrolled = container.scrollTop;
    const layerShapes = document.querySelectorAll('.layer-shape');

    layerShapes.forEach(shape => {
        const speed = parseFloat(shape.dataset.speed) || 0.5;
        const yPos = -(scrolled * speed);
        shape.style.transform = `translateY(${yPos}px)`;
    });
});

// Mouse move parallax effect
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;

    const layerShapes = document.querySelectorAll('.layer-shape');
    layerShapes.forEach(shape => {
        const speed = parseFloat(shape.dataset.speed) || 0.5;
        const x = mouseX * 50 * speed;
        const y = mouseY * 50 * speed;

        const currentTransform = shape.style.transform || '';
        const scrollY = container.scrollTop * speed;
        shape.style.transform = `translate(${x}px, ${y - scrollY}px)`;
    });

    // Spotlight effect
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        spotlight.style.left = `${e.clientX - 300}px`;
        spotlight.style.top = `${e.clientY - 300}px`;
    }
});

// Add grid pattern to all sections
sections.forEach(section => {
    if (!section.querySelector('.grid-pattern')) {
        const grid = document.createElement('div');
        grid.className = 'grid-pattern';
        section.insertBefore(grid, section.firstChild);
    }
});

// Water fill animation for skills
const skillsSection = document.getElementById('section3');
const waterFills = document.querySelectorAll('.water-fill');

const animateWaterFill = () => {
    waterFills.forEach(fill => {
        const percentage = fill.getAttribute('data-percentage');
        if (percentage) {
            setTimeout(() => {
                fill.style.height = percentage + '%';
            }, 300);
        }
    });
};

// Trigger water fill when skills section is active
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === 'section3') {
            animateWaterFill();
            skillsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

if (skillsSection) {
    skillsObserver.observe(skillsSection);
}

// Image Lightbox functionality
const allCertImages = [
    'images/c1.png',
    'images/c2.png',
    'images/c3.png',
    'images/c4.png',
    'images/coe.jpg',
    'images/toeic1.png'
];
let currentImageIndex = 0;

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');

    currentImageIndex = allCertImages.indexOf(imageSrc);
    if (currentImageIndex === -1) currentImageIndex = 0;

    lightboxImage.src = imageSrc;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event.target.id === 'imageLightbox' || event.target.closest('.lightbox-close')) {
        const lightbox = document.getElementById('imageLightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        event.stopPropagation();
    }
}

function navigateLightbox(direction, event) {
    event.stopPropagation();
    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = allCertImages.length - 1;
    } else if (currentImageIndex >= allCertImages.length) {
        currentImageIndex = 0;
    }

    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = allCertImages[currentImageIndex];
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1, e);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1, e);
        }
    }
});

window.scrollToSection = scrollToSection;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;

