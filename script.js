document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Page Navigation Logic ---
    const pages = document.querySelectorAll('.page-view');
    const navBtn = document.getElementById('nav-btn');
    const backHomeBtn = document.getElementById('back-home-btn');
    let currentPageIndex = 0;
    const totalPages = pages.length;

    function updateNavState() {
        // If on the last page (index = totalPages - 1), show back home button instead of next button
        if (currentPageIndex === totalPages - 1) {
            navBtn.classList.add('hidden');
            backHomeBtn.classList.remove('hidden');
        } else {
            navBtn.classList.remove('hidden');
            backHomeBtn.classList.add('hidden');
        }
    }

    navBtn.addEventListener('click', () => {
        // Hide current
        pages[currentPageIndex].classList.remove('active');

        // Go next
        currentPageIndex++;

        // Safety check (shouldn't happen with button hidden, but good practice)
        if (currentPageIndex >= totalPages) currentPageIndex = totalPages - 1;

        // Show next
        pages[currentPageIndex].classList.add('active');

        // Update button visibility
        updateNavState();
    });

    backHomeBtn.addEventListener('click', () => {
        // Hide current
        pages[currentPageIndex].classList.remove('active');

        // Go back to first page
        currentPageIndex = 0;

        // Show first page
        pages[currentPageIndex].classList.add('active');

        // Update button visibility
        updateNavState();
    });

    // Initial check
    updateNavState();


    // --- 2. About Tab Switcher (Page 1) ---
    const tabs = document.querySelectorAll('.about-tab');
    const contents = document.querySelectorAll('.about-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });


    // --- 3. Dynamic 3D Background (Canvas) ---
    class CanvasBackground {
        constructor() {
            this.canvas = document.getElementById('bg-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.dots = [];
            this.resize();
            this.initDots();
            this.addEventListeners();
            this.animate();
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.cx = this.width / 2;
            this.cy = this.height / 2;
        }

        addEventListeners() {
            window.addEventListener('resize', () => this.resize());
            this.mouseX = this.width / 2;
            this.mouseY = this.height / 2;
            window.addEventListener('mousemove', (e) => {
                // Store actual pixel coordinates for disturbance
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        }

        initDots() {
            // Create dots on a very large sphere to fill entire screen
            const count = 1250; // Increased density
            const baseRadius = 1500; // Much larger to cover screen

            for (let i = 0; i < count; i++) {
                // Spherical distribution
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);

                // Dispersion 
                const dispersion = Math.pow(Math.random(), 0.5) * 1000;
                const r = baseRadius + dispersion;

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);

                // Add Brownian motion velocity (increased)
                this.dots.push({
                    x, y, z,
                    baseX: x, baseY: y, baseZ: z,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    vz: (Math.random() - 0.5) * 0.5
                });
            }
        }

        rotate(dot, rotationX, rotationY) {
            let y = dot.y;
            let z = dot.z;

            // Rotate around X
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);
            const y1 = y * cosX - z * sinX;
            const z1 = z * cosX + y * sinX;

            // Rotate around Y
            let x = dot.x;
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            const x2 = x * cosY - z1 * sinY;
            const z2 = z1 * cosY + x * sinY;

            dot.x = x2;
            dot.y = y1;
            dot.z = z2;
        }

        animate() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Sphere center is now FIXED at screen center
            // No longer follows mouse

            // Ultra slow rotation
            const rotX = 0.0001;
            const rotY = 0.0001;

            // Projection & Line Drawing Helpers
            const projected = [];

            // Update & Project
            this.dots.forEach(dot => {
                // Apply Brownian motion (increased strength)
                dot.vx += (Math.random() - 0.5) * 0.15;
                dot.vy += (Math.random() - 0.5) * 0.15;
                dot.vz += (Math.random() - 0.5) * 0.15;

                // Damping
                dot.vx *= 0.98;
                dot.vy *= 0.98;
                dot.vz *= 0.98;

                // Update position with small drift
                dot.x += dot.vx;
                dot.y += dot.vy;
                dot.z += dot.vz;

                // Weak spring back to original position
                const springForce = 0.002;
                dot.vx += (dot.baseX - dot.x) * springForce;
                dot.vy += (dot.baseY - dot.y) * springForce;
                dot.vz += (dot.baseZ - dot.z) * springForce;

                this.rotate(dot, rotX, rotY);

                // Projection
                const perspective = 2000; // Much larger for screen-filling sphere
                const scale = perspective / (perspective + dot.z + 2000);
                const projX = this.cx + dot.x * scale;
                const projY = this.cy + dot.y * scale;

                // Mouse disturbance effect
                // Calculate distance from mouse to projected point
                const dx = projX - this.mouseX;
                const dy = projY - this.mouseY;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);
                const disturbanceRadius = 150; // Pixels

                if (distToMouse < disturbanceRadius) {
                    // Apply repulsion force
                    const force = (1 - distToMouse / disturbanceRadius) * 5;
                    const angle = Math.atan2(dy, dx);
                    dot.vx += Math.cos(angle) * force;
                    dot.vy += Math.sin(angle) * force;
                }

                projected.push({ x: projX, y: projY, scale: scale });
            });

            // 3. Draw Connections (Constellation Effect)
            for (let i = 0; i < projected.length; i++) {
                const p1 = projected[i];
                if (p1.scale < 0.2) continue; // Skip far back points

                for (let j = i + 1; j < projected.length; j++) {
                    const p2 = projected[j];
                    if (p2.scale < 0.2) continue;

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) { // Connection threshold
                        const alpha = (1 - dist / 100) * p1.scale * 0.5; // Fade by distance & depth
                        this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }

            // 4. Draw Dots
            projected.forEach(p => {
                const alpha = Math.max(0.1, (p.scale - 0.2));
                this.ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2);
                this.ctx.fill();
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    new CanvasBackground();

    // --- 4. Contact Copy Functionality ---    
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const copyText = item.getAttribute('data-copy');
            const type = item.getAttribute('data-type');
            
            if (copyText) {
                // Create toast element if not exists
                let toast = document.querySelector('.copy-toast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.className = 'copy-toast';
                    document.body.appendChild(toast);
                }
                
                // Set toast message
                if (type === 'phone') {
                    toast.textContent = '号码已复制';
                } else if (type === 'email') {
                    toast.textContent = '邮箱已复制';
                }
                
                // Position toast near the clicked element
                const rect = item.getBoundingClientRect();
                toast.style.left = rect.left + 'px';
                toast.style.top = (rect.top - 40) + 'px';
                
                // Show toast
                toast.classList.add('show');
                
                // Copy to clipboard
                navigator.clipboard.writeText(copyText).then(() => {
                    console.log('Copied to clipboard:', copyText);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
                
                // Hide toast after 2 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 2000);
            }
        });
    });

    // --- 5. Paper Page Interactions ---
    const paperPage = document.getElementById('page-6');
    
    if (paperPage) {
        const scrollContent = paperPage.querySelector('.paper-scroll-content');
        const anchorLinks = paperPage.querySelectorAll('.anchor-link');
        const sections = paperPage.querySelectorAll('.paper-section');
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        document.body.appendChild(tooltip);

        // Anchor navigation
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection && scrollContent) {
                    const sectionTop = targetSection.offsetTop;
                    scrollContent.scrollTo({
                        top: sectionTop - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Scroll highlighting
        if (scrollContent) {
            scrollContent.addEventListener('scroll', () => {
                let currentSection = '';
                
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;
                    
                    if (scrollContent.scrollTop >= sectionTop - 100) {
                        currentSection = section.getAttribute('id');
                    }
                });

                anchorLinks.forEach(link => {
                    link.classList.remove('active');
                    const sectionAttr = link.getAttribute('data-section');
                    if (currentSection && currentSection.includes(sectionAttr)) {
                        link.classList.add('active');
                    }
                });
            });
        }

        // Tooltip for elements with data-tooltip
        const tooltipElements = paperPage.querySelectorAll('[data-tooltip], [data-compare]');
        
        tooltipElements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltipText = el.getAttribute('data-tooltip') || el.getAttribute('data-compare');
                if (tooltipText) {
                    tooltip.textContent = tooltipText;
                    tooltip.style.left = e.pageX + 15 + 'px';
                    tooltip.style.top = e.pageY + 15 + 'px';
                    tooltip.classList.add('show');
                }
            });

            el.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.pageX + 15 + 'px';
                tooltip.style.top = e.pageY + 15 + 'px';
            });

            el.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    }
});
