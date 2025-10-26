/**
 * ====================================
 * UTILIDADES - Funciones Helper
 * DRESS - Custom Apparel & Accessories
 * ====================================
 */

/**
 * Debounce function para optimizar eventos frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Ejecutar inmediatamente en el primer llamado
 * @returns {Function} Función debounced
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function para limitar frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en ms
 * @returns {Function} Función throttled
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Delay/promesa para crear pausas
 * @param {number} ms - Milisegundos de delay
 * @returns {Promise} Promise que se resuelve después del delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validar si un objeto está vacío
 * @param {any} obj - Objeto a validar
 * @returns {boolean} True si está vacío
 */
function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Capitalizar primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
function capitalize(str) {
    if (!str) return '';
    return str.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Truncar texto con ellipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo para truncar
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 150, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formatear número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formatear precio
 * @param {number} price - Precio
 * @param {string} currency - Moneda
 * @returns {string} Precio formateado
 */
function formatPrice(price, currency = '$') {
    return `${currency}${formatNumber(price)}`;
}

/**
 * Generar ID único
 * @param {string} prefix - Prefijo opcional
 * @returns {string} ID único
 */
function generateId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Clonar objeto profundamente
 * @param {any} obj - Objeto a clonar
 * @returns {any} Objeto clonado
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        Object.keys(obj).forEach(key => {
            clonedObj[key] = deepClone(obj[key]);
        });
        return clonedObj;
    }
}

/**
 * Mezclar objeto fuente en objeto destino
 * @param {Object} target - Objeto destino
 * @param {...Object} sources - Objetos fuente
 * @returns {Object} Objeto resultante
 */
function merge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                merge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return merge(target, ...sources);
}

/**
 * Verificar si valor es objeto
 * @param {any} item - Valor a verificar
 * @returns {boolean} True si es objeto
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Remover duplicados de array
 * @param {Array} arr - Array original
 * @param {string} key - Clave para comparar (opcional)
 * @returns {Array} Array sin duplicados
 */
function unique(arr, key = null) {
    if (!Array.isArray(arr)) return [];
    
    if (!key) {
        return [...new Set(arr)];
    }
    
    const seen = new Set();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

/**
 * Ordenar array por propiedad
 * @param {Array} arr - Array a ordenar
 * @param {string} key - Clave para ordenar
 * @param {string} order - Orden ('asc' o 'desc')
 * @returns {Array} Array ordenado
 */
function sortBy(arr, key, order = 'asc') {
    if (!Array.isArray(arr)) return [];
    
    return [...arr].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Agrupar array por propiedad
 * @param {Array} arr - Array a agrupar
 * @param {string} key - Clave para agrupar
 * @returns {Object} Objeto agrupado
 */
function groupBy(arr, key) {
    if (!Array.isArray(arr)) return {};
    
    return arr.reduce((groups, item) => {
        const group = item[key] || 'Other';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
}

/**
 * Obtener parámetros de URL
 * @returns {Object} Parámetros de URL
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Establecer parámetro de URL sin recargar
 * @param {string} key - Clave del parámetro
 * @param {string} value - Valor del parámetro
 */
function setUrlParam(key, value) {
    const url = new URL(window.location);
    if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', url);
}

/**
 * Convertir string a slug URL-friendly
 * @param {string} str - String a convertir
 * @returns {string} Slug
 */
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validar URL
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Escapar HTML para prevenir XSS
 * @param {string} html - HTML a escapar
 * @returns {string} HTML escapado
 */
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Sanitizar objeto removiendo propiedades peligrosas
 * @param {Object} obj - Objeto a sanitizar
 * @param {Array} allowedKeys - Claves permitidas
 * @returns {Object} Objeto sanitizado
 */
function sanitize(obj, allowedKeys = []) {
    const sanitized = {};
    Object.keys(obj).forEach(key => {
        if (allowedKeys.length === 0 || allowedKeys.includes(key)) {
            sanitized[key] = obj[key];
        }
    });
    return sanitized;
}

/**
 * Interceptor para manejo de errores
 * @param {Function} callback - Función callback para el error
 */
function setupErrorHandler(callback) {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (callback) callback(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (callback) callback(event.reason);
    });
}

/**
 * Función para logging con diferentes niveles
 */
const Logger = {
    info: (...args) => console.info('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.debug('[DEBUG]', ...args);
        }
    }
};

/**
 * Storage helpers con manejo de errores
 */
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            Logger.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            Logger.error('Storage set error:', error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            Logger.error('Storage remove error:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            Logger.error('Storage clear error:', error);
            return false;
        }
    }
};

/**
 * Performance monitor
 */
const Performance = {
    marks: new Map(),
    
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
            this.marks.set(name, performance.now());
        }
    },
    
    measure(name, startMark, endMark = null) {
        if (!performance.measure) return 0;
        
        try {
            const measure = performance.measure(name, startMark, endMark);
            return measure ? measure.duration : 0;
        } catch (error) {
            Logger.error('Performance measure error:', error);
            return 0;
        }
    },
    
    time(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        Logger.debug(`${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
};

/**
 * Event emitter simple
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
    
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
}

/**
 * Intersection Observer wrapper para lazy loading
 */
function createIntersectionObserver(callback, options = {}) {
    const defaultOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };
    
    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
}

/**
 * Función para copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        Logger.error('Copy to clipboard failed:', error);
        return false;
    }
}

/**
 * Detectar tipo de dispositivo
 * @returns {Object} Información del dispositivo
 */
function detectDevice() {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android/i.test(ua) && window.innerWidth > 768;
    const isDesktop = !isMobile && !isTablet;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    
    return {
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
}

// Exportar funciones para uso global
window.Utils = {
    debounce,
    throttle,
    delay,
    isEmpty,
    capitalize,
    truncateText,
    formatNumber,
    formatPrice,
    generateId,
    deepClone,
    merge,
    isObject,
    unique,
    sortBy,
    groupBy,
    getUrlParams,
    setUrlParam,
    slugify,
    isValidEmail,
    isValidUrl,
    escapeHtml,
    sanitize,
    setupErrorHandler,
    Logger,
    Storage,
    Performance,
    EventEmitter,
    createIntersectionObserver,
    copyToClipboard,
    detectDevice
};

// Auto-inicializar error handler
setupErrorHandler((error) => {
    // Aquí se podría enviar el error a un servicio de logging
    Logger.error('Application error:', error);
});