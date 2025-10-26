/**
 * ====================================
 * MAIN JS - Funcionalidad Principal
 * DRESS - Custom Apparel & Accessories
 * ====================================
 */

// Variables globales
let currentSlide = 0;
let slideInterval;
let isSliderActive = true;

// Configuración del slider
const SLIDER_CONFIG = {
    INTERVAL: 5000, // 5 segundos
    TRANSITION_DURATION: 1000, // 1 segundo
    AUTO_PLAY: true,
    PAUSE_ON_HOVER: true
};

// Configuración de animaciones
const ANIMATION_CONFIG = {
    DURATION: 600,
    EASING: 'ease-out',
    DELAY_STAGGER: 100
};

/**
 * Inicializar la aplicación principal
 */
function initializeApp() {
    console.log('🎨 Initializing DRESS App...');
    
    // Verificar si es el momento correcto para inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
        return;
    }
    
    initApp();
}

/**
 * Función principal de inicialización
 */
function initApp() {
    try {
        // Inicializar componentes principales
        initializeNavigation();
        initializeHeroSlider();
        initializeScrollAnimations();
        initializeTouchSupport();
        initializeAccessibility();
        initializePerformanceOptimizations();
        
        // Event listeners globales
        setupGlobalEventListeners();
        
        console.log('✅ DRESS App initialized successfully');
        
    } catch (error) {
        Utils.Logger.error('Failed to initialize app:', error);
        showErrorMessage('Error initializing application. Please refresh the page.');
    }
}

/**
 * Inicializar navegación y menú móvil
 */
function initializeNavigation() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileToggle && navMenu) {
        // Toggle del menú móvil
        mobileToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            // Prevenir scroll del body cuando el menú está abierto
            document.body.style.overflow = isActive ? 'hidden' : '';
            
            // ARIA attributes para accesibilidad
            navMenu.setAttribute('aria-expanded', isActive.toString());
        });
        
        // Cerrar menú al hacer click en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
                navMenu.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
                navMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // Smooth scrolling para enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // CTA buttons scroll to catalog
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', handleCtaButtonClick);
    });
}

/**
 * Manejar clicks en enlaces de navegación
 */
function handleNavLinkClick(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    
    if (targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            smoothScrollTo(targetElement, 80); // Account for fixed navbar
        }
    } else if (targetId.includes('.html')) {
        // Navegación a otras páginas
        window.location.href = targetId;
    }
}

/**
 * Manejar clicks en botones CTA
 */
function handleCtaButtonClick(e) {
    e.preventDefault();
    const catalogElement = document.querySelector('#catalog') || document.querySelector('.catalog-section');
    
    if (catalogElement) {
        smoothScrollTo(catalogElement, 80);
        
        // Opcional: activar filtro de "all products"
        setTimeout(() => {
            const allFilterBtn = document.querySelector('[data-filter="all"]');
            if (allFilterBtn) {
                allFilterBtn.click();
            }
        }, 500);
    }
}

/**
 * Inicializar hero slider
 */
function initializeHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const sliderContainer = document.querySelector('.slider-container');
    
    if (slides.length === 0) return;
    
    console.log(`🎠 Initializing hero slider with ${slides.length} slides`);
    
    // Auto-play del slider
    if (SLIDER_CONFIG.AUTO_PLAY) {
        startSlider();
    }
    
    // Controles manuales
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    // Navegación con dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
        // ARIA attributes
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    });
    
    // Pausar en hover
    if (SLIDER_CONFIG.PAUSE_ON_HOVER && sliderContainer) {
        sliderContainer.addEventListener('mouseenter', pauseSlider);
        sliderContainer.addEventListener('mouseleave', resumeSlider);
    }
    
    // Navegación con teclado
    document.addEventListener('keydown', handleSliderKeyboard);
    
    // Establecer slide inicial
    updateSlider();
    
    // Intersection Observer para pausar slider cuando no está visible
    observeSliderVisibility();
}

/**
 * Avanzar al siguiente slide
 */
function nextSlide() {
    if (!isSliderActive) return;
    
    currentSlide = (currentSlide + 1) % document.querySelectorAll('.slide').length;
    updateSlider();
    restartSlider();
}

/**
 * Retroceder al slide anterior
 */
