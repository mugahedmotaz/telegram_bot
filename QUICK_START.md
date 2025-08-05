# 🚀 دليل البدء السريع

## الخطوات الأساسية

### 1. تثبيت المتطلبات
```bash
# تثبيت المكتبات
npm install
```

✅ **yt-dlp.exe موجود بالفعل في مجلد المشروع!**

> لا تحتاج لتثبيت yt-dlp منفصلاً، فهو موجود كملف تنفيذي في المشروع

### 2. إعداد البوت

#### الحصول على توكن البوت:
1. ابحث عن `@BotFather` في تلجرام
2. أرسل `/newbot`
3. اختر اسم للبوت (مثل: My YouTube Bot)
4. اختر username للبوت (مثل: my_youtube_bot)
5. احفظ التوكن المعطى

#### تحديث ملف الإعدادات:
```bash
# افتح ملف .env وحدث:
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. تشغيل البوت

#### الطريقة الأولى - التشغيل المباشر:
```bash
npm start
```

#### الطريقة الثانية - استخدام المدير:
```bash
node bot-manager.js start
```

#### الطريقة الثالثة - Windows:
```bash
# انقر مرتين على ملف
start.bat
```

## 🎯 اختبار البوت

### 1. ابحث عن البوت في تلجرام
- استخدم الـ username الذي اخترته

### 2. ابدأ المحادثة
- أرسل `/start`
- يجب أن ترى رسالة الترحيب

### 3. جرب تحميل فيديو
- أرسل رابط فيديو يوتيوب
- اختر نوع التحميل (فيديو/صوت)
- اختر الجودة
- انتظر التحميل

## 🔧 استكشاف الأخطاء السريع

### البوت لا يرد؟
```bash
# تحقق من التوكن
echo $BOT_TOKEN

# تحقق من الاتصال
curl https://api.telegram.org/bot$BOT_TOKEN/getMe
```

### خطأ في التحميل؟
```bash
# تحقق من yt-dlp
yt-dlp --version

# جرب تحميل مباشر
yt-dlp "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### مشاكل الذاكرة؟
```bash
# قلل حجم الملف المسموح في .env
MAX_FILE_SIZE=25

# قلل عدد فيديوهات القائمة
MAX_PLAYLIST_SIZE=5
```

## 📱 أمثلة للاستخدام

### روابط مدعومة:
```
# فيديو واحد
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ

# قائمة تشغيل
https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxx
```

### أوامر البوت:
```
/start - بدء البوت
/help - المساعدة
```

## ⚡ نصائح للأداء

### 1. تحسين الإعدادات:
```env
# للاستخدام الشخصي
MAX_FILE_SIZE=50
MAX_PLAYLIST_SIZE=10

# للاستخدام المكثف
MAX_FILE_SIZE=25
MAX_PLAYLIST_SIZE=5
```

### 2. مراقبة الأداء:
```bash
# حالة البوت
node bot-manager.js status

# إحصائيات
node bot-manager.js stats

# تنظيف
node bot-manager.js cleanup
```

### 3. صيانة دورية:
```bash
# إعادة تشغيل يومية
node bot-manager.js restart

# تحديث yt-dlp أسبوعياً
pip install --upgrade yt-dlp
```

## 🎉 البوت جاهز!

إذا وصلت لهنا بنجاح، فالبوت يعمل الآن! 🎊

### الخطوات التالية:
1. شارك البوت مع الأصدقاء
2. اضبط الإعدادات حسب احتياجك
3. راقب الأداء والاستخدام
4. استمتع بتحميل الفيديوهات!

---

**مشاكل؟** راجع الـ [README.md](README.md) للتفاصيل الكاملة.
