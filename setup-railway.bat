@echo off
title Setup for Railway Deployment
color 0B

echo ========================================
echo    🚂 إعداد المشروع لـ Railway
echo ========================================
echo.

echo [1/4] نسخ Dockerfile المناسب...
if exist "Dockerfile.railway" (
    copy "Dockerfile.railway" "Dockerfile" >nul
    echo ✅ تم نسخ Dockerfile.railway إلى Dockerfile
) else (
    echo ❌ ملف Dockerfile.railway غير موجود
    pause
    exit /b 1
)

echo.
echo [2/4] التحقق من الملفات المطلوبة...

set missing_files=0

if not exist "production-bot.js" (
    echo ❌ production-bot.js غير موجود
    set missing_files=1
)

if not exist "package.json" (
    echo ❌ package.json غير موجود  
    set missing_files=1
)

if not exist "railway.json" (
    echo ❌ railway.json غير موجود
    set missing_files=1
)

if %missing_files%==1 (
    echo.
    echo ❌ ملفات مطلوبة مفقودة!
    pause
    exit /b 1
)

echo ✅ جميع الملفات المطلوبة موجودة

echo.
echo [3/4] إنشاء ملف .gitignore...
(
echo node_modules/
echo .env
echo downloads/
echo logs/
echo *.log
echo .DS_Store
echo Thumbs.db
echo npm-debug.log*
echo .nyc_output
echo coverage/
echo .coverage
echo yt-dlp.exe
) > .gitignore
echo ✅ تم إنشاء .gitignore

echo.
echo [4/4] التحقق من BOT_TOKEN...
if exist ".env" (
    findstr /C:"BOT_TOKEN=YOUR_BOT_TOKEN_HERE" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️  تذكر: ستحتاج لإضافة BOT_TOKEN في Railway Dashboard
        echo    لا ترفع ملف .env إلى GitHub!
    ) else (
        echo ✅ BOT_TOKEN محدث في .env
        echo ⚠️  تذكر: أضف BOT_TOKEN في Railway Dashboard أيضاً
    )
) else (
    echo ⚠️  ملف .env غير موجود
    echo    ستحتاج لإضافة BOT_TOKEN في Railway Dashboard
)

echo.
echo ========================================
echo ✅ المشروع جاهز للرفع إلى Railway!
echo ========================================
echo.

echo 📋 الخطوات التالية:
echo.
echo 1. ارفع المشروع إلى GitHub:
echo    - أنشئ repository جديد
echo    - ارفع جميع الملفات (عدا node_modules و .env)
echo.
echo 2. في Railway:
echo    - اذهب إلى railway.app
echo    - سجل دخول بـ GitHub
echo    - انقر "New Project"
echo    - اختر repository البوت
echo.
echo 3. أضف متغيرات البيئة في Railway:
echo    BOT_TOKEN=التوكن_من_BotFather
echo    NODE_ENV=production
echo    PORT=3000
echo.
echo 4. انقر Deploy وانتظر!
echo.

echo 📚 للمزيد من التفاصيل، راجع:
echo    DEPLOY_TO_RAILWAY.md
echo.

echo 🎉 حظاً موفقاً!
echo.
pause
