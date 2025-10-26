#!/bin/bash

# Script de implementación para la solución API Printful en Cloudflare Pages
# Uso: ./implementar-api.sh

echo "🚀 Implementando solución API Printful..."
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si estamos en un repositorio git
check_git_repo() {
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Error: No estamos en un repositorio Git${NC}"
        echo "Ejecuta este script desde la raíz de tu proyecto Git"
        exit 1
    fi
}

# Función para copiar archivos
copy_files() {
    echo -e "${BLUE}📁 Copiando archivos de configuración...${NC}"
    
    if [ -d "fix-page/functions" ]; then
        mkdir -p functions
        cp fix-page/functions/api/index.js functions/
        echo -e "${GREEN}✅ functions/api/index.js copiado${NC}"
    else
        echo -e "${RED}❌ No se encuentra fix-page/functions${NC}"
        exit 1
    fi
    
    if [ -f "fix-page/_routes.json" ]; then
        cp fix-page/_routes.json .
        echo -e "${GREEN}✅ _routes.json copiado${NC}"
    else
        echo -e "${RED}❌ No se encuentra fix-page/_routes.json${NC}"
        exit 1
    fi
    
    if [ -f "fix-page/_headers" ]; then
        cp fix-page/_headers .
        echo -e "${GREEN}✅ _headers copiado${NC}"
    else
        echo -e "${RED}❌ No se encuentra fix-page/_headers${NC}"
        exit 1
    fi
}

# Función para crear/actualizar wrangler.toml
setup_wrangler() {
    echo -e "${BLUE}⚙️ Configurando wrangler.toml...${NC}"
    
    if [ -f "fix-page/wrangler.toml.example" ]; then
        cp fix-page/wrangler.toml.example wrangler.toml
        echo -e "${GREEN}✅ wrangler.toml creado desde template${NC}"
        
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edita wrangler.toml y configura tu PRINTFUL_API_KEY${NC}"
        echo -e "Luego configura la variable en Cloudflare Dashboard > Settings > Functions > Environment Variables"
        
        # Preguntar si quiere abrir wrangler.toml para editar
        read -p "¿Quieres abrir wrangler.toml para editarlo ahora? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v code &> /dev/null; then
                code wrangler.toml
            elif command -v nano &> /dev/null; then
                nano wrangler.toml
            else
                echo "Abre manualmente wrangler.toml y edita la línea PRINTFUL_API_KEY"
            fi
        fi
    else
        echo -e "${RED}❌ No se encuentra wrangler.toml.example${NC}"
        exit 1
    fi
}

# Función para commit y push
commit_changes() {
    echo -e "${BLUE"📝 ¿Quieres hacer commit y push de los cambios? (y/n): "${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Haciendo commit...${NC}"
        git add _routes.json functions/api/index.js _headers wrangler.toml
        git commit -m "Fix: Configuración completa API Printful con CORS y routing

- Añadido _routes.json para routing correcto
- Implementada Cloudflare Pages Function con CORS
- Configurados headers HTTP personalizados
- Mapeador de datos Printful → Frontend incluido
- Soporte para /api/products y /api/hoodies
- Error handling y logging detallado"

        echo -e "${YELLOW}🔄 ¿Quieres hacer push? (y/n): ${NC}"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo -e "${GREEN}✅ Cambios enviados a GitHub${NC}"
        fi
    fi
}

# Función para mostrar próximos pasos
show_next_steps() {
    echo -e "${GREEN}🎉 ¡Implementación completada!${NC}"
    echo
    echo -e "${BLUE}📋 Próximos pasos:${NC}"
    echo "1. Configura PRINTFUL_API_KEY en Cloudflare Dashboard"
    echo "   → Ve a: Settings > Functions > Environment Variables"
    echo "   → Añade: Name=PRINTFUL_API_KEY, Value=[tu_api_key]"
    echo
    echo "2. Espera 1-2 minutos para el deployment automático"
    echo
    echo "3. Verifica en https://dress-ac1.pages.dev:"
    echo "   → Abre DevTools (F12) > Console"
    echo "   → Haz clic en 'Productos'"
    echo "   → Verifica que no hay errores y productos se muestran"
    echo
    echo -e "${YELLOW}🔍 Para probar la API directamente:${NC}"
    echo "curl https://dress-ac1.pages.dev/api/products"
    echo
    echo -e "${BLUE}📚 Documentación completa: fix-page/SOLUCION_COMPLETA_CLOUDFLARE_API.md${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Script de Implementación API Printful${NC}"
    echo "=========================================="
    echo
    
    # Verificar pre-requisitos
    check_git_repo
    copy_files
    setup_wrangler
    commit_changes
    show_next_steps
    
    echo
    echo -e "${GREEN}✨ ¡Listo! Los productos de Printful se mostrarán correctamente${NC}"
}

# Ejecutar script principal
main
