@echo off
echo ========================================
echo VendiMax - Deployment Script ERP Profesional
echo ========================================
echo.

echo [1/5] Instalando dependencias...
call npm install

echo.
echo [2/5] Generando migracion de Prisma...
call npx prisma migrate dev --name erp_professional_features

echo.
echo [3/5] Generando cliente de Prisma...
call npx prisma generate

echo.
echo [4/5] Verificando instalacion...
echo.

if exist "lib\afip\client.ts" (
  echo   [OK] Modulo AFIP instalado
) else (
  echo   [X] Modulo AFIP no encontrado
)

if exist "lib\promotions.ts" (
  echo   [OK] Sistema de promociones instalado
) else (
  echo   [X] Sistema de promociones no encontrado
)

if exist "lib\export\excel.ts" (
  echo   [OK] Modulo de exportacion instalado
) else (
  echo   [X] Modulo de exportacion no encontrado
)

if exist "lib\webhooks.ts" (
  echo   [OK] Sistema de webhooks instalado
) else (
  echo   [X] Sistema de webhooks no encontrado
)

echo.
echo [5/5] Variables de entorno requeridas:
echo.
echo   AFIP_CUIT=20123456789
echo   AFIP_CERT=path/to/cert.pem (o contenido del certificado)
echo   AFIP_KEY=path/to/key.key (o contenido de la clave)
echo   AFIP_PRODUCTION=false (true para produccion)
echo.
echo   Asegurate de configurar estas variables en Vercel o .env.local
echo.

echo ========================================
echo Instalacion completada!
echo ========================================
echo.
echo Proximos pasos:
echo   1. Configurar variables de entorno AFIP
echo   2. npm run dev - Para desarrollo local
echo   3. git push - Para deployar a Vercel
echo.
echo Documentacion completa en: MEJORAS_ERP_COMPLETADO.md
echo.
pause
