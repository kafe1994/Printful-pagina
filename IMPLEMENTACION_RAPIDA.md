# ⚡ IMPLEMENTACIÓN RÁPIDA - API Printful Cloudflare

## 🎯 Problema Solucionado

✅ **Routing API**: Configurado para `/api/products` y `/api/hoodies`
✅ **CORS Headers**: Headers correctos para acceso cross-origin
✅ **Mapeo de Datos**: Transformación automática Printful → Frontend
✅ **Variables de Entorno**: Configuración PRINTFUL_API_KEY

## 🚀 Implementación en 3 Pasos

### 1️⃣ Copiar Archivos
```bash
# Desde la carpeta fix-page/ a tu repositorio
cp fix-page/functions/api/index.js functions/
cp fix-page/_routes.json .
cp fix-page/_headers .
cp fix-page/wrangler.toml.example wrangler.toml
```

### 2️⃣ Configurar API Key
**Cloudflare Dashboard**:
1. Ve a tu proyecto `dress-ac1`
2. Settings → Functions → Environment Variables
3. Añadir:
   - Name: `PRINTFUL_API_KEY`
   - Value: [tu API key de Printful]
   - Environment: Production

### 3️⃣ Deploy
```bash
git add _routes.json functions/api/index.js _headers wrangler.toml
git commit -m "Fix: API Printful completa con CORS"
git push origin main
```

## 🔍 Verificación

**En https://dress-ac1.pages.dev**:
1. Abre DevTools (F12) → Console
2. Haz clic en "Productos"
3. ✅ Sin errores CORS
4. ✅ Productos con imagen real
5. ✅ Descripción generada
6. ✅ Categorías detectadas

## 📡 APIs Disponibles

- `GET /api/products` → Todos los productos Printful
- `GET /api/hoodies` → Solo hoodies/sudaderas
- `OPTIONS /api/*` → CORS preflight

## 🛠️ Script Automático

Para implementación automática:
```bash
# Hacer ejecutable
chmod +x fix-page/implementar-api.sh

# Ejecutar
./fix-page/implementar-api.sh
```

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `functions/api/index.js` | Cloudflare Pages Function con CORS |
| `_routes.json` | Configuración routing API |
| `_headers` | Headers HTTP personalizados |
| `wrangler.toml` | Configuración variables entorno |

## ⚠️ Importante

1. **PRINTFUL_API_KEY** debe configurarse manualmente en Cloudflare Dashboard
2. El deployment toma 1-2 minutos
3. Los productos deben mostrarse con imagen real de Printful

---

**🎉 Después de implementar: https://dress-ac1.pages.dev mostrará productos Printful correctamente**
