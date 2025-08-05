@echo off
title Test YouTube Telegram Bot
color 0A

echo ========================================
echo    🤖 اختبار بوت تحميل اليوتيوب
echo ========================================
echo.

echo [1/3] التحقق من yt-dlp...
if exist "yt-dlp.exe" (
    echo ✅ yt-dlp.exe موجود
    yt-dlp.exe --version
    if %errorlevel% neq 0 (
        echo ❌ yt-dlp لا يعمل بشكل صحيح
        pause
        exit /b 1
    )
    echo ✅ yt-dlp يعمل بشكل صحيح
) else (
    echo ❌ yt-dlp.exe غير موجود
    echo يرجى تشغيل download-ytdlp.ps1 أولاً
    pause
    exit /b 1
)

echo.
echo [2/3] التحقق من متغيرات البيئة...
if exist ".env" (
    findstr /C:"BOT_TOKEN=YOUR_BOT_TOKEN_HERE" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️  يرجى تحديث BOT_TOKEN في ملف .env
        echo    احصل على التوكن من @BotFather في تلجرام
        pause
        exit /b 1
    ) else (
        echo ✅ BOT_TOKEN محدث في .env
    )
) else (
    echo ❌ ملف .env غير موجود
    echo يرجى نسخ .env.example إلى .env وتحديث BOT_TOKEN
    pause
    exit /b 1
)

echo.
echo [3/3] التحقق من المكتبات...
if exist "node_modules" (
    echo ✅ المكتبات مثبتة
) else (
    echo ⚠️  المكتبات غير مثبتة، جاري التثبيت...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت المكتبات
        pause
        exit /b 1
    )
    echo ✅ تم تثبيت المكتبات
)

echo.
echo ========================================
echo ✅ جميع الفحوصات نجحت!
echo ========================================
echo.

echo اختر نوع التشغيل:
echo [1] البوت العادي (bot.js)
echo [2] البوت المحسن (enhanced-bot.js)  
echo [3] بوت الإنتاج (production-bot.js)
echo [4] إلغاء
echo.

set /p choice="اختر رقم (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🚀 تشغيل البوت العادي...
    node bot.js
) else if "%choice%"=="2" (
    echo.
    echo 🚀 تشغيل البوت المحسن...
    node enhanced-bot.js
) else if "%choice%"=="3" (
    echo.
    echo 🚀 تشغيل بوت الإنتاج...
    node production-bot.js
) else if "%choice%"=="4" (
    echo تم الإلغاء
) else (
    echo اختيار غير صحيح
)

echo.
pause
