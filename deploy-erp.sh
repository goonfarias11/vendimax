#!/bin/bash

echo "🚀 VendiMax - Deployment Script ERP Profesional"
echo "================================================"
echo ""

echo "📦 1. Instalando dependencias..."
npm install

echo ""
echo "🗄️ 2. Generando migración de Prisma..."
npx prisma migrate dev --name erp_professional_features

echo ""
echo "⚙️ 3. Generando cliente de Prisma..."
npx prisma generate

echo ""
echo "✅ 4. Verificando instalación..."
echo ""

# Verificar que los archivos existen
if [ -f "lib/afip/client.ts" ]; then
  echo "  ✓ Módulo AFIP instalado"
else
  echo "  ✗ Módulo AFIP no encontrado"
fi

if [ -f "lib/promotions.ts" ]; then
  echo "  ✓ Sistema de promociones instalado"
else
  echo "  ✗ Sistema de promociones no encontrado"
fi

if [ -f "lib/export/excel.ts" ]; then
  echo "  ✓ Módulo de exportación instalado"
else
  echo "  ✗ Módulo de exportación no encontrado"
fi

if [ -f "lib/webhooks.ts" ]; then
  echo "  ✓ Sistema de webhooks instalado"
else
  echo "  ✗ Sistema de webhooks no encontrado"
fi

echo ""
echo "📝 5. Variables de entorno requeridas:"
echo ""
echo "  AFIP_CUIT=20123456789"
echo "  AFIP_CERT=path/to/cert.pem (o contenido del certificado)"
echo "  AFIP_KEY=path/to/key.key (o contenido de la clave)"
echo "  AFIP_PRODUCTION=false (true para producción)"
echo ""
echo "  Asegúrate de configurar estas variables en Vercel o .env.local"
echo ""

echo "🎉 ¡Instalación completada!"
echo ""
echo "📚 Próximos pasos:"
echo "  1. Configurar variables de entorno AFIP"
echo "  2. npm run dev - Para desarrollo local"
echo "  3. git push - Para deployar a Vercel"
echo ""
echo "📖 Documentación completa en: MEJORAS_ERP_COMPLETADO.md"
