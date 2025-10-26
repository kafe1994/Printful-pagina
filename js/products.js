/**
 * ====================================
 * PRODUCTS JS - CORRECCIÓN DE MAPPING PRINTFUL
 * DRESS - Custom Apparel & Accessories
 * ====================================
 * 
 * PROBLEMA IDENTIFICADO: 
 * - API de Printful funciona correctamente
 * - Datos se reciben bien pero no se mapean correctamente para el rendering
 * - La función createProductCard intenta acceder a propiedades que no existen
 * 
 * SOLUCIÓN:
 * - Crear mapeador que adapte datos de Printful al formato esperado
 * - Usar propiedades reales: name, thumbnail_url, variants, synced
 * - Generar descripciones automáticas basadas en el nombre del producto
 */

let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let isLoading = false;

// Configuración de categorías (actualizada para Printful)
const CATEGORY_CONFIG = {
    'tshirts': {
        name: 'T-Shirts',
        keywords: ['T-SHIRT', 'T SHIRT', 'TEE', 'SHIRT'],
        icon: '👕',
        description: 'Camisetas cómodas y versátiles para personalizar'
    },
    'hoodies': {
        name: 'Sudaderas',
        keywords: ['HOODIE', 'HOODED', 'SWEATSHIRT', 'SWEATER'],
        icon: '🧥',
        description: 'Sudaderas suaves para el día a día'
    },
    'mugs': {
        name: 'Tazas',
        keywords: ['MUG', 'COFFEE', 'CUP'],
        icon: '☕',
        description: 'Tazas para tu café diario'
    },
    'caps': {
        name: 'Gorras',
        keywords: ['CAP', 'HAT', 'BEANIE'],
        icon: '🧢',
        description: 'Gorras deportivas y casuales'
    },
    'accessories': {
        name: 'Accesorios',
        keywords: ['BAG', 'POUCH', 'TOTE', 'BACKPACK', 'WALLET', 'PURSE'],
        icon: '🎒',
        description: 'Completa tu estilo con estos accesorios'
    }
};

/**
 * Mapeador de productos de Printful
 * Adapta los datos de Printful al formato esperado por el frontend
 */
function mapPrintfulProduct(printfulProduct) {
    return {
        // Propiedades básicas de Printful
        id: printfulProduct.id,
        name: printfulProduct.name,
        variants: printfulProduct.variants || 0,
        synced: printfulProduct.synced || 0,
        thumbnail_url: printfulProduct.thumbnail_url,
        external_id: printfulProduct.external_id,
        is_ignored: printfulProduct.is_ignored,
        
        // Propiedades mapeadas para el frontend
        type_name: printfulProduct.name, // Mapeo a type_name
        description: generateProductDescription(printfulProduct.name), // Generar descripción
        
        // Mapeos adicionales para compatibilidad
        title: printfulProduct.name,
        image: printfulProduct.thumbnail_url,
        
        // Meta información
        category: getProductCategory(printfulProduct),
        price_range: generatePriceRange(printfulProduct.variants),
        featured: true, // Todos los productos de Printful son "featured"
        personalized: true
    };
}

/**
 * Generar descripción basada en el nombre del producto
 */
function generateProductDescription(productName) {
    if (!productName) return 'Producto personalizado de alta calidad.';
    
    const name = productName.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tee')) {
        return 'Camiseta de algodón premium, suave al tacto y perfecta para personalizar. Disponible en múltiples tamaños y colores.';
    }
    
    if (name.includes('hoodie')) {
        return 'Sudadera cómoda con capucha, ideal para uso casual. Tejido suave y abrigador.';
    }
    
    if (name.includes('mug') || name.includes('cup')) {
        return 'Taza resistente al calor, perfecta para tu café o té. Ideal para regalar y personalizar.';
    }
    
    if (name.includes('cap') || name.includes('hat')) {
        return 'Gorra ajustable con bordado personalizado. Diseño clásico y moderno.';
    }
    
    return 'Producto de alta calidad, listo para personalizar con tu diseño único. Materiales premium y durabilidad garantizada.';
}

/**
 * Determinar categoría basada en el nombre del producto
 */
function getProductCategory(product) {
    const productName = product.name ? product.name.toLowerCase() : '';
    
    for (const [categoryKey, config] of Object.entries(CATEGORY_CONFIG)) {
        for (const keyword of config.keywords) {
            if (productName.includes(keyword.toLowerCase())) {
                return categoryKey;
            }
        }
    }
    
    // Categoría por defecto
    return 'accessories';
}

/**
 * Generar rango de precio basado en variantes
 */
function generatePriceRange(variants) {
    if (!variants || variants === 0) return '$15.99';
    return '$12.99 - $24.99';
}

