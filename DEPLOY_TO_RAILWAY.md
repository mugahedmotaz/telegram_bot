# 🚂 رفع البوت إلى Railway - حل مشكلة yt-dlp

## 🔧 **حل مشكلة Python Environment:**

المشكلة التي واجهتها:
```
error: externally-managed-environment
× This environment is externally managed
```

## ✅ **الحل المطبق:**

### 1. **Dockerfile محسن للـ Railway:**
تم إنشاء `Dockerfile.railway` مع:
- استخدام `python3-venv` لإنشاء بيئة معزولة
- تثبيت yt-dlp داخل virtual environment
- استخدام `--break-system-packages` كحل أخير آمن
- إنشاء symlink لـ yt-dlp

### 2. **ملف railway.json:**
إعدادات خاصة بـ Railway لضمان الاستقرار

## 🚀 **خطوات الرفع إلى Railway:**

### الخطوة 1: تحضير المشروع
1. **تأكد من وجود الملفات:**
   ```
   ✅ Dockerfile.railway
   ✅ railway.json  
   ✅ production-bot.js
   ✅ package.json (محدث)
   ```

2. **إعادة تسمية Dockerfile:**
   ```bash
   # في مجلد المشروع، أعد تسمية:
   mv Dockerfile.railway Dockerfile
   ```

### الخطوة 2: رفع إلى GitHub
1. **إنشاء repository جديد في GitHub**
2. **رفع جميع الملفات عدا:**
   - `node_modules/`
   - `.env` (يحتوي على أسرار)
   - `downloads/`
   - `logs/`

### الخطوة 3: ربط مع Railway
1. **اذهب إلى:** https://railway.app
2. **سجل دخول بـ GitHub**
3. **انقر "New Project"**
4. **اختر "Deploy from GitHub repo"**
5. **اختر repository البوت**

### الخطوة 4: إعداد متغيرات البيئة
في Railway Dashboard، أضف:

```env
BOT_TOKEN=التوكن_من_BotFather
NODE_ENV=production
PORT=3000
DOWNLOAD_DIR=./downloads
MAX_FILE_SIZE=50
MAX_PLAYLIST_SIZE=5
DOWNLOAD_TIMEOUT=300
VERBOSE_LOGGING=true
AUTO_CLEANUP_MINUTES=30
```

### الخطوة 5: Deploy
1. **انقر "Deploy"**
2. **انتظر البناء (5-10 دقائق)**
3. **ستحصل على رابط مثل:** `https://your-project.up.railway.app`

## 🔍 **التحقق من نجاح الرفع:**

### 1. فحص البناء:
في Railway Dashboard، تحقق من:
- ✅ Build successful
- ✅ Deploy successful  
- ✅ Service running

### 2. فحص الصحة:
```bash
curl https://your-project.up.railway.app/health
```
يجب أن ترى:
```json
{
  "status": "OK",
  "uptime": 123,
  "bot_running": true
}
```

### 3. اختبار البوت:
- ابحث عن البوت في تلجرام
- أرسل `/start`
- جرب تحميل فيديو قصير

## 🛠️ **حل المشاكل الشائعة:**

### مشكلة: Build يفشل مع yt-dlp
**الحل:** تأكد من استخدام `Dockerfile.railway` المحدث

### مشكلة: البوت لا يرد
**الحل:** 
1. تحقق من BOT_TOKEN في متغيرات البيئة
2. راجع Logs في Railway Dashboard
3. تأكد من أن PORT=3000

### مشكلة: yt-dlp لا يعمل
**الحل:** 
```bash
# في Railway Console، اختبر:
yt-dlp --version
```

### مشكلة: نفاد الذاكرة
**الحل:** قلل القيم في متغيرات البيئة:
```env
MAX_FILE_SIZE=25
MAX_PLAYLIST_SIZE=3
AUTO_CLEANUP_MINUTES=15
```

## 📊 **مراقبة الأداء:**

### في Railway Dashboard:
- **CPU Usage**: يجب أن يكون < 80%
- **Memory Usage**: يجب أن يكون < 90%  
- **Network**: راقب الاستخدام

### Logs مهمة:
```bash
# ابحث عن هذه الرسائل:
✅ "بوت تحميل اليوتيوب (الإنتاج) يعمل الآن"
✅ "Health check server running on port 3000"
❌ أي رسائل خطأ
```

## 🎯 **نصائح للاستخدام الأمثل:**

### 1. مراقبة الاستخدام:
- Railway يعطي 500 ساعة مجاناً شهرياً
- راقب الاستخدام في Dashboard
- فعل التنظيف التلقائي

### 2. تحسين الأداء:
```env
# للاستخدام المكثف:
MAX_FILE_SIZE=30
MAX_PLAYLIST_SIZE=3
AUTO_CLEANUP_MINUTES=10
```

### 3. Keep-Alive:
Railway لا ينام مثل Render، لكن يمكنك إضافة مراقبة:
- استخدم UptimeRobot للمراقبة
- URL: `https://your-project.up.railway.app/health`

## 🔄 **التحديثات:**

### لتحديث البوت:
1. عدل الكود محلياً
2. ارفع التغييرات إلى GitHub  
3. Railway سيحدث تلقائياً!

### إعادة Deploy يدوياً:
1. في Railway Dashboard
2. انقر "Redeploy"
3. انتظر البناء الجديد

## 🎉 **البوت يعمل الآن على Railway!**

### المميزات:
- ✅ يعمل 24/7 بدون نوم
- ✅ أداء ممتاز  
- ✅ تحديثات تلقائية
- ✅ مراقبة متقدمة
- ✅ دعم كامل لـ yt-dlp

---

**🚂 مبروك! بوتك يعمل الآن على Railway بدون مشاكل!**
