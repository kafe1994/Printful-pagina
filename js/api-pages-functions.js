/**
 * ====================================
 * API MANAJER - Funciones de API de Printful
 * VERSIÓN PARA PAGES FUNCTIONS
 * DRESS - Custom Apparel & Accessories
 * ====================================
 */

// Configuración de la API - USAR URL RELATIVA PARA PAGES FUNCTIONS
const API_CONFIG = {
    BASE_URL: '/api',  // ← URL relativa en el mismo dominio
    ENDPOINTS: {
        PRODUCTS: '/products',
        PRODUCT: (id) => `/products/${id}`
    },
    TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3
};

// Cache para productos
let productsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Realizar petición HTTP con reintentos automáticos
 * @param {string} url - URL a solicitar
 * @param {Object} options - Opciones de fetch
 * @param {number} attempts - Número de intentos restantes
 * @returns {Promise<Object>} Respuesta de la API
 */
async function makeApiRequest(url, options = {}, attempts = API_CONFIG.RETRY_ATTEMPTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        // Si es el último intento, lanzar error
        if (attempts <= 1) {
            throw new Error(`API request failed after ${API_CONFIG.RETRY_ATTEMPTS} attempts: ${error.message}`);
        }

        // Si es error de red o timeout, reintentar
        if (error.name === 'AbortError' || 
            error.message.includes('network') || 
            error.message.includes('Failed to fetch')) {
            
            console.warn(`API request failed, retrying... (${API_CONFIG.RETRY_ATTEMPTS - attempts + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
            
            // Esperar antes del siguiente intento (backoff exponencial)
            const delay = Math.pow(2, API_CONFIG.RETRY_ATTEMPTS - attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return makeApiRequest(url, options, attempts - 1);
        }

        throw error;
    }
}

/**
 * Cargar todos los productos desde la API
 * @param {boolean} forceRefresh - Forzar actualización del cache
 * @returns {Promise<Array>} Array de productos
 */
async function loadProducts(forceRefresh = false) {
    // Verificar cache
    const now = Date.now();
    if (!forceRefresh && 
        productsCache && 
        cacheTimestamp && 
        (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached products data');
        return productsCache;
    }

    try {
        console.log('Loading products from Pages Functions API...');
        
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`;
        console.log('API URL:', url);
        
        const response = await makeApiRequest(url);
        console.log('API Response received:', response);

        // La respuesta viene con estructura correcta del middleware
        let productsData;
        if (response && response.code === 200 && response.result && Array.isArray(response.result)) {
            // Estructura del middleware: {code: 200, result: [...], extra: [], paging: {...}}
            productsData = response.result;
        } else if (response && response.items && Array.isArray(response.items)) {
            // Estructura alternativa
            productsData = response.items;
        } else if (response && Array.isArray(response)) {
            // Array directo
            productsData = response;
        } else {
            console.error('Invalid API response structure:', response);
            throw new Error('Invalid API response structure');
        }

        // Procesar y filtrar productos
        const products = productsData.map(product => normalizeProduct(product));
        const filteredProducts = filterCustomizableProducts(products);

        // Actualizar cache
        productsCache = filteredProducts;
        cacheTimestamp = now;

        console.log(`Loaded ${filteredProducts.length} customizable products from Pages Functions`);
        return filteredProducts;

    } catch (error) {
        console.error('Error loading products from API:', error);
        
        // En caso de error, intentar usar cache aunque esté expirado
        if (productsCache) {
            console.warn('Using expired cache due to API error');
            return productsCache;
        }

        // Si no hay cache, usar productos demo
        console.warn('No cache available, showing demo products');
        return generateDemoProducts();
    }
}

/**
 * Cargar un producto específico por ID
 * @param {string|number} productId - ID del producto
 * @returns {Promise<Object|null>} Producto o null si no se encuentra
 */
async function loadProduct(productId) {
    if (!productId) {
        throw new Error('Product ID is required');
    }

    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT(productId)}`;
        const response = await makeApiRequest(url);

        // La respuesta del producto específico con estructura correcta
        let productData;
        if (response && response.code === 200 && response.result && response.result.sync_product) {
            // Estructura del middleware con sync_product y sync_variants
            productData = response.result.sync_product;
            productData.variants = response.result.sync_variants || [];
            productData.files = [];
            
            // Extraer archivos de todas las variantes
            if (productData.variants && productData.variants.length > 0) {
                const allFiles = [];
                productData.variants.forEach(variant => {
                    if (variant.files && Array.isArray(variant.files)) {
                        allFiles.push(...variant.files);
                    }
                });
                productData.files = allFiles;
            }
        } else if (response && response.result) {
            productData = response.result;
        } else if (response && response.item) {
            productData = response.item;
        } else if (response && response.code === 200) {
            // Producto directo en la respuesta
            productData = response;
        } else {
            console.error('Invalid product response structure:', response);
            throw new Error('Invalid product response structure');
        }

        return normalizeProduct(productData);

    } catch (error) {
        console.error(`Error loading product ${productId}:`, error);
        
        // Fallback a datos demo si la API falla
        console.log('Using demo data for product:', productId);
        return loadDemoProductDetail(productId);
    }
}

/**
 * Verificar salud del worker
 * @returns {Promise<Object>} Estado del worker
 */
async function checkWorkerHealth() {
    try {
        const startTime = Date.now();
        const response = await makeApiRequest(`${API_CONFIG.BASE_URL}/health`);
        const endTime = Date.now();
        
        return {
            status: 'healthy',
            responseTime: endTime - startTime,
            platform: response.platform || 'Unknown',
            api_configured: response.api_configured,
            version: response.version,
            timestamp: response.timestamp,
            error: null
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Verificar salud de la API de productos
 * @returns {Promise<Object>} Estado de la API
 */
async function checkApiHealth() {
    try {
        const startTime = Date.now();
        const response = await makeApiRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`);
        const endTime = Date.now();
        
        return {
            status: 'healthy',
            responseTime: endTime - startTime,
            hasData: !!(response && response.code === 200 && response.result && Array.isArray(response.result)),
            productCount: response.result ? response.result.length : 0,
            responsePreview: response,
            error: null
        };
    } catch (error) {
        return {
            status: 'error',
            responseTime: null,
            hasData: false,
            productCount: 0,
            error: error.message
        };
    }
}

