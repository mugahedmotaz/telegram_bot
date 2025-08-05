const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// إعداد البوت
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// إعدادات التحميل
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || './downloads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 50; // MB
const MAX_PLAYLIST_SIZE = parseInt(process.env.MAX_PLAYLIST_SIZE) || 10;

// إنشاء مجلد التحميل
fs.ensureDirSync(DOWNLOAD_DIR);

// رسائل البوت
const messages = {
    welcome: `🎬 مرحباً بك في بوت تحميل اليوتيوب!

📹 يمكنني تحميل:
• فيديوهات مفردة من اليوتيوب
• قوائم تشغيل كاملة
• تحويل إلى صوت MP3

📝 الأوامر المتاحة:
/start - بدء البوت
/help - المساعدة
/quality - اختيار جودة التحميل

🔗 فقط أرسل لي رابط اليوتيوب وسأقوم بتحميله لك!`,

    help: `📖 كيفية استخدام البوت:

1️⃣ أرسل رابط فيديو يوتيوب:
https://www.youtube.com/watch?v=VIDEO_ID

2️⃣ أرسل رابط قائمة تشغيل:
https://www.youtube.com/playlist?list=PLAYLIST_ID

3️⃣ اختر نوع التحميل:
• 📹 فيديو (MP4)
• 🎵 صوت (MP3)

4️⃣ اختر الجودة المطلوبة

⚠️ ملاحظات مهمة:
• الحد الأقصى لحجم الملف: ${MAX_FILE_SIZE} ميجابايت
• الحد الأقصى لقائمة التشغيل: ${MAX_PLAYLIST_SIZE} فيديوهات`,

    invalidUrl: '❌ الرابط غير صحيح! يرجى إرسال رابط يوتيوب صالح.',
    processing: '⏳ جاري المعالجة... يرجى الانتظار',
    downloadStarted: '📥 بدء التحميل...',
    uploadStarted: '📤 جاري رفع الملف...',
    fileTooLarge: `❌ حجم الملف كبير جداً! الحد الأقصى ${MAX_FILE_SIZE} ميجابايت`,
    playlistTooLarge: `❌ قائمة التشغيل كبيرة جداً! الحد الأقصى ${MAX_PLAYLIST_SIZE} فيديوهات`,
    error: '❌ حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.',
    completed: '✅ تم التحميل بنجاح!'
};

// خيارات الجودة
const qualityOptions = {
    video: {
        'best': 'أفضل جودة متاحة',
        'worst': 'أقل جودة (أصغر حجم)',
        '720p': 'جودة عالية (720p)',
        '480p': 'جودة متوسطة (480p)',
        '360p': 'جودة منخفضة (360p)'
    },
    audio: {
        'best': 'أفضل جودة صوت',
        'worst': 'أقل جودة صوت'
    }
};

// تخزين حالة المستخدمين
const userStates = new Map();

// التحقق من صحة رابط اليوتيوب
function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,
        /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=.+/,
        /^https?:\/\/youtu\.be\/.+/
    ];
    return patterns.some(pattern => pattern.test(url));
}

// التحقق من نوع الرابط
function getUrlType(url) {
    if (url.includes('playlist?list=')) {
        return 'playlist';
    }
    return 'video';
}

