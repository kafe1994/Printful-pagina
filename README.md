# DRESS - E-commerce de Ropa Personalizada

## 📋 Resumen del Proyecto

DRESS es un e-commerce moderno y completamente funcional para venta de ropa personalizada y accesorios, desarrollado con tecnologías web estándar y optimizado para Cloudflare Pages.

## ✨ Características Implementadas

### 🔧 **Arquitectura Técnica**
- **Estructura Modular**: CSS y JavaScript separados por responsabilidad
- **API Integration**: Integración completa con API de Printful
- **Filtrado Inteligente**: Sistema de filtros por categorías con palabras clave
- **Responsive Design**: Mobile-first design con breakpoints optimizados
- **Accesibilidad**: Implementación completa de ARIA y navegación por teclado

### 🎨 **Diseño y UX**
- **Variables CSS**: Sistema de diseño coherente y mantenible
- **Animaciones**: Efectos suaves y micro-interacciones
- **Loading States**: Skeleton screens y spinners animados
- **Estados Interactivos**: Hover effects y feedback visual
- **Tema Oscuro**: Diseño moderno con esquema de colores optimizado

### 📱 **Responsividad**
- **Mobile First**: Diseño optimizado para dispositivos móviles
- **Breakpoints**: Sistema de breakpoints para tablet y desktop
- **Touch Support**: Soporte completo para gestos touch
- **Performance**: Optimización de carga y renderizado

### 🔍 **Funcionalidades de Productos**
- **Categorización Inteligente**: T-Shirts, Hoodies, Mugs, Caps, Accessories
- **Búsqueda en Tiempo Real**: Filtrado dinámico de productos
- **Selección de Variantes**: Tamaños y colores seleccionables
- **Estados de Productos**: Indicadores de sincronización y disponibilidad
- **Productos Demo**: Fallback para casos sin conectividad

### 🌐 **Accesibilidad**
- **ARIA Labels**: Etiquetas semánticas completas
- **Navegación por Teclado**: Soporte completo para navegación
- **Skip Links**: Enlaces para saltar al contenido principal
- **Alto Contraste**: Soporte para preferencias de contraste
- **Reduced Motion**: Respeto por preferencias de movimiento reducido

## 📁 Estructura del Proyecto

```
/
├── index.html              # Página principal
├── products.html           # Página de productos separada
├── css/
│   ├── core.css           # Variables CSS y estilos base
│   ├── components.css     # Componentes UI específicos
│   ├── responsive.css     # Estilos responsive
│   └── animation.css      # Animaciones y transiciones
├── js/
│   ├── utils.js           # Utilidades y helpers
│   ├── api.js             # Gestión de API de Printful
│   ├── main.js            # Funcionalidad principal
│   └── products.js        # Gestión de productos y filtros
├── logo/                  # Archivos de logo
├── catalogo/              # Imágenes de productos por categoría
│   ├── remeras/          # Camisetas
│   ├── sudaderas/        # Hoodies
│   ├── gorras/           # Caps
│   ├── tazas/            # Mugs
│   └── accessories/      # Accesorios
└── portada/              # Imágenes de hero y banners
```

## 🚀 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Variables CSS, Grid, Flexbox, Animations
- **JavaScript ES6+**: Modular, async/await, clases
- **Intersection Observer**: Lazy loading y animaciones on-scroll

### APIs y Servicios
- **Printful API**: Integración con API de productos
- **Google Fonts**: Tipografía Inter
- **Cloudflare Pages**: Hosting y deployment

## 🔗 Endpoints de API

### Productos
- **GET** `https://printful-worker.liendoalejandro94.workers.dev/api/products`
- **GET** `https://printful-worker.liendoalejandro94.workers.dev/api/products/{id}`

