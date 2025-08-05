# استخدام Node.js 18 كقاعدة
FROM node:18-slim

# تثبيت المتطلبات الأساسية
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# تثبيت yt-dlp
RUN pip3 install yt-dlp

# إنشاء مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت المكتبات
RUN npm ci --only=production

# نسخ باقي الملفات
COPY . .

# إنشاء مجلد التحميل
RUN mkdir -p downloads logs

# تعيين المنفذ
EXPOSE 3000

# تشغيل البوت
CMD ["node", "enhanced-bot.js"]
