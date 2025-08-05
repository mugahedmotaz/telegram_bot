# 📍 دليل مسارات yt-dlp في النظام

## 🎯 المسارات المحتملة لـ yt-dlp:

### 📁 **مسارات Python Scripts:**
```
C:\Users\AKAM\AppData\Roaming\Python\Python311\Scripts\yt-dlp.exe
C:\Users\AKAM\AppData\Roaming\Python\Python312\Scripts\yt-dlp.exe
C:\Users\AKAM\AppData\Local\Programs\Python\Python311\Scripts\yt-dlp.exe
C:\Users\AKAM\AppData\Local\Programs\Python\Python312\Scripts\yt-dlp.exe
```

### 🗂️ **مسارات النظام العامة:**
```
C:\Python311\Scripts\yt-dlp.exe
C:\Python312\Scripts\yt-dlp.exe
C:\Program Files\Python311\Scripts\yt-dlp.exe
C:\Program Files (x86)\Python311\Scripts\yt-dlp.exe
```

### 📦 **مسارات winget/scoop:**
```
C:\Users\AKAM\AppData\Local\Microsoft\WinGet\Packages\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\yt-dlp.exe
C:\Users\AKAM\scoop\apps\yt-dlp\current\yt-dlp.exe
```

## 🔍 **كيفية العثور على المسار الدقيق:**

### الطريقة 1: البحث اليدوي
1. افتح File Explorer
2. انتقل إلى: `C:\Users\AKAM\AppData\Roaming\Python`
3. ابحث عن مجلد يبدأ بـ `Python3`
4. ادخل إلى `Scripts`
5. ابحث عن `yt-dlp.exe`

### الطريقة 2: استخدام البحث
1. اضغط `Win + S`
2. ابحث عن: `yt-dlp.exe`
3. انقر بالزر الأيمن → "Open file location"

### الطريقة 3: Command Prompt
```cmd
where yt-dlp
```
أو
```cmd
for /r C:\ %i in (yt-dlp.exe) do @echo %i
```

## 📥 **تثبيت yt-dlp في المسار الصحيح:**

### إذا لم يكن مثبتاً:

#### الطريقة 1: pip (الأسهل)
```cmd
pip install yt-dlp
```

#### الطريقة 2: pip مع تحديد المسار
```cmd
python -m pip install --user yt-dlp
```

#### الطريقة 3: winget
```cmd
winget install yt-dlp
```

#### الطريقة 4: تحميل مباشر
1. اذهب إلى: https://github.com/yt-dlp/yt-dlp/releases
2. حمل `yt-dlp.exe`
3. ضعه في أحد هذه المسارات:
   - `C:\Users\AKAM\AppData\Roaming\Python\Scripts\`
   - `C:\Windows\System32\` (يحتاج صلاحيات مدير)
   - مجلد البوت نفسه

## ⚙️ **إضافة المسار إلى PATH:**

### إذا كان yt-dlp مثبت لكن لا يعمل:

1. **افتح System Properties:**
   - اضغط `Win + R`
   - اكتب `sysdm.cpl`
   - اضغط Enter

2. **انتقل إلى Environment Variables:**
   - انقر "Advanced" tab
   - انقر "Environment Variables"

3. **أضف المسار:**
   - في "User variables" أو "System variables"
   - ابحث عن "Path"
   - انقر "Edit"
   - انقر "New"
   - أضف المسار مثل: `C:\Users\AKAM\AppData\Roaming\Python\Scripts`

## 🧪 **اختبار التثبيت:**

```cmd
yt-dlp --version
```

إذا ظهر رقم الإصدار، فالتثبيت نجح! ✅

## 🚀 **حل سريع - وضع yt-dlp في مجلد البوت:**

إذا واجهت مشاكل، يمكنك:

1. **تحميل yt-dlp.exe** من: https://github.com/yt-dlp/yt-dlp/releases
2. **وضعه في مجلد البوت:** `C:\Users\AKAM\OneDrive\Desktop\Download playlist\`
3. **تحديث البوت** لاستخدام المسار المحلي

## 📝 **ملاحظات مهمة:**

- **Python 3.11+** موصى به
- **تأكد من إضافة Python إلى PATH** أثناء التثبيت
- **أعد تشغيل Command Prompt** بعد التثبيت
- **استخدم PowerShell كمدير** إذا لزم الأمر

## 🆘 **إذا لم تعمل أي طريقة:**

1. **ثبت Python جديد** من python.org
2. **تأكد من تفعيل "Add to PATH"**
3. **أعد تشغيل الكمبيوتر**
4. **جرب:** `python -m pip install yt-dlp`

---

**💡 نصيحة:** الطريقة الأسهل هي `pip install yt-dlp` من Command Prompt