### Estructura de Respuesta
```json
{
  "code": 200,
  "result": [
    {
      "id": 395276124,
      "external_id": "68e298ecaacd32",
      "name": "T-SHIRT – Soft, Stylish & Available in Many Colors",
      "variants": 48,
      "synced": 48,
      "thumbnail_url": "https://files.cdn.printful.com/files/551/...",
      "is_ignored": false
    }
  ],
  "paging": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

## 🎯 Categorías de Productos

### 1. 👕 T-Shirts (Camisetas)
- **Palabras Clave**: T-SHIRT, T SHIRT, TEE, SHIRT
- **Tamaños**: XS, S, M, L, XL, XXL
- **Colores**: Negro, Blanco, Gris, Azul Marino, Rojo, Azul Real

### 2. 🧥 Hoodies
- **Palabras Clave**: HOODIE, HOODED, SWEATSHIRT, SWEATER
- **Tamaños**: S, M, L, XL, XXL
- **Colores**: Negro, Gris, Azul Marino, Borgoña, Verde Bosque

### 3. ☕ Mugs (Tazas)
- **Palabras Clave**: MUG, COFFEE, CUP
- **Tamaños**: 11oz, 15oz
- **Colores**: Blanco, Negro, Azul, Rojo

### 4. 🧢 Caps (Gorras)
- **Palabras Clave**: CAP, HAT, BEANIE
- **Tamaños**: One Size
- **Colores**: Negro, Gris, Azul Marino, Rojo, Blanco

### 5. 🎒 Accessories (Accesorios)
- **Palabras Clave**: BAG, POUCH, TOTE, BACKPACK, WALLET, PURSE
- **Variantes**: Según tipo de accesorio

## 🛠️ Configuración y Deployment

### Para Cloudflare Pages
1. Subir todos los archivos a la raíz del repositorio
2. Configurar build command: (ninguno necesario)
3. Configurar output directory: `/` (raíz)
4. Variables de entorno: (ninguna necesaria)

### Para GitHub Pages
1. Subir archivos al repositorio
2. Activar GitHub Pages en configuración
3. Seleccionar branch principal como source

### Configuración Local
```bash
# Clonar o descargar archivos
# Abrir index.html en navegador
# O usar servidor local
python -m http.server 8000
# Navegar a http://localhost:8000
```

## 📊 Características de Rendimiento

### Optimizaciones Implementadas
- **Lazy Loading**: Imágenes cargan bajo demanda
- **Debounced Search**: Búsqueda optimizada
- **Intersection Observer**: Animaciones eficientes
- **CSS Variables**: Mantenimiento optimizado
- **Modular JavaScript**: Carga bajo demanda

### Métricas Objetivo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🎨 Sistema de Diseño

### Colores Principales
- **Primario**: #FF8C42 (Naranja vibrante)
- **Primario Oscuro**: #E67A39
- **Fondo**: #000000 (Negro)
- **Fondo Secundario**: #1A1A1A (Gris oscuro)
- **Texto**: #FFFFFF (Blanco)
- **Texto Secundario**: #CCCCCC (Gris claro)

### Tipografía
- **Familia**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700, 800
- **Escalas**: Responsive typography con clamp()

### Espaciado
- **Sistema**: 8px base unit
- **Escala**: xs(8px), sm(12px), md(16px), lg(20px), xl(24px), 2xl(30px), 3xl(40px), 4xl(50px), 5xl(60px)

## 🔧 Mantenimiento y Extensión

### Añadir Nuevas Categorías
1. Editar `CATEGORY_CONFIG` en `js/products.js`
2. Añadir palabras clave para clasificación
3. Definir variantes específicas
4. Actualizar estilos si es necesario

### Modificar API
1. Editar `API_CONFIG` en `js/api.js`
2. Actualizar endpoints y parámetros
3. Ajustar normalización de datos si es necesario

### Personalizar Diseño
1. Modificar variables CSS en `css/core.css`
2. Actualizar componentes en `css/components.css`
3. Ajustar responsive en `css/responsive.css`

## 🐛 Resolución de Problemas

### Productos No Cargan
1. Verificar conectividad con API
2. Revisar consola del navegador para errores
3. Comprobar configuración de CORS si aplica

### Filtros No Funcionan
1. Verificar que productos estén cargados
2. Comprobar console para errores de JavaScript
3. Verificar estructura de datos de productos

### Problemas de Responsive
1. Verificar viewport meta tag
2. Probar en diferentes dispositivos
3. Revisar media queries en `css/responsive.css`

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: support@dress.com
- **Email General**: hello@dress.com

## 📄 Licencia

© 2025 Dress. Todos los derechos reservados.

---

**Desarrollado con ❤️ para expresar tu estilo único**