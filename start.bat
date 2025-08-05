@echo off
echo 🤖 تشغيل بوت تحميل اليوتيوب...
echo.

REM التحقق من وجود Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت
    echo يرجى تثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

REM التحقق من وجود yt-dlp
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ yt-dlp غير مثبت
    echo لتثبيت yt-dlp:
    echo   pip install yt-dlp
    echo   أو: winget install yt-dlp
    pause
    exit /b 1
)

REM التحقق من BOT_TOKEN
findstr /C:"BOT_TOKEN=YOUR_BOT_TOKEN_HERE" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  يرجى تحديث BOT_TOKEN في ملف .env
    echo.
    echo للحصول على توكن البوت:
    echo 1. ابحث عن @BotFather في تلجرام
    echo 2. أرسل /newbot
    echo 3. اتبع التعليمات
    echo 4. احفظ التوكن في ملف .env
    echo.
    pause
    exit /b 1
)

echo ✅ جميع المتطلبات متوفرة
echo 🚀 بدء تشغيل البوت...
echo.

node bot.js

pause