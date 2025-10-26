# 🧪 TEST RÁPIDO DE VERIFICACIÓN

## ⚡ Verificación en 30 segundos

### Paso 1: Despliegue
```bash
# En tu repositorio local:
git add .
git commit -m "Fix: Solucionar carga de productos Printful - Race condition resuelto"
git push origin main
```

### Paso 2: Verificación automática (espera 2 minutos)
- Ve a: https://dress-ac1.pages.dev
- Espera a que cargue la página

### Paso 3: Comprobación visual
**❌ ANTES (con error):**
```
Error cargando productos. Usando productos demo
```

**✅ DESPUÉS (corregido):**
```
Debe mostrar productos reales de Printful (nombres reales, no "Producto demo")
```

### Paso 4: Verificación técnica (opcional)
Abre la consola del navegador (F12) y ejecuta:

```javascript
// Test rápido en consola:
window.debugApi.testAll()
```

**Resultado esperado:**
```
✅ Worker health: OK
✅ API health: OK  
✅ Products loaded: OK
✅ Demo fallback: NOT USED
```

## 🚨 Si no funciona

### Ejecute diagnóstico completo:
```javascript
// Diagnóstico detallado:
window.debugApi.showNetworkRequests()
window.debugApi.checkWorkerHealth()
window.debugApi.checkApiHealth()
```

### Verificar archivo de muestra:
```javascript
// Verificar que las funciones estén disponibles:
console.log('loadProducts function:', typeof loadProducts);
console.log('checkWorkerHealth function:', typeof checkWorkerHealth);
console.log('checkApiHealth function:', typeof checkApiHealth);
```

**Debe mostrar:** `function` para las tres funciones.

---
**Tiempo estimado de implementación: 2-3 minutos**