function prevSlide() {
    if (!isSliderActive) return;
    
    currentSlide = (currentSlide - 1 + document.querySelectorAll('.slide').length) % document.querySelectorAll('.slide').length;
    updateSlider();
    restartSlider();
}

/**
 * Ir a un slide específico
 */
function goToSlide(index) {
    if (!isSliderActive || index < 0 || index >= document.querySelectorAll('.slide').length) return;
    
    currentSlide = index;
    updateSlider();
    restartSlider();
}

/**
 * Actualizar display del slider
 */
function updateSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    // Actualizar slides
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
        slide.setAttribute('aria-hidden', index !== currentSlide);
    });
    
    // Actualizar dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
        dot.setAttribute('aria-current', index === currentSlide ? 'true' : 'false');
    });
    
    // Disparar evento personalizado
    const event = new CustomEvent('slideChanged', { 
        detail: { currentSlide, totalSlides: slides.length } 
    });
    document.dispatchEvent(event);
}

/**
 * Iniciar auto-play del slider
 */
function startSlider() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, SLIDER_CONFIG.INTERVAL);
}

/**
 * Pausar auto-play del slider
 */
function pauseSlider() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

/**
 * Reanudar auto-play del slider
 */
function resumeSlider() {
    if (isSliderActive && !slideInterval) {
        startSlider();
    }
}

/**
 * Reiniciar timer del slider
 */
function restartSlider() {
    if (slideInterval) {
        clearInterval(slideInterval);
        startSlider();
    }
}

/**
 * Manejar navegación del slider con teclado
 */
function handleSliderKeyboard(e) {
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
    }
}

/**
 * Observar visibilidad del slider para pausar auto-play
 */
function observeSliderVisibility() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isSliderActive = entry.isIntersecting;
            if (!isSliderActive) {
                pauseSlider();
            } else if (SLIDER_CONFIG.AUTO_PLAY) {
                resumeSlider();
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(slider);
}

/**
 * Inicializar animaciones de scroll
 */
function initializeScrollAnimations() {
    const animateElements = document.querySelectorAll('.category-card, .feature-card, .product-card');
    
    if (animateElements.length === 0) return;
    
    const observer = new Utils.createIntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Animación escalonada para elementos en grupo
                if (element.parentElement && 
                    (element.parentElement.classList.contains('category-grid') ||
                     element.parentElement.classList.contains('features-grid') ||
                     element.parentElement.classList.contains('products-grid'))) {
                    
                    const siblings = Array.from(element.parentElement.children);
                    const index = siblings.indexOf(element);
                    
                    setTimeout(() => {
                        animateElement(element);
                    }, index * ANIMATION_CONFIG.DELAY_STAGGER);
                } else {
                    animateElement(element);
                }
                
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Animar elemento individual
 */
function animateElement(element) {
    // Configurar estado inicial
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = `opacity ${ANIMATION_CONFIG.DURATION}ms ${ANIMATION_CONFIG.EASING}, transform ${ANIMATION_CONFIG.DURATION}ms ${ANIMATION_CONFIG.EASING}`;
    
    // Forzar reflow
    element.offsetHeight;
    
    // Aplicar animación
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
    
    // Remover estilos inline después de la animación
    setTimeout(() => {
        element.style.transition = '';
    }, ANIMATION_CONFIG.DURATION);
}

/**
 * Inicializar soporte touch para móviles
 */
function initializeTouchSupport() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer || !Utils.detectDevice().isTouch) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isDragging = false;
    
    const MIN_SWIPE_DISTANCE = 50;
    const MAX_VERTICAL_DISTANCE = 100;
    
    sliderContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    sliderContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    sliderContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = true;
        pauseSlider();
    }
    
    function handleTouchMove(e) {
        if (!isDragging) return;
        
        // Prevenir scroll vertical durante swipe horizontal
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        
        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }
    
    function handleTouchEnd(e) {
        if (!isDragging) return;
        
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchStartX - touchEndX;
        const deltaY = Math.abs(touchStartY - touchEndY);
        
        isDragging = false;
        
        // Verificar si es un swipe válido
        if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && deltaY < MAX_VERTICAL_DISTANCE) {
            if (deltaX > 0) {
                // Swipe izquierda - siguiente slide
                nextSlide();
            } else {
                // Swipe derecha - slide anterior
                prevSlide();
            }
        } else {
            resumeSlider();
        }
    }
}

