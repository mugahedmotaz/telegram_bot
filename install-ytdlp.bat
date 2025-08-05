@echo off
title تثبيت yt-dlp
color 0B

echo ========================================
echo    📥 تثبيت yt-dlp
echo ========================================
echo.

echo جاري فحص الطرق المتاحة لتثبيت yt-dlp...
echo.

REM الطريقة 1: pip
echo [1] محاولة التثبيت باستخدام pip...
python -m pip --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ pip متوفر، جاري التثبيت...
    python -m pip install yt-dlp
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت yt-dlp بنجاح باستخدام pip!
        goto :test_installation
    ) else (
        echo ❌ فشل التثبيت باستخدام pip
    )
) else (
    echo ⚠️  pip غير متوفر
)

echo.

REM الطريقة 2: winget
echo [2] محاولة التثبيت باستخدام winget...
winget --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ winget متوفر، جاري التثبيت...
    winget install yt-dlp
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت yt-dlp بنجاح باستخدام winget!
        goto :test_installation
    ) else (
        echo ❌ فشل التثبيت باستخدام winget
    )
) else (
    echo ⚠️  winget غير متوفر
)

echo.

REM الطريقة 3: scoop
echo [3] محاولة التثبيت باستخدام scoop...
scoop --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ scoop متوفر، جاري التثبيت...
    scoop install yt-dlp
    if %errorlevel% equ 0 (
        echo ✅ تم تثبيت yt-dlp بنجاح باستخدام scoop!
        goto :test_installation
    ) else (
        echo ❌ فشل التثبيت باستخدام scoop
    )
) else (
    echo ⚠️  scoop غير متوفر
)

echo.

REM الطريقة 4: تحميل مباشر
echo [4] التحميل المباشر...
echo ⚠️  لم تنجح الطرق التلقائية، يرجى التثبيت اليدوي:
echo.
echo 📥 خيارات التثبيت اليدوي:
echo.
echo 1. تثبيت Python أولاً:
echo    https://python.org/downloads/
echo    ثم تشغيل: pip install yt-dlp
echo.
echo 2. تحميل yt-dlp مباشرة:
echo    https://github.com/yt-dlp/yt-dlp/releases
echo    وضع الملف في مجلد النظام
echo.
echo 3. تثبيت Chocolatey ثم:
echo    choco install yt-dlp
echo.
echo 4. تثبيت Scoop ثم:
echo    scoop install yt-dlp
echo.
goto :end

:test_installation
echo.
echo ========================================
echo 🧪 اختبار التثبيت...
echo ========================================
echo.

yt-dlp --version
if %errorlevel% equ 0 (
    echo.
    echo ✅ تم تثبيت yt-dlp بنجاح!
    echo ✅ البوت جاهز للعمل الآن!
    echo.
    echo 🚀 لتشغيل البوت:
    echo    1. حدث BOT_TOKEN في ملف .env
    echo    2. شغل: start.bat
    echo    أو: npm start
) else (
    echo ❌ فشل في تثبيت yt-dlp
    echo يرجى المحاولة اليدوياً
)

:end
echo.
echo ========================================
pause
