// Cloudflare Pages Function para API de productos con CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// Manejar todas las rutas de API con CORS
export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  
  console.log(`📡 API Request: ${request.method} ${url.pathname}`);
  
  try {
    // CORS headers para todas las respuestas
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json; charset=utf-8",
    };

    // Ruta de productos
    if (url.pathname === "/api/products" || url.pathname.endsWith("/products")) {
      console.log("🔄 Llamando a Printful API...");
      
      const printfulResponse = await fetch("https://api.printful.com/products", {
        headers: {
          "Authorization": `Bearer ${context.env.PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!printfulResponse.ok) {
        throw new Error(`Printful API error: ${printfulResponse.status}`);
      }

      const printfulData = await printfulResponse.json();
      console.log("✅ Datos de Printful recibidos:", printfulData);
      
      // Mapear datos de Printful al formato esperado por el frontend
      const mappedProducts = (printfulData.result || []).map(product => {
        console.log(`🔧 Mapeando producto: ${product.name}`);
        
        // Generar descripción basada en el nombre
        const description = generateProductDescription(product.name);
        const category = detectProductCategory(product.name);
        
        return {
          // Propiedades básicas de Printful
          id: product.id,
          name: product.name,
          variants: product.variants || 0,
          synced: product.synced || 0,
          thumbnail_url: product.thumbnail_url,
          external_id: product.external_id,
          is_ignored: product.is_ignored,
          
          // Propiedades mapeadas para el frontend
          type_name: product.name,
          description: description,
          title: product.name,
          image: product.thumbnail_url,
          category: category
        };
      });

      console.log("🎉 Productos mapeados:", mappedProducts);

      return new Response(JSON.stringify({
        success: true,
        data: mappedProducts,
        count: mappedProducts.length,
        timestamp: new Date().toISOString()
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // Ruta hoodies específica (si existe)
    if (url.pathname === "/api/hoodies" || url.pathname.endsWith("/hoodies")) {
      console.log("🔄 Buscando productos hoodies...");
      
      const printfulResponse = await fetch("https://api.printful.com/products", {
        headers: {
          "Authorization": `Bearer ${context.env.PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!printfulResponse.ok) {
        throw new Error(`Printful API error: ${printfulResponse.status}`);
      }

      const printfulData = await printfulResponse.json();
      
      // Filtrar solo hoodies
      const hoodies = (printfulData.result || []).filter(product => 
        product.name.toLowerCase().includes("hoodie") || 
        product.name.toLowerCase().includes("sudadera")
      );

      const mappedHoodies = hoodies.map(product => ({
        id: product.id,
        name: product.name,
        variants: product.variants || 0,
        synced: product.synced || 0,
        thumbnail_url: product.thumbnail_url,
        external_id: product.external_id,
        is_ignored: product.is_ignored,
        type_name: product.name,
        description: generateProductDescription(product.name),
        title: product.name,
        image: product.thumbnail_url,
        category: "Hoodies"
      }));

      return new Response(JSON.stringify({
        success: true,
        data: mappedHoodies,
        count: mappedHoodies.length,
        timestamp: new Date().toISOString()
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

    // Ruta no encontrada
    return new Response(JSON.stringify({
      success: false,
      error: "Endpoint no encontrado",
      path: url.pathname,
      availableEndpoints: ["/api/products", "/api/hoodies"]
    }), {
      headers: corsHeaders,
      status: 404,
    });

  } catch (error) {
    console.error("❌ Error en API:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
};

// Funciones auxiliares para el mapeo de datos
function generateProductDescription(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('t-shirt') || name.includes('tshirt')) {
    return "Camiseta de alta calidad con diseño único y disponible en múltiples colores. Perfecta para el uso diario.";
  } else if (name.includes('hoodie') || name.includes('sudadera')) {
    return "Sudadera cómoda y elegante, ideal para cualquier ocasión. Material premium y diseño moderno.";
  } else if (name.includes('mug') || name.includes('taza')) {
    return "Taza de cerámica de alta calidad, perfecta para bebidas calientes. Diseño resistente y atractivo.";
  } else if (name.includes('cap') || name.includes('gorra') || name.includes('hat')) {
    return "Gorra ajustable con diseño único. Fabricada con materiales de alta calidad para máxima comodidad.";
  } else if (name.includes('poster') || name.includes('póster')) {
    return "Póster de alta resolución con diseño artístico. Impreso en papel de calidad premium.";
  } else {
    return "Producto personalizado de alta calidad con diseño único. Perfecto para expresar tu estilo.";
  }
}

function detectProductCategory(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('t-shirt') || name.includes('tshirt')) {
    return "Ropa";
  } else if (name.includes('hoodie') || name.includes('sudadera')) {
    return "Ropa";
  } else if (name.includes('mug') || name.includes('taza')) {
    return "Hogar";
  } else if (name.includes('cap') || name.includes('gorra') || name.includes('hat')) {
    return "Accesorios";
  } else if (name.includes('poster') || name.includes('póster')) {
    return "Arte";
  } else {
    return "General";
  }
}