/**
 * Inicializar características de accesibilidad
 */
function initializeAccessibility() {
    // Focus management para navegación
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Skip link para lectores de pantalla
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // ARIA labels dinámicos
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Product ${index + 1}`);
    });
}

/**
 * Inicializar optimizaciones de rendimiento
 */
function initializePerformanceOptimizations() {
    // Lazy loading para imágenes
    if ('IntersectionObserver' in window) {
        const imageObserver = new Utils.createIntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Preload de recursos críticos
    preloadCriticalResources();
    
    // Service Worker para cache (si está disponible)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            Utils.Logger.warn('Service Worker registration failed:', error);
        });
    }
}

/**
 * Preload de recursos críticos
 */
function preloadCriticalResources() {
    const criticalImages = [
        'portada/hero_ropa_minimalista.png',
        'portada/productos_destacados.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Redimensionar ventana
    window.addEventListener('resize', Utils.debounce(handleWindowResize, 250));
    
    // Scroll con throttle
    window.addEventListener('scroll', Utils.throttle(handleScroll, 100));
    
    // Online/Offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Visibilidad de página
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Error de recursos
    window.addEventListener('error', handleResourceError);
    
    // Beforeunload para cleanup
    window.addEventListener('beforeunload', cleanup);
}

/**
 * Manejar redimensionamiento de ventana
 */
function handleWindowResize() {
    // Recalcular slider si es necesario
    if (document.querySelector('.hero-slider')) {
        updateSlider();
    }
    
    // Ajustar navegación móvil
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && window.innerWidth > 768) {
        navMenu.classList.remove('active');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
}

/**
 * Manejar scroll de página
 */
function handleScroll() {
    const scrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    
    // Cambiar apariencia del navbar al hacer scroll
    if (navbar) {
        if (scrollY > 100) {
            navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'var(--background-black)';
            navbar.style.backdropFilter = 'none';
        }
    }
    
    // Mostrar/ocultar scroll to top button
    toggleScrollToTopButton(scrollY);
}

/**
 * Toggle del botón scroll to top
 */
function toggleScrollToTopButton(scrollY) {
    const existingButton = document.querySelector('.scroll-to-top');
    
    if (scrollY > 500) {
        if (!existingButton) {
            const button = createScrollToTopButton();
            document.body.appendChild(button);
        }
    } else if (existingButton) {
        existingButton.remove();
    }
}

/**
 * Crear botón scroll to top
 */
function createScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Scroll to top');
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
    `;
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Animar entrada
    setTimeout(() => {
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
    }, 100);
    
    return button;
}

/**
 * Manejar estado online
 */
function handleOnline() {
    showNotification('Conexión restaurada', 'success');
    Utils.Logger.info('Application is online');
}

/**
 * Manejar estado offline
 */
function handleOffline() {
    showNotification('Sin conexión a internet', 'warning');
    Utils.Logger.warn('Application is offline');
}

/**
 * Manejar cambios de visibilidad de página
 */
function handleVisibilityChange() {
    if (document.hidden) {
        pauseSlider();
    } else if (SLIDER_CONFIG.AUTO_PLAY) {
        resumeSlider();
    }
}

/**
 * Manejar errores de recursos
 */
function handleResourceError(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
        Utils.Logger.warn('Image failed to load:', e.target.src);
    }
}

/**
 * Scroll suave a elemento
 */
function smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#00C851',
        error: '#ff4444',
        warning: '#FF8800',
        info: 'var(--primary-color)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después del tiempo especificado
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Mostrar mensaje de error
 */
function showErrorMessage(message) {
    showNotification(message, 'error', 5000);
}

/**
 * Cleanup al cerrar página
 */
function cleanup() {
    // Limpiar intervalos
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    
    // Limpiar timeouts pendientes
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i <= highestTimeoutId; i++) {
        clearTimeout(i);
    }
    
    Utils.Logger.info('Application cleanup completed');
}

// Inicializar aplicación
initializeApp();

// Exportar funciones para uso global si es necesario
window.MainApp = {
    nextSlide,
    prevSlide,
    goToSlide,
    smoothScrollTo,
    showNotification,
    showErrorMessage
};