/**
 * Función principal mejorada para cargar productos
 */
async function loadProductsData() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState();
        
        console.log('🔄 Loading products from Printful API...');
        
        // Verificar que la función esté disponible
        if (typeof loadProducts !== 'function') {
            throw new Error('loadProducts function not available');
        }
        
        // Cargar productos desde API de Printful
        const printfulProducts = await loadProducts();
        
        console.log('📦 Raw Printful products:', printfulProducts);
        
        // Verificar que tenemos datos válidos
        if (!Array.isArray(printfulProducts) || printfulProducts.length === 0) {
            console.warn('⚠️ No products returned from Printful API');
            throw new Error('No products available from Printful');
        }
        
        // Mapear productos de Printful al formato esperado
        allProducts = printfulProducts.map(mapPrintfulProduct);
        
        console.log(`✅ Mapped ${allProducts.length} products from Printful`);
        console.log('📋 Mapped products:', allProducts);
        
        // Aplicar filtro inicial
        filterProducts();
        
        // Ocultar loading
        hideLoadingState();
        
        // Mostrar notificación de éxito
        showNotification(`${allProducts.length} productos de Printful cargados exitosamente`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        hideLoadingState();
        showNoProductsState(error.message);
        showNotification('Error cargando productos. Mostrando productos de demostración.', 'warning');
        
        // Cargar productos demo como fallback
        loadDemoProducts();
    } finally {
        isLoading = false;
    }
}

/**
 * Filtrar productos por categoría usando lógica inteligente
 */
function filterProducts() {
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
        filteredProducts = [];
        return;
    }
    
    if (currentFilter === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => {
            const productCategory = product.category || 'accessories';
            return productCategory === currentFilter;
        });
    }
    
    console.log(`🔍 Filtered to ${filteredProducts.length} products for category: ${currentFilter}`);
    renderProducts();
}

/**
 * Función principal para renderizar productos
 */
function renderProducts() {
    const productsGrid = document.getElementById('products-grid') || document.getElementById('products-container');
    if (!productsGrid) {
        console.warn('⚠️ Products grid container not found');
        return;
    }
    
    console.log(`🎨 Rendering ${filteredProducts.length} products`);
    
    if (filteredProducts.length === 0) {
        showNoProductsState();
        return;
    }
    
    // Limpiar grid
    productsGrid.innerHTML = '';
    
    // Crear cards de productos
    const productsHTML = filteredProducts.map((product, index) => 
        createProductCard(product, index)
    ).join('');
    
    productsGrid.innerHTML = productsHTML;
    
    // Añadir animaciones de entrada
    animateProductCards();
    
    // Añadir event listeners a las nuevas cards
    initializeProductCards();
    
    // Actualizar estadísticas
    updateProductsStatsDisplay();
    
    console.log('✅ Products rendered successfully');
}

/**
 * Crear HTML para una tarjeta de producto (MEJORADO PARA PRINTFUL)
 */
