# 🛠️ دليل التثبيت الشامل

## 📋 المتطلبات الأساسية

### 1. Node.js
```bash
# تحميل من الموقع الرسمي
https://nodejs.org/

# أو باستخدام Chocolatey على Windows
choco install nodejs

# أو باستخدام Winget
winget install OpenJS.NodeJS
```

### 2. yt-dlp
```bash
# الطريقة الأولى: pip
pip install yt-dlp

# الطريقة الثانية: Winget (Windows)
winget install yt-dlp

# الطريقة الثالثة: Scoop (Windows)
scoop install yt-dlp

# الطريقة الرابعة: تحميل مباشر
# من: https://github.com/yt-dlp/yt-dlp/releases
```

### 3. Python (اختياري - لـ yt-dlp)
```bash
# إذا لم يعمل yt-dlp، قم بتثبيت Python
https://python.org/downloads/

# أو باستخدام Winget
winget install Python.Python.3.11
```

## 🚀 خطوات التثبيت

### الخطوة 1: تحضير المشروع
```bash
# انتقل لمجلد المشروع
cd "c:\Users\AKAM\OneDrive\Desktop\Download playlist"

# تثبيت المكتبات
npm install
```

### الخطوة 2: إعداد البوت في تلجرام

#### إنشاء البوت:
1. افتح تلجرام وابحث عن: `@BotFather`
2. أرسل الأمر: `/newbot`
3. اختر اسم للبوت (مثل: My YouTube Downloader)
4. اختر username للبوت (مثل: my_youtube_dl_bot)
5. احفظ التوكن المعطى (مثل: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)

#### تخصيص البوت (اختياري):
```
/setdescription - وصف البوت
/setabouttext - معلومات عن البوت
/setuserpic - صورة البوت
/setcommands - قائمة الأوامر
```

### الخطوة 3: تحديث الإعدادات
```bash
# افتح ملف .env
notepad .env

# أو استخدم أي محرر نصوص
code .env
```

```env
# استبدل YOUR_BOT_TOKEN_HERE بالتوكن الحقيقي
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# باقي الإعدادات (اختيارية)
DOWNLOAD_DIR=./downloads
MAX_FILE_SIZE=50
MAX_PLAYLIST_SIZE=10
```

### الخطوة 4: اختبار التثبيت
```bash
# تشغيل سكريبت الفحص
node setup.js

# أو تشغيل البوت مباشرة
npm start

# أو استخدام الملف المساعد
start.bat
```

## 🔧 استكشاف الأخطاء

### مشكلة: Node.js غير موجود
```bash
# تحقق من التثبيت
node --version
npm --version

# إعادة تثبيت Node.js
# حمل من: https://nodejs.org/
```

### مشكلة: yt-dlp غير موجود
```bash
# تحقق من التثبيت
yt-dlp --version

# إعادة التثبيت
pip install --upgrade yt-dlp

# أو على Windows
winget install yt-dlp
```

### مشكلة: البوت لا يرد
```bash
# تحقق من التوكن
echo %BOT_TOKEN%

# اختبر التوكن
curl "https://api.telegram.org/bot%BOT_TOKEN%/getMe"

# تحقق من الاتصال بالإنترنت
ping api.telegram.org
```

### مشكلة: خطأ في المكتبات
```bash
# حذف وإعادة تثبيت المكتبات
rmdir /s node_modules
del package-lock.json
npm install

# أو تثبيت مع إصلاح الأخطاء
npm audit fix
```

### مشكلة: فشل التحميل
```bash
# تحديث yt-dlp
pip install --upgrade yt-dlp

# اختبار التحميل المباشر
yt-dlp "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# تحقق من المساحة المتاحة
dir c:
```

## ⚙️ الإعدادات المتقدمة

### تخصيص الإعدادات:
```env
# ملف .env - الإعدادات المتقدمة

# مجلد التحميل
DOWNLOAD_DIR=./downloads

# الحد الأقصى لحجم الملف (ميجابايت)
MAX_FILE_SIZE=50

# عدد فيديوهات قائمة التشغيل
MAX_PLAYLIST_SIZE=10

# مهلة التحميل (ثواني)
DOWNLOAD_TIMEOUT=300

# الجودة الافتراضية
DEFAULT_VIDEO_QUALITY=720p
DEFAULT_AUDIO_QUALITY=best

# تفعيل السجلات التفصيلية
VERBOSE_LOGGING=true

# التنظيف التلقائي (دقائق)
AUTO_CLEANUP_MINUTES=60
```

### إعداد الأوامر في البوت:
```
start - بدء البوت
help - دليل الاستخدام
quality - خيارات الجودة
stats - إحصائيات البوت
settings - الإعدادات الشخصية
```

## 🔐 الأمان والخصوصية

### حماية التوكن:
- لا تشارك التوكن مع أحد
- لا تضع التوكن في الكود المصدري
- استخدم ملف .env دائماً
- أضف .env إلى .gitignore

### حدود الاستخدام:
- تلجرام يحدد 50MB للملف الواحد
- yt-dlp قد يحتاج وقت للفيديوهات الطويلة
- استخدم حدود معقولة لتجنب الحظر

## 📱 اختبار البوت

### 1. الاختبار الأساسي:
```
1. ابحث عن البوت في تلجرام
2. أرسل /start
3. يجب أن ترى رسالة الترحيب
```

### 2. اختبار التحميل:
```
1. أرسل رابط فيديو قصير
2. اختر نوع التحميل
3. اختر الجودة
4. انتظر التحميل
```

### 3. اختبار قائمة التشغيل:
```
1. أرسل رابط قائمة تشغيل صغيرة (2-3 فيديوهات)
2. اختر الإعدادات
3. راقب التقدم
```

## 🎉 البوت جاهز!

إذا نجحت جميع الخطوات، فالبوت يعمل الآن!

### الخطوات التالية:
- شارك البوت مع الأصدقاء
- راقب الأداء والاستخدام
- حدث الإعدادات حسب الحاجة
- استمتع بتحميل الفيديوهات!

---

**مشاكل؟** راجع قسم استكشاف الأخطاء أو أنشئ Issue جديد.
