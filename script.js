document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    const sections = document.querySelectorAll('.section');
    const navDots = document.querySelectorAll('.nav-dot');
    
    // --- Intersection Observer (ติดตามว่าดู Section ไหนอยู่) ---
    // ใช้ threshold ต่ำลงเพื่อให้ detect ง่ายขึ้นบน iPad
    const observerOptions = {
        threshold: 0.2, 
        root: container // สังเกตเทียบกับ container หลัก
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // อัปเดตเมนูจุด (Nav Dots)
                const id = entry.target.getAttribute('id');
                const index = Array.from(sections).findIndex(section => section.id === id);
                
                navDots.forEach(dot => dot.classList.remove('active'));
                if (navDots[index]) navDots[index].classList.add('active');

                // เพิ่ม class active ให้ section เพื่อเล่น Animation
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // --- Parallax Effect (Effect ขยับตามเมาส์) ---
    // Optimize: ใช้ requestAnimationFrame เพื่อลดภาระเครื่อง iPad
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateParallax() {
        // Smooth interpolation (Lerp)
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        const x = (currentX / window.innerWidth - 0.5) * 50;
        const y = (currentY / window.innerHeight - 0.5) * 50;

        const shapes = document.querySelectorAll('.layer-shape');
        shapes.forEach(shape => {
            const speed = parseFloat(shape.dataset.speed) || 0.5;
            // ใช้ translate3d เพื่อเปิด Hardware Acceleration
            shape.style.transform = `translate3d(${x * speed}px, ${y * speed}px, 0)`;
        });
        
        const spotlight = document.getElementById('spotlight');
        if (spotlight) {
            spotlight.style.left = `${currentX - 300}px`;
            spotlight.style.top = `${currentY - 300}px`;
        }

        requestAnimationFrame(animateParallax);
    }
    // เริ่ม Animation เฉพาะจอใหญ่ (Desktop) เพื่อประหยัดแบตมือถือ
    if (window.innerWidth > 1024) {
        animateParallax();
    }

    // --- Scroll Function ---
    window.scrollToSection = (index) => {
        if (sections[index]) {
            sections[index].scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Add click events to nav dots
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => window.scrollToSection(index));
    });

    // --- Lightbox (ดูรูปขยาย) ---
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    let currentImgIndex = 0;
    // เก็บรายการรูปทั้งหมดใน Array ไว้ก่อน
    const allImages = [
        'images/c1.png', 'images/c2.png', 'images/c3.png', 'images/c4.png',
        'images/coe.jpg', 'images/toeic1.png'
    ];

    window.openLightbox = (src) => {
        lightbox.setAttribute('aria-hidden', 'false');
        lightbox.classList.add('active');
        lightboxImg.src = src;
        // หา index ปัจจุบัน
        currentImgIndex = allImages.findIndex(img => src.includes(img));
        if (currentImgIndex === -1) currentImgIndex = 0;
    };

    window.closeLightbox = (e) => {
        if (e.target === lightbox || e.target.closest('.lightbox-close')) {
            lightbox.classList.remove('active');
            lightbox.setAttribute('aria-hidden', 'true');
        }
    };
    
    window.navigateLightbox = (direction, e) => {
        e.stopPropagation();
        currentImgIndex = (currentImgIndex + direction + allImages.length) % allImages.length;
        lightboxImg.src = allImages[currentImgIndex];
    };
});