function createProductCard(product, index) {
    const productId = product.id || generateProductId();
    const productName = product.name || 'Producto Personalizado';
    const productType = product.type_name || 'Producto';
    const productDescription = product.description || 'Producto de alta calidad personalizable';
    const productImage = product.thumbnail_url || product.image || generatePlaceholderImage(productType);
    const variants = product.variants || 0;
    const synced = product.synced || 0;
    
    // Determinar categoría del producto
    const category = getProductCategory(product);
    const categoryInfo = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['accessories'];
    
    console.log(`🎯 Rendering product: ${productName} (${variants} variants, ${synced} synced)`);
    
    return `
        <div class="product-card fade-in-up delay-${Math.min(index * 100, 500)}" 
             data-product-id="${productId}"
             data-category="${category}"
             data-variants="${variants}"
             tabindex="0"
             role="article"
             aria-label="${productName}">
            
            <div class="product-image-container">
                <img src="${productImage}" 
                     alt="${productName}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='${generatePlaceholderImage(productType)}'">
                <div class="product-badge">
                    <span class="sync-status">${synced > 0 ? `${synced} variantes` : 'Disponible'}</span>
                </div>
            </div>
            
            <div class="product-info">
                <h3 class="product-title">${productName}</h3>
                <div class="product-meta">
                    <span class="product-type">${productType}</span>
                    <span class="product-category">${categoryInfo.icon} ${categoryInfo.name}</span>
                </div>
                
                <p class="product-description">${truncateText(productDescription, 120)}</p>
                
                ${variants > 0 ? `
                <div class="product-variants">
                    <div class="variants-label">Tamaños disponibles:</div>
                    <div class="variants-grid">
                        ${generateSizeVariants(productType).map(size => `
                            <div class="variant-option" 
                                 data-variant-type="size" 
                                 data-value="${size}">${size}</div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="product-variants">
                    <div class="variants-label">Colores:</div>
                    <div class="variants-grid">
                        ${generateColorVariants(productType).map(color => `
                            <div class="variant-option" 
                                 data-variant-type="color" 
                                 data-value="${color}">${color}</div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-primary btn-personalize" data-product-id="${productId}">
                        ✨ Personalizar
                    </button>
                    <button class="btn btn-secondary btn-view-details" data-product-id="${productId}">
                        👁️ Ver Detalles
                    </button>
                </div>
                
                <div class="product-stats">
                    <small class="product-sync-info">
                        Sincronizado: ${synced} de ${variants} variantes
                    </small>
                </div>
                ` : `
                <div class="product-actions">
                    <button class="btn btn-primary btn-personalize" data-product-id="${productId}">
                        ✨ Personalizar
                    </button>
                    <button class="btn btn-secondary btn-view-details" data-product-id="${productId}">
                        👁️ Ver Detalles
                    </button>
                </div>
                `}
            </div>
        </div>
    `;
}

/**
 * Truncar texto helper
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Generar ID único para productos
 */
function generateProductId() {
    return 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generar imagen placeholder
 */
function generatePlaceholderImage(productType) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOUM5Q0EzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdG88L3RleHQ+PC9zdmc+';
}

/**
 * Generar variantes de tamaños
 */
function generateSizeVariants(productType) {
    const type = productType.toLowerCase();
    
    if (type.includes('t-shirt') || type.includes('tee') || type.includes('shirt')) {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
    
    if (type.includes('hoodie') || type.includes('sweater')) {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
    
    if (type.includes('mug') || type.includes('cup')) {
        return ['11oz', '15oz'];
    }
    
    return ['Estándar'];
}

/**
 * Generar variantes de colores
 */
function generateColorVariants(productType) {
    const type = productType.toLowerCase();
    
    if (type.includes('t-shirt') || type.includes('tee') || type.includes('shirt')) {
        return ['Blanco', 'Negro', 'Gris', 'Azul', 'Rojo', 'Verde'];
    }
    
    if (type.includes('hoodie') || type.includes('sweater')) {
        return ['Negro', 'Gris', 'Azul Marino', 'Rojo', 'Verde'];
    }
    
    if (type.includes('mug') || type.includes('cup')) {
        return ['Blanco', 'Negro', 'Gris', 'Azul'];
    }
    
    return ['Estándar'];
}

/**
 * Mostrar estado de carga
 */
function showLoadingState() {
    const productsGrid = document.getElementById('products-grid') || document.getElementById('products-container');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Cargando productos de Printful...</p>
            </div>
        `;
    }
}

/**
 * Ocultar estado de carga
 */
function hideLoadingState() {
    // Se maneja en renderProducts()
}

/**
 * Mostrar estado sin productos
 */
function showNoProductsState(errorMessage = '') {
    const productsGrid = document.getElementById('products-grid') || document.getElementById('products-container');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products-state">
                <div class="no-products-icon">🛍️</div>
                <h3>No hay productos disponibles</h3>
                <p>${errorMessage || 'No se pudieron cargar los productos desde Printful.'}</p>
                <button class="btn btn-primary" onclick="loadProductsData()">Reintentar</button>
            </div>
        `;
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Animar tarjetas de productos
 */
function animateProductCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Inicializar tarjetas de productos
 */
function initializeProductCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        // Añadir eventos de click
        card.addEventListener('click', handleProductClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleProductClick(e);
            }
        });
    });
    
    console.log(`🔗 Initialized ${cards.length} product card event listeners`);
}

/**
 * Manejar click en producto
 */
function handleProductClick(e) {
    const card = e.currentTarget;
    const productId = card.dataset.productId;
    const product = allProducts.find(p => p.id == productId);
    
    if (product) {
        console.log('🖱️ Product clicked:', product);
        showProductDetails(product);
    }
}

/**
 * Mostrar detalles del producto
 */
function showProductDetails(product) {
    alert(`Producto: ${product.name}\n\nVariantes: ${product.variants}\nSincronizadas: ${product.synced}\n\n${product.description}`);
}

/**
 * Actualizar estadísticas
 */
function updateProductsStatsDisplay() {
    const totalElement = document.getElementById('total-products');
    const filteredElement = document.getElementById('filtered-products');
    
    if (totalElement) {
        totalElement.textContent = allProducts.length;
    }
    
    if (filteredElement) {
        filteredElement.textContent = filteredProducts.length;
    }
}

/**
 * Esperar a que funciones de API estén disponibles
 */
