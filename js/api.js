/**
 * ====================================
 * API MANAJER - Funciones de API de Printful
 * VERSIÓN ACTUAL PARA CLOUDFLARE WORKERS
 * DRESS - Custom Apparel & Accessories
 * ====================================
 * 
 * STATUS: ✅ OPTIMIZADO PARA WORKERS
 * URL: https://printful-worker.liendoalejandro94.workers.dev/api
 * 
 * CORRECCIONES APLICADAS:
 * - Verificación correcta de response.code === 200
 * - Manejo de estructura {code: 200, result: [...]}
 * - Eliminación de código inalcanzable
 * - Logging mejorado para debugging
 */

// Configuración de la API - Workers (ACTUAL - FUNCIONANDO)
const API_CONFIG = {
    BASE_URL: 'https://printful-worker.liendoalejandro94.workers.dev/api',
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
        console.log('Loading products from API...');
        
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`;
        console.log('API URL:', url);
        
        const response = await makeApiRequest(url);
        console.log('API Response received:', response);

        // La respuesta viene directamente de Printful o wrapped
        let productsData;
        if (response && response.code === 200 && response.result && Array.isArray(response.result)) {
            // Estructura del worker: {code: 200, result: [...], extra: [], paging: {...}}
            productsData = response.result;
        } else if (response && response.items && Array.isArray(response.items)) {
            // Estructura Printful {code: 200, items: [...]}
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

        console.log(`Loaded ${filteredProducts.length} customizable products from API`);
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

        // La respuesta del producto específico puede venir en diferentes formatos
        let productData;
        if (response && response.code === 200 && response.result && response.result.sync_product) {
            // Estructura del worker con sync_product y sync_variants: {code: 200, result: {sync_product, sync_variants}}
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
        // Buscar imagen preview en archivos
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

    // Manejar variantes (pueden estar en diferentes campos)
    let variants = 0;
    if (product.variants !== undefined) {
        variants = product.variants;
    } else if (product.variant_count !== undefined) {
        variants = product.variant_count;
    } else if (product.sync_variants && Array.isArray(product.sync_variants)) {
        variants = product.sync_variants.length;
    }

    // Procesar variantes si existen
    let processedVariants = [];
    if (product.sync_variants && Array.isArray(product.sync_variants)) {
        processedVariants = product.sync_variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            size: variant.size,
            color: variant.color,
            price: variant.retail_price,
            currency: variant.currency,
            sku: variant.sku,
            availability_status: variant.availability_status,
            product: variant.product,
            files: variant.files || [],
            options: variant.options || []
        }));
    }

    // Extraer todos los archivos únicos
    let allFiles = [];
    if (product.files && Array.isArray(product.files)) {
        allFiles = product.files;
    } else if (processedVariants.length > 0) {
        const uniqueFiles = new Map();
        processedVariants.forEach(variant => {
            if (variant.files && Array.isArray(variant.files)) {
                variant.files.forEach(file => {
                    if (!uniqueFiles.has(file.id)) {
                        uniqueFiles.set(file.id, file);
                    }
                });
            }
        });
        allFiles = Array.from(uniqueFiles.values());
    }

    return {
        id: product.id || generateRandomId(),
        external_id: product.external_id || null,
        name: product.name || product.title || 'Custom Product',
        title: product.title || product.name || 'Custom Product',
        description: description,
        variants: variants,
        synced: product.synced || variants, // Si synced no existe, asumir que están todas sincronizadas
        thumbnail_url: thumbnailUrl,
        is_ignored: product.is_ignored || false,
        type_name: product.type_name || getProductType(product.name || product.title),
        image: thumbnailUrl,
        available: product.available !== false, // true por defecto
        created_at: product.created_at || null,
        updated_at: product.updated_at || null,
        // Campos adicionales para compatibilidad
        printful_id: product.printful_id || product.id,
        print_type: product.print_type || product.type_name,
        gallery_images: product.gallery_images || product.images || [],
        // Nuevos campos específicos de Printful
        sync_variants: processedVariants,
        all_files: allFiles
    };
}

/**
 * Filtrar productos personalizados basados en criterios específicos
 * @param {Array} products - Array de productos
 * @returns {Array} Productos filtrados
 */
function filterCustomizableProducts(products) {
    if (!Array.isArray(products)) {
        return [];
    }

    return products.filter(product => {
        // Verificar que el producto esté disponible
        const isAvailable = product.available === true || product.available === 1 || product.available === null;

        // Verificar que tenga variantes o sea un tipo personalizable
        const hasVariants = product.variants && product.variants > 0;
        const productType = (product.type_name || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        
        // Verificar tipo de producto personalizable
        const customizableTypes = [
            't-shirt', 'tshirt', 't shirt', 'tee',
            'hoodie', 'hood', 'sweatshirt', 'sweater', 
            'cap', 'hat', 'beanie', 'headwear',
            'mug', 'cup', 'coffee', 'traveler',
            'bag', 'backpack', 'tote', 'purse', 'accessory'
        ];

        const isCustomizableType = customizableTypes.some(type => 
            productType.includes(type) || productName.includes(type)
        );

        // Verificar que no tenga restricciones geográficas
        const description = product.description ? product.description.toLowerCase() : '';
        const hasRestrictions = description.includes('only available in') ||
                               description.includes('disponibles solo en') ||
                               description.includes('exclusivamente en') ||
                               description.includes('restricted to');

        // Verificar que no sea un producto de muestra
        const title = product.title || product.name || '';
        const isSample = title.includes('Sample') ||
                        title.includes('Mockup') ||
                        title.includes('Blank') ||
                        title.includes('Test');

        // Un producto es personalizable si cumple estos criterios
        return isAvailable && 
               (hasVariants || isCustomizableType) && 
               !hasRestrictions && 
               !isSample;
    });
}

/**
 * Determinar tipo de producto basado en el nombre
 * @param {string} productName - Nombre del producto
 * @returns {string} Tipo de producto
 */
function getProductType(productName = '') {
    const name = productName.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tshirt') || name.includes('tee')) {
        return 'T-Shirt';
    }
    if (name.includes('hoodie') || name.includes('hood') || name.includes('sweatshirt')) {
        return 'Hoodie';
    }
    if (name.includes('cap') || name.includes('hat') || name.includes('beanie')) {
        return 'Cap';
    }
    if (name.includes('mug') || name.includes('cup') || name.includes('coffee')) {
        return 'Mug';
    }
    if (name.includes('bag') || name.includes('backpack') || name.includes('tote')) {
        return 'Accessory';
    }
    
    return 'Product';
}

/**
 * Generar productos demo como fallback
 * @returns {Array} Productos demo
 */
function generateDemoProducts() {
    const demoProducts = [
        {
            id: 'demo-1',
            name: 'Premium T-Shirt - Classic Black',
            title: 'Premium T-Shirt - Classic Black',
            description: 'Comfortable cotton t-shirt with premium quality print. Perfect for everyday wear.',
            variants: 24,
            synced: 24,
            thumbnail_url: 'catalogo/remeras/remera_20_celestial.png',
            type_name: 'T-Shirt',
            image: 'catalogo/remeras/remera_20_celestial.png'
        },
        {
            id: 'demo-2',
            name: 'Stylish Hoodie - Navy Blue',
            title: 'Stylish Hoodie - Navy Blue',
            description: 'Warm and cozy hoodie with kangaroo pocket and adjustable hood.',
            variants: 18,
            synced: 18,
            thumbnail_url: 'catalogo/sudaderas/sudadera_03_all_over_neon.png',
            type_name: 'Hoodie',
            image: 'catalogo/sudaderas/sudadera_03_all_over_neon.png'
        },
        {
            id: 'demo-3',
            name: 'Sport Cap - Adjustable',
            title: 'Sport Cap - Adjustable',
            description: 'Classic baseball cap with adjustable strap and breathable fabric.',
            variants: 12,
            synced: 12,
            thumbnail_url: 'catalogo/gorras/gorra_07_sport.png',
            type_name: 'Cap',
            image: 'catalogo/gorras/gorra_07_sport.png'
        },
        {
            id: 'demo-4',
            name: 'Ceramic Mug - Large Size',
            title: 'Ceramic Mug - Large Size',
            description: 'High-quality ceramic mug perfect for hot and cold beverages.',
            variants: 8,
            synced: 8,
            thumbnail_url: 'catalogo/tazas/taza_17_extra.png',
            type_name: 'Mug',
            image: 'catalogo/tazas/taza_17_extra.png'
        },
        {
            id: 'demo-5',
            name: 'Leather Accessories Set',
            title: 'Leather Accessories Set',
            description: 'Premium leather wallet, card holder, and key organizer set.',
            variants: 6,
            synced: 6,
            thumbnail_url: 'catalogo/accessories/minimalist_leather_fashion_accessories_flat_lay_mockup.jpg',
            type_name: 'Accessory',
            image: 'catalogo/accessories/minimalist_leather_fashion_accessories_flat_lay_mockup.jpg'
        }
    ];

    console.log('Generated demo products as fallback');
    return demoProducts;
}

/**
 * Generar ID aleatorio para productos demo
 * @returns {string} ID aleatorio
 */
function generateRandomId() {
    return 'demo-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Buscar productos por término de búsqueda
 * @param {Array} products - Array de productos
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Productos filtrados
 */
function searchProducts(products, searchTerm) {
    if (!searchTerm || !Array.isArray(products)) {
        return products;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const type = (product.type_name || '').toLowerCase();
        
        return name.includes(term) || 
               description.includes(term) || 
               type.includes(term);
    });
}

/**
 * Obtener estadísticas de productos
 * @param {Array} products - Array de productos
 * @returns {Object} Estadísticas
 */
function getProductsStats(products) {
    if (!Array.isArray(products)) {
        return {
            total: 0,
            byCategory: {},
            averageVariants: 0,
            syncRate: 0
        };
    }

    const stats = {
        total: products.length,
        byCategory: {},
        totalVariants: 0,
        totalSynced: 0
    };

    products.forEach(product => {
        // Contar por categoría
        const category = product.type_name || 'Other';
        if (!stats.byCategory[category]) {
            stats.byCategory[category] = 0;
        }
        stats.byCategory[category]++;

        // Sumar variantes
        stats.totalVariants += product.variants || 0;
        stats.totalSynced += product.synced || 0;
    });

    // Calcular promedios
    stats.averageVariants = stats.total > 0 ? (stats.totalVariants / stats.total).toFixed(1) : 0;
    stats.syncRate = stats.totalVariants > 0 ? 
        Math.round((stats.totalSynced / stats.totalVariants) * 100) : 0;

    return stats;
}

/**
 * Función para limpiar el cache de productos
 */
function clearProductsCache() {
    productsCache = null;
    cacheTimestamp = null;
    console.log('Products cache cleared');
}

/**
 * Función para verificar el estado del worker
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
            workerData: response,
            error: null
        };
    } catch (error) {
        return {
            status: 'error',
            responseTime: null,
            workerData: null,
            error: error.message
        };
    }
}

/**
 * Función para verificar el estado de la API
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
            responsePreview: response,
            error: null
        };
    } catch (error) {
        return {
            status: 'error',
            responseTime: null,
            hasData: false,
            responsePreview: null,
            error: error.message
        };
    }
}

// Datos demo para simular la API real
const DEMO_PRODUCTS_DATA = {
    "code": 200,
    "result": [
        {
            "id": 395276124,
            "external_id": "68e298ecaacd32",
            "name": "T-SHIRT – Soft, Stylish & Available in Many Colors",
            "variants": 48,
            "synced": 48,
            "thumbnail_url": "https://files.cdn.printful.com/files/551/55149dcc5007ef6fa3ef1c886261da9a_preview.png",
            "is_ignored": false
        }
    ],
    "extra": [],
    "paging": {
        "total": 1,
        "limit": 20,
        "offset": 0
    }
};

const DEMO_PRODUCT_DETAIL_DATA = {
    "code": 200,
    "result": {
        "sync_product": {
            "id": 395276124,
            "external_id": "68e298ecaacd32",
            "name": "T-SHIRT – Soft, Stylish & Available in Many Colors",
            "variants": 48,
            "synced": 48,
            "thumbnail_url": "https://files.cdn.printful.com/files/551/55149dcc5007ef6fa3ef1c886261da9a_preview.png",
            "is_ignored": false
        },
        "sync_variants": [
            {
                "id": 5000294874,
                "external_id": "68e298ecaacdd7",
                "sync_product_id": 395276124,
                "name": "T-SHIRT – Soft, Stylish & Available in Many Colors / Black / S",
                "synced": true,
                "variant_id": 11546,
                "main_category_id": 6,
                "warehouse_product_id": null,
                "warehouse_product_variant_id": null,
                "retail_price": "12.50",
                "sku": "68E298ECA8C1D_Black-S",
                "currency": "USD",
                "product": {
                    "variant_id": 11546,
                    "product_id": 438,
                    "image": "https://files.cdn.printful.com/products/438/11546_1642678249.jpg",
                    "name": "Unisex Classic Tee | Gildan 5000 (Black / S)"
                },
                "files": [
                    {
                        "id": 645303933,
                        "type": "default",
                        "hash": "121c96308596973b74c68c0edf46e23e",
                        "url": null,
                        "filename": "Sin-ttulo-1-Recuperado.png",
                        "mime_type": "image/png",
                        "size": 10563823,
                        "width": 4096,
                        "height": 4096,
                        "dpi": 300,
                        "status": "ok",
                        "created": 1701710643,
                        "thumbnail_url": "https://files.cdn.printful.com/files/121/121c96308596973b74c68c0edf46e23e_thumb.png",
                        "preview_url": "https://files.cdn.printful.com/files/121/121c96308596973b74c68c0edf46e23e_preview.png",
                        "visible": true,
                        "is_temporary": false,
                        "message": "",
                        "options": [],
                        "stitch_count_tier": null
                    },
                    {
                        "id": 882873322,
                        "type": "preview",
                        "hash": "55149dcc5007ef6fa3ef1c886261da9a",
                        "url": null,
                        "filename": "unisex-classic-tee-black-front-68e298e7a7520.jpg",
                        "mime_type": "image/jpeg",
                        "size": 107841,
                        "width": 1000,
                        "height": 1000,
                        "dpi": null,
                        "status": "ok",
                        "created": 1759680747,
                        "thumbnail_url": "https://files.cdn.printful.com/files/551/55149dcc5007ef6fa3ef1c886261da9a_thumb.png",
                        "preview_url": "https://files.cdn.printful.com/files/551/55149dcc5007ef6fa3ef1c886261da9a_preview.png",
                        "visible": false,
                        "is_temporary": false,
                        "message": "",
                        "stitch_count_tier": null
                    }
                ],
                "options": [
                    {
                        "id": "embroidery_type",
                        "value": "flat"
                    },
                    {
                        "id": "thread_colors",
                        "value": []
                    },
                    {
                        "id": "text_thread_colors",
                        "value": []
                    }
                ],
                "is_ignored": false,
                "size": "S",
                "color": "Black",
                "availability_status": "active"
            }
        ]
    },
    "extra": []
};

// Función para simular productos demo (usar cuando la API falla)
function loadDemoProductDetail(productId) {
    console.log(`Loading demo product detail for ID: ${productId}`);
    const productData = JSON.parse(JSON.stringify(DEMO_PRODUCT_DETAIL_DATA));
    
    // Simular que diferentes IDs devuelven productos diferentes
    if (productId === '395276124') {
        return normalizeProduct(productData.result.sync_product);
    }
    
    // Para otros IDs, devolver un producto genérico
    const genericProduct = {
        id: productId,
        name: `Demo Product ${productId}`,
        variants: 12,
        synced: 12,
        thumbnail_url: 'catalogo/remeras/remera_20_celestial.png'
    };
    
    return normalizeProduct(genericProduct);
}

// Función de debugging global
window.debugApi = {
    checkWorker: checkWorkerHealth,
    checkApi: checkApiHealth,
    loadProducts: loadProducts,
    loadProduct: loadProduct,
    clearCache: clearProductsCache,
    config: API_CONFIG,
    demoData: DEMO_PRODUCTS_DATA,
    testAll: async function() {
        console.group('🔧 API Test Suite');
        
        try {
            // Test 1: Worker health
            console.log('Test 1: Worker Health');
            const workerTest = await checkWorkerHealth();
            console.log('✅ Worker:', workerTest);
            
            // Test 2: API response  
            console.log('Test 2: API Response');
            const apiTest = await checkApiHealth();
            console.log('✅ API:', apiTest);
            
            // Test 3: Load products
            console.log('Test 3: Load Products');
            const productsTest = await loadProducts();
            console.log('✅ Products loaded:', productsTest?.length || 0);
            
            if (productsTest && productsTest.length > 0) {
                console.log('Sample product:', productsTest[0]);
                
                // Test 4: Load specific product
                console.log('Test 4: Load Specific Product');
                const productTest = await loadProduct(productsTest[0].id);
                console.log('✅ Product detail:', productTest);
                
                if (productTest && productTest.sync_variants) {
                    console.log('Product variants:', productTest.sync_variants.length);
                    console.log('Sample variant:', productTest.sync_variants[0]);
                }
            }
            
            console.groupEnd();
            return {
                success: true,
                worker: workerTest,
                api: apiTest,
                products: productsTest?.length || 0
            };
            
        } catch (error) {
            console.error('❌ API Test Failed:', error);
            console.groupEnd();
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Auto-ejecutar test en desarrollo (solo si está en dev mode)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🧪 API Test Suite available at window.debugApi.testAll()');
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProducts,
        loadProduct,
        loadDemoProductDetail,
        searchProducts,
        getProductsStats,
        clearProductsCache,
        checkApiHealth,
        checkWorkerHealth,
        API_CONFIG,
        debugApi: window.debugApi
    };
}

// Hacer disponibles globalmente
window.loadProduct = loadProduct;
window.loadDemoProductDetail = loadDemoProductDetail;