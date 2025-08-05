const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 إعداد بوت تحميل اليوتيوب...\n');

// التحقق من متطلبات النظام
async function checkRequirements() {
    console.log('📋 فحص المتطلبات...');
    
    return new Promise((resolve) => {
        // فحص Node.js
        exec('node --version', (error, stdout) => {
            if (error) {
                console.log('❌ Node.js غير مثبت');
                resolve(false);
                return;
            }
            console.log(`✅ Node.js: ${stdout.trim()}`);
            
            // فحص yt-dlp
            exec('yt-dlp --version', (error, stdout) => {
                if (error) {
                    console.log('❌ yt-dlp غير مثبت');
                    console.log('💡 لتثبيت yt-dlp:');
                    console.log('   pip install yt-dlp');
                    console.log('   أو: winget install yt-dlp');
                    resolve(false);
                    return;
                }
                console.log(`✅ yt-dlp: ${stdout.trim()}`);
                resolve(true);
            });
        });
    });
}

// إنشاء مجلدات المشروع
function createDirectories() {
    console.log('\n📁 إنشاء المجلدات...');
    
    const dirs = ['downloads', 'logs'];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ تم إنشاء مجلد: ${dir}`);
        } else {
            console.log(`📁 المجلد موجود: ${dir}`);
        }
    });
}

// إنشاء ملف .env إذا لم يكن موجوداً
function createEnvFile() {
    console.log('\n⚙️ إعداد ملف البيئة...');
    
    if (!fs.existsSync('.env')) {
        const envContent = `# إعدادات بوت التلجرام
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# مجلد التحميل
DOWNLOAD_DIR=./downloads

# الحد الأقصى لحجم الملف (بالميجابايت)
MAX_FILE_SIZE=50

# عدد الفيديوهات المسموح تحميلها في المرة الواحدة
MAX_PLAYLIST_SIZE=10`;

        fs.writeFileSync('.env', envContent);
        console.log('✅ تم إنشاء ملف .env');
        console.log('⚠️  يرجى تحديث BOT_TOKEN في ملف .env');
    } else {
        console.log('📄 ملف .env موجود');
    }
}

// إنشاء ملف تشغيل سريع
function createStartScript() {
    console.log('\n🔧 إنشاء سكريبت التشغيل...');
    
    const startScript = `@echo off
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

pause`;

    fs.writeFileSync('start.bat', startScript);
    console.log('✅ تم إنشاء ملف start.bat');
}

// إنشاء ملف معلومات البوت
function createBotInfo() {
    console.log('\n📝 إنشاء ملف معلومات البوت...');
    
    const botInfo = {
        name: "YouTube Downloader Bot",
        version: "1.0.0",
        description: "بوت تلجرام لتحميل فيديوهات وقوائم تشغيل اليوتيوب",
        features: [
            "تحميل فيديوهات مفردة",
            "تحميل قوائم تشغيل كاملة",
            "تحويل إلى صوت MP3",
            "خيارات جودة متعددة",
            "واجهة عربية كاملة",
            "أزرار تفاعلية",
            "حماية من الملفات الكبيرة"
        ],
        commands: {
            "/start": "بدء البوت وعرض الترحيب",
            "/help": "عرض تعليمات الاستخدام",
            "/quality": "معلومات عن خيارات الجودة"
        },
        supportedFormats: {
            video: ["MP4"],
            audio: ["MP3"]
        },
        qualityOptions: {
            video: ["best", "720p", "480p", "360p", "worst"],
            audio: ["best", "worst"]
        },
        limits: {
            maxFileSize: "50 MB",
            maxPlaylistSize: "10 videos"
        }
    };
    
    fs.writeFileSync('bot-info.json', JSON.stringify(botInfo, null, 2));
    console.log('✅ تم إنشاء ملف bot-info.json');
}

// الدالة الرئيسية
async function main() {
    console.log('=' .repeat(50));
    console.log('🤖 إعداد بوت تحميل اليوتيوب');
    console.log('=' .repeat(50));
    
    // فحص المتطلبات
    const requirementsMet = await checkRequirements();
    
    if (!requirementsMet) {
        console.log('\n❌ يرجى تثبيت المتطلبات المفقودة أولاً');
        return;
    }
    
    // إنشاء الملفات والمجلدات
    createDirectories();
    createEnvFile();
    createStartScript();
    createBotInfo();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ تم إعداد المشروع بنجاح!');
    console.log('=' .repeat(50));
    
    console.log('\n📋 الخطوات التالية:');
    console.log('1. احصل على توكن البوت من @BotFather');
    console.log('2. حدث BOT_TOKEN في ملف .env');
    console.log('3. شغل البوت بالأمر: npm start');
    console.log('   أو استخدم: start.bat');
    
    console.log('\n🔗 روابط مفيدة:');
    console.log('• BotFather: https://t.me/BotFather');
    console.log('• Node.js: https://nodejs.org');
    console.log('• yt-dlp: https://github.com/yt-dlp/yt-dlp');
    
    console.log('\n🎉 استمتع باستخدام البوت!');
}

// تشغيل الإعداد
main().catch(console.error);