function waitForApiFunctions(maxAttempts = 50, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof loadProducts === 'function' && 
                typeof checkWorkerHealth === 'function' && 
                typeof checkApiHealth === 'function') {
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('API functions timeout'));
            }
        }, interval);
    });
}

/**
 * Función de carga con debugging
 */
async function loadProductsDataWithDebug() {
    console.log('🔍 Debug: Starting products load with debug logging');
    
    // Verificar disponibilidad de funciones
    if (typeof checkWorkerHealth !== 'function' || typeof checkApiHealth !== 'function') {
        console.error('❌ API functions not available');
        return loadProductsData();
    }
    
    // Verificar salud del worker
    try {
        const workerHealth = await checkWorkerHealth();
        console.log('✅ Worker health:', workerHealth);
    } catch (error) {
        console.error('❌ Worker health check failed:', error);
        return loadProductsData();
    }
    
    // Verificar salud de la API
    try {
        const apiHealth = await checkApiHealth();
        console.log('✅ API health:', apiHealth);
    } catch (error) {
        console.error('❌ API health check failed:', error);
        return loadProductsData();
    }
    
    // Cargar productos
    return await loadProductsData();
}

/**
 * Cargar productos de demostración
 */
function loadDemoProducts() {
    console.log('📦 Loading demo products as fallback');
    
    allProducts = [
        {
            id: 'demo_1',
            name: 'Camiseta Básica Premium',
            type_name: 'T-Shirt Premium',
            description: 'Camiseta de algodón 100% premium, suave y cómoda para uso diario.',
            thumbnail_url: generatePlaceholderImage('t-shirt'),
            variants: 15,
            synced: 12,
            category: 'tshirts',
            price_range: '$14.99'
        },
        {
            id: 'demo_2',
            name: 'Sudadera Con Capucha',
            type_name: 'Hoodie Classic',
            description: 'Sudadera con capucha perfecta para el clima frío, suave al tacto.',
            thumbnail_url: generatePlaceholderImage('hoodie'),
            variants: 8,
            synced: 8,
            category: 'hoodies',
            price_range: '$29.99'
        },
        {
            id: 'demo_3',
            name: 'Taza de Cerámica',
            type_name: 'Ceramic Mug',
            description: 'Taza resistente al calor, perfecta para tu café matutino.',
            thumbnail_url: generatePlaceholderImage('mug'),
            variants: 6,
            synced: 6,
            category: 'mugs',
            price_range: '$9.99'
        }
    ];
    
    filterProducts();
    showNotification('Usando productos de demostración', 'warning');
}

/**
 * Herramientas de debugging globales
 */
window.debugProducts = {
    testAll: async function() {
        console.log('🧪 Running complete product debugging...');
        
        try {
            const workerHealth = await checkWorkerHealth();
            console.log('✅ Worker health:', workerHealth);
            
            const apiHealth = await checkApiHealth();
            console.log('✅ API health:', apiHealth);
            
            console.log('📦 Raw products from API:', allProducts);
            console.log('🔍 Filtered products:', filteredProducts);
            console.log('📊 Total products:', allProducts.length);
            console.log('🔎 Filtered count:', filteredProducts.length);
            
            return {
                worker: workerHealth,
                api: apiHealth,
                total: allProducts.length,
                filtered: filteredProducts.length
            };
        } catch (error) {
            console.error('❌ Debug test failed:', error);
            return { error: error.message };
        }
    },
    
    checkProductsLoaded: function() {
        console.log('🔍 Checking products...');
        console.log('Total products:', allProducts.length);
        console.log('Filtered products:', filteredProducts.length);
        console.log('Current filter:', currentFilter);
        
        if (allProducts.length > 0) {
            console.log('First product:', allProducts[0]);
        }
        
        return {
            total: allProducts.length,
            filtered: filteredProducts.length,
            filter: currentFilter,
            hasData: allProducts.length > 0
        };
    },
    
    showRawData: function() {
        console.log('📋 All raw products:', allProducts);
        console.log('🔍 Filtered products:', filteredProducts);
        return { raw: allProducts, filtered: filteredProducts };
    }
};

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Products.js initialized - Printful compatible version');
    
    // Esperar a que las funciones de API estén disponibles
    waitForApiFunctions()
        .then(() => {
            console.log('✅ API functions ready, loading products...');
            loadProductsData();
        })
        .catch((error) => {
            console.warn('⚠️ API functions not ready, will retry...');
            // Reintentar después de un tiempo
            setTimeout(() => {
                loadProductsData();
            }, 2000);
        });
});

// Exportar funciones para uso global si es necesario
window.loadProductsData = loadProductsData;
window.loadProductsDataWithDebug = loadProductsDataWithDebug;
window.filterProducts = filterProducts;