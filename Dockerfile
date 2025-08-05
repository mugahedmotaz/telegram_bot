# استخدام Node.js 18 كقاعدة
FROM node:18-slim

# تثبيت المتطلبات الأساسية
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    ffmpeg \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# إنشاء virtual environment وتثبيت yt-dlp
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install yt-dlp

# إنشاء symlink لـ yt-dlp
RUN ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp

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
