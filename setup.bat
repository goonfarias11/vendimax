@echo off
echo ================================
echo   VENDIMAX - Inicializacion
echo ================================
echo.

echo [1/5] Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: PostgreSQL no esta corriendo
    echo    Inicia PostgreSQL e intenta nuevamente
    pause
    exit /b 1
)
echo ✅ PostgreSQL corriendo

echo.
echo [2/5] Instalando dependencias...
call npm install

echo.
echo [3/5] Generando Prisma Client...
call npm run db:generate

echo.
echo [4/5] Aplicando schema a la base de datos...
call npm run db:push

echo.
echo [5/5] Poblando base de datos con datos de prueba...
call npm run db:seed

echo.
echo ================================
echo   ✅ CONFIGURACION COMPLETA
echo ================================
echo.
echo Usuarios de prueba creados:
echo   - admin@vendimax.com (password: admin123)
echo   - vendedor@vendimax.com (password: vendedor123)
echo.
echo Para iniciar el servidor ejecuta:
echo   npm run dev
echo.
pause