// الحصول على معلومات الفيديو/القائمة
function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
        const command = `"${ytdlpPath}" --dump-json "${url}"`;
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            
            try {
                const lines = stdout.trim().split('\n');
                const videos = lines.map(line => JSON.parse(line));
                resolve(videos);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

// تحميل فيديو
function downloadVideo(url, format, quality, outputPath) {
    return new Promise((resolve, reject) => {
        let formatSelector;
        
        if (format === 'audio') {
            formatSelector = quality === 'best' ? 'bestaudio' : 'worstaudio';
        } else {
            switch (quality) {
                case 'best':
                    formatSelector = 'best[ext=mp4]';
                    break;
                case 'worst':
                    formatSelector = 'worst[ext=mp4]';
                    break;
                case '720p':
                    formatSelector = 'best[height<=720][ext=mp4]';
                    break;
                case '480p':
                    formatSelector = 'best[height<=480][ext=mp4]';
                    break;
                case '360p':
                    formatSelector = 'best[height<=360][ext=mp4]';
                    break;
                default:
                    formatSelector = 'best[ext=mp4]';
            }
        }

        const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
        const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
        let command;
        
        if (format === 'audio') {
            command = `"${ytdlpPath}" -f "${formatSelector}" --extract-audio --audio-format mp3 -o "${outputTemplate}" "${url}"`;
        } else {
            command = `"${ytdlpPath}" -f "${formatSelector}" -o "${outputTemplate}" "${url}"`;
        }

        exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            
            // البحث عن الملف المحمل
            const downloadedFiles = fs.readdirSync(outputPath);
            const latestFile = downloadedFiles
                .map(file => ({
                    name: file,
                    path: path.join(outputPath, file),
                    time: fs.statSync(path.join(outputPath, file)).mtime
                }))
                .sort((a, b) => b.time - a.time)[0];
            
            if (latestFile) {
                resolve(latestFile.path);
            } else {
                reject(new Error('لم يتم العثور على الملف المحمل'));
            }
        });
    });
}

// إرسال لوحة مفاتيح للاختيار
function sendChoiceKeyboard(chatId, message, options) {
    const keyboard = {
        inline_keyboard: Object.entries(options).map(([key, value]) => [
            { text: value, callback_data: key }
        ])
    };
    
    bot.sendMessage(chatId, message, { reply_markup: keyboard });
}

// معالجة أمر البداية
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, messages.welcome);
});

// معالجة أمر المساعدة
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, messages.help);
});

// معالجة الروابط
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // تجاهل الأوامر
    if (text && text.startsWith('/')) {
        return;
    }
    
    // التحقق من صحة الرابط
    if (!text || !isValidYouTubeUrl(text)) {
        if (text && text.includes('youtube') || text && text.includes('youtu.be')) {
            bot.sendMessage(chatId, messages.invalidUrl);
        }
        return;
    }
    
    try {
        bot.sendMessage(chatId, messages.processing);
        
        const urlType = getUrlType(text);
        const videoInfo = await getVideoInfo(text);
        
        // التحقق من حجم قائمة التشغيل
        if (urlType === 'playlist' && videoInfo.length > MAX_PLAYLIST_SIZE) {
            bot.sendMessage(chatId, messages.playlistTooLarge);
            return;
        }
        
        // حفظ معلومات المستخدم
        userStates.set(chatId, {
            url: text,
            type: urlType,
            videoInfo: videoInfo,
            step: 'format'
        });
        
        // اختيار نوع التحميل
        const formatOptions = {
            'video': '📹 فيديو (MP4)',
            'audio': '🎵 صوت (MP3)'
        };
        
        let infoText = '';
        if (urlType === 'playlist') {
            infoText = `📋 قائمة تشغيل: ${videoInfo.length} فيديو\n\n`;
        } else {
            const video = videoInfo[0];
            infoText = `📹 ${video.title}\n⏱️ المدة: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}\n\n`;
        }
        
        sendChoiceKeyboard(chatId, infoText + 'اختر نوع التحميل:', formatOptions);
        
    } catch (error) {
        console.error('خطأ في معالجة الرابط:', error);
        bot.sendMessage(chatId, messages.error);
    }
});

