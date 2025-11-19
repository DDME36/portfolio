document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const navDots = document.querySelectorAll('.nav-dot');
    const waterFills = document.querySelectorAll('.water-fill');
    
    // Observer ติดตามการเลื่อนหน้าจอ
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Active Section Styling
                sections.forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');
                
                // Active Nav Dot
                const index = Array.from(sections).indexOf(entry.target);
                navDots.forEach(d => d.classList.remove('active'));
                if (navDots[index]) navDots[index].classList.add('active');
                
                // Trigger Skill Animation only when visible
                if (entry.target.id === 'section3') {
                    waterFills.forEach(fill => {
                        fill.style.height = fill.getAttribute('data-percentage') + '%';
                    });
                }
            }
        });
    }, { threshold: 0.3 }); // ปรับ threshold ให้ไวขึ้นสำหรับมือถือ

    sections.forEach(section => observer.observe(section));

    // Scroll to section
    window.scrollToSection = (index) => {
        sections[index].scrollIntoView({ behavior: 'smooth' });
    };

    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => window.scrollToSection(index));
    });

    // Lightbox Functions
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    
    window.openLightbox = (src) => {
        lightbox.classList.add('active');
        lightboxImg.src = src;
    };
    
    window.closeLightbox = (e) => {
        if (e.target === lightbox || e.target.closest('.lightbox-close')) {
            lightbox.classList.remove('active');
        }
    };

    // Parallax Mouse Effect (เฉพาะ Desktop เพื่อประหยัดแบตมือถือ)
    if (window.matchMedia("(min-width: 1025px)").matches) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            
            // ใช้ requestAnimationFrame เพื่อความลื่นไหล
            requestAnimationFrame(() => {
                document.querySelectorAll('.layer-shape').forEach(shape => {
                    const speed = shape.getAttribute('data-speed') || 0.5;
                    shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
                });
            });
        });
    }
});