// [Resto de funciones igual que en la versión Workers...]
// (normalizeProduct, filterCustomizableProducts, etc.)

/**
 * Normalizar estructura de producto para consistencia
 * @param {Object} product - Producto desde la API
 * @returns {Object} Producto normalizado
 */
function normalizeProduct(product) {
    // Manejar estructura Printful que puede tener nested thumbnails
    let thumbnailUrl = '';
    if (product.thumbnail_url) {
        thumbnailUrl = product.thumbnail_url;
    } else if (product.thumbnails && product.thumbnails.length > 0) {
        thumbnailUrl = product.thumbnails[0].url || '';
    } else if (product.image) {
        thumbnailUrl = product.image;
    } else if (product.images && product.images.length > 0) {
        thumbnailUrl = product.images[0];
    } else if (product.files && product.files.length > 0) {
        const previewFile = product.files.find(file => file.type === 'preview' && file.preview_url);
        if (previewFile) {
            thumbnailUrl = previewFile.preview_url;
        } else {
            thumbnailUrl = product.files[0].url || product.files[0].thumbnail_url || '';
        }
    }

    // Obtener descripción del producto
    let description = '';
    if (product.description) {
        description = product.description;
    } else if (product.title) {
        description = product.title;
    } else if (product.type_name) {
        description = `High-quality ${product.type_name.toLowerCase()} with customizable design`;
    }

    // Manejar variantes
    let variants = 0;
    if (product.variants && Array.isArray(product.variants)) {
        variants = product.variants.length;
    } else if (product.synced) {
        variants = product.synced;
    } else if (product.total_variants) {
        variants = product.total_variants;
    }

    return {
        id: product.id || product.external_id || 'unknown',
        name: product.title || product.name || 'Producto sin nombre',
        thumbnail_url: thumbnailUrl,
        description: description,
        variants: variants,
        synced: product.synced || 0,
        type_name: product.type_name || 'Custom Item',
        is_customizable: true,
        printful_id: product.id
    };
}

/**
 * Filtrar productos que son personalizables
 * @param {Array} products - Lista de productos
 * @returns {Array} Productos filtrados
 */
function filterCustomizableProducts(products) {
    return products.filter(product => {
        // Los productos de Printful store son personalizables por defecto
        return product.is_customizable && product.variants > 0;
    });
}

/**
 * Limpiar cache de productos
 */
function clearProductsCache() {
    productsCache = null;
    cacheTimestamp = null;
    console.log('Products cache cleared');
}

// [Funciones demo igual que antes...]
function generateDemoProducts() {
    return [
        {
            id: 'demo-1',
            name: 'Camiseta Personalizada Demo',
            thumbnail_url: 'catalogo/remeras/remera_20_celestial.png',
            description: 'Camiseta 100% algodón personalizable',
            variants: 6,
            synced: 6,
            type_name: 'T-Shirt',
            is_customizable: true,
            printful_id: 'demo-1'
        }
    ];
}

function loadDemoProductDetail(productId) {
    return {
        id: productId,
        name: `Demo Product ${productId}`,
        variants: 12,
        synced: 12,
        thumbnail_url: 'catalogo/remeras/remera_20_celestial.png',
        description: 'Producto demo - error en API',
        is_customizable: true
    };
}

// Función de debugging global
window.debugApi = {
    checkWorker: checkWorkerHealth,
    checkApi: checkApiHealth,
    loadProducts: loadProducts,
    loadProduct: loadProduct,
    clearCache: clearProductsCache,
    config: API_CONFIG,
    testAll: async function() {
        console.group('🔧 API Test Suite - Pages Functions');
        
        try {
            // Test 1: Worker health
            console.log('Test 1: Worker Health');
            const workerTest = await checkWorkerHealth();
            console.log('✅ Worker:', workerTest);
            
            // Test 2: API health
            console.log('Test 2: API Health');
            const apiTest = await checkApiHealth();
            console.log('✅ API:', apiTest);
            
            // Test 3: Load products
            console.log('Test 3: Load Products');
            const products = await loadProducts();
            console.log('✅ Products loaded:', products.length);
            
            console.groupEnd();
            return {
                success: true,
                worker: workerTest,
                api: apiTest,
                products: products.length
            };
            
        } catch (error) {
            console.groupEnd();
            console.error('❌ Test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};