// معالجة الأزرار
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const userState = userStates.get(chatId);
    
    if (!userState) {
        bot.answerCallbackQuery(callbackQuery.id, { text: 'انتهت الجلسة، يرجى إرسال الرابط مرة أخرى' });
        return;
    }
    
    try {
        if (userState.step === 'format') {
            // حفظ نوع التحميل
            userState.format = data;
            userState.step = 'quality';
            
            // اختيار الجودة
            const options = qualityOptions[data];
            sendChoiceKeyboard(chatId, 'اختر الجودة:', options);
            
        } else if (userState.step === 'quality') {
            // بدء التحميل
            userState.quality = data;
            
            bot.answerCallbackQuery(callbackQuery.id);
            bot.sendMessage(chatId, messages.downloadStarted);
            
            await processDownload(chatId, userState);
        }
        
    } catch (error) {
        console.error('خطأ في معالجة الزر:', error);
        bot.sendMessage(chatId, messages.error);
    }
});

// معالجة التحميل
async function processDownload(chatId, userState) {
    const { url, format, quality, type, videoInfo } = userState;
    const userDir = path.join(DOWNLOAD_DIR, `user_${chatId}`);
    
    try {
        // إنشاء مجلد المستخدم
        fs.ensureDirSync(userDir);
        
        if (type === 'playlist') {
            // تحميل قائمة التشغيل
            for (let i = 0; i < videoInfo.length; i++) {
                const video = videoInfo[i];
                const videoUrl = video.webpage_url;
                
                bot.sendMessage(chatId, `📥 تحميل ${i + 1}/${videoInfo.length}: ${video.title}`);
                
                const filePath = await downloadVideo(videoUrl, format, quality, userDir);
                const fileStats = fs.statSync(filePath);
                const fileSizeMB = fileStats.size / (1024 * 1024);
                
                if (fileSizeMB > MAX_FILE_SIZE) {
                    bot.sendMessage(chatId, `⚠️ ${video.title} - ${messages.fileTooLarge}`);
                    fs.removeSync(filePath);
                    continue;
                }
                
                // رفع الملف
                bot.sendMessage(chatId, messages.uploadStarted);
                
                if (format === 'audio') {
                    await bot.sendAudio(chatId, filePath, {
                        title: video.title,
                        performer: video.uploader || 'Unknown'
                    });
                } else {
                    await bot.sendVideo(chatId, filePath, {
                        caption: video.title
                    });
                }
                
                // حذف الملف بعد الإرسال
                fs.removeSync(filePath);
            }
            
            bot.sendMessage(chatId, `✅ تم تحميل قائمة التشغيل بنجاح! (${videoInfo.length} فيديو)`);
            
        } else {
            // تحميل فيديو واحد
            const filePath = await downloadVideo(url, format, quality, userDir);
            const fileStats = fs.statSync(filePath);
            const fileSizeMB = fileStats.size / (1024 * 1024);
            
            if (fileSizeMB > MAX_FILE_SIZE) {
                bot.sendMessage(chatId, messages.fileTooLarge);
                fs.removeSync(filePath);
                return;
            }
            
            // رفع الملف
            bot.sendMessage(chatId, messages.uploadStarted);
            
            const video = videoInfo[0];
            if (format === 'audio') {
                await bot.sendAudio(chatId, filePath, {
                    title: video.title,
                    performer: video.uploader || 'Unknown'
                });
            } else {
                await bot.sendVideo(chatId, filePath, {
                    caption: video.title
                });
            }
            
            // حذف الملف بعد الإرسال
            fs.removeSync(filePath);
            bot.sendMessage(chatId, messages.completed);
        }
        
    } catch (error) {
        console.error('خطأ في التحميل:', error);
        bot.sendMessage(chatId, messages.error);
    } finally {
        // تنظيف حالة المستخدم
        userStates.delete(chatId);
        
        // تنظيف مجلد المستخدم
        if (fs.existsSync(userDir)) {
            fs.removeSync(userDir);
        }
    }
}

// معالجة الأخطاء
bot.on('polling_error', (error) => {
    console.error('خطأ في البوت:', error);
});

console.log('🤖 بوت تحميل اليوتيوب يعمل الآن...');
console.log('📝 تأكد من إضافة BOT_TOKEN في ملف .env');
