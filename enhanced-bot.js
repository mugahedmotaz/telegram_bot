const TelegramBot = require('node-telegram-bot-api');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// إعداد البوت المحسن
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// إعدادات متقدمة
const config = {
    downloadDir: process.env.DOWNLOAD_DIR || './downloads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50,
    maxPlaylistSize: parseInt(process.env.MAX_PLAYLIST_SIZE) || 10,
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT) || 300,
    defaultVideoQuality: process.env.DEFAULT_VIDEO_QUALITY || '720p',
    defaultAudioQuality: process.env.DEFAULT_AUDIO_QUALITY || 'best',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    autoCleanupMinutes: parseInt(process.env.AUTO_CLEANUP_MINUTES) || 60
};

// إنشاء مجلدات
fs.ensureDirSync(config.downloadDir);
fs.ensureDirSync('./logs');

// نظام التسجيل المحسن
class Logger {
    static log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        console.log(logMessage);
        
        if (config.verboseLogging) {
            const logFile = path.join('./logs', `bot-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, logMessage + '\n');
        }
    }
    
    static error(message) { this.log(message, 'ERROR'); }
    static warn(message) { this.log(message, 'WARN'); }
    static info(message) { this.log(message, 'INFO'); }
}

// رسائل البوت المحسنة
const messages = {
    welcome: `🎬 أهلاً وسهلاً في بوت تحميل اليوتيوب المتقدم!

✨ الميزات الجديدة:
📹 تحميل فيديوهات عالية الجودة
🎵 استخراج الصوت بجودة ممتازة
📋 دعم قوائم التشغيل الكاملة
⚡ سرعة تحميل محسنة
🔄 استئناف التحميل المتقطع
📊 معلومات تفصيلية عن الفيديو

🚀 الأوامر:
/start - بدء البوت
/help - دليل الاستخدام الكامل
/quality - خيارات الجودة
/stats - إحصائيات البوت
/settings - إعدادات شخصية

💡 نصيحة: أرسل رابط يوتيوب وسأتولى الباقي!`,

    help: `📖 دليل الاستخدام الشامل:

🔗 الروابط المدعومة:
• https://youtube.com/watch?v=...
• https://youtu.be/...
• https://youtube.com/playlist?list=...
• https://m.youtube.com/watch?v=...

📥 أنواع التحميل:
🎬 فيديو: MP4 بجودات مختلفة
🎵 صوت: MP3 عالي الجودة
📋 قائمة كاملة: جميع الفيديوهات

⚙️ خيارات الجودة:
📺 فيديو: 2160p, 1440p, 1080p, 720p, 480p, 360p
🔊 صوت: 320kbps, 256kbps, 128kbps

⚠️ القيود:
• حجم الملف: ${config.maxFileSize} ميجابايت
• قائمة التشغيل: ${config.maxPlaylistSize} فيديوهات
• مهلة التحميل: ${Math.floor(config.downloadTimeout/60)} دقائق

🎯 أمثلة:
1. أرسل رابط فيديو → اختر النوع → اختر الجودة
2. أرسل رابط قائمة → حدد عدد الفيديوهات → ابدأ التحميل`,

    processing: '🔄 جاري تحليل الرابط...',
    fetchingInfo: '📊 جاري جلب معلومات الفيديو...',
    downloadStarted: '⬇️ بدء التحميل...',
    uploadStarted: '⬆️ جاري رفع الملف...',
    completed: '✅ تم بنجاح!',
    error: '❌ حدث خطأ! يرجى المحاولة مرة أخرى.',
    invalidUrl: '❌ رابط غير صالح! يرجى إرسال رابط يوتيوب صحيح.',
    fileTooLarge: `📏 الملف كبير جداً! الحد الأقصى ${config.maxFileSize} ميجابايت`,
    playlistTooLarge: `📋 القائمة كبيرة جداً! الحد الأقصى ${config.maxPlaylistSize} فيديوهات`,
    downloadProgress: (current, total) => `📥 التقدم: ${current}/${total}`,
    processingVideo: (title) => `🎬 معالجة: ${title.substring(0, 50)}...`
};

// خيارات الجودة المحسنة
const qualityOptions = {
    video: {
        '2160p': '🔥 4K (2160p) - أعلى جودة',
        '1440p': '⭐ 2K (1440p) - جودة ممتازة',
        '1080p': '🎯 Full HD (1080p) - جودة عالية',
        '720p': '✨ HD (720p) - جودة جيدة',
        '480p': '📱 SD (480p) - جودة متوسطة',
        '360p': '💾 (360p) - أصغر حجم',
        'best': '🏆 أفضل جودة متاحة',
        'worst': '💿 أصغر حجم ممكن'
    },
    audio: {
        '320': '🎵 320kbps - جودة ممتازة',
        '256': '🎶 256kbps - جودة عالية',
        '128': '🎧 128kbps - جودة جيدة',
        'best': '🏆 أفضل جودة متاحة',
        'worst': '💿 أصغر حجم'
    }
};

// إحصائيات البوت
const stats = {
    totalDownloads: 0,
    totalUsers: new Set(),
    startTime: Date.now(),
    errors: 0,
    successfulDownloads: 0
};

// تخزين حالات المستخدمين
const userStates = new Map();
const userSettings = new Map();

// فئة معالج التحميل المحسن
class DownloadHandler {
    static async getVideoInfo(url) {
        return new Promise((resolve, reject) => {
            // استخدام yt-dlp المحلي
            const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
            const command = `"${ytdlpPath}" --dump-json --flat-playlist "${url}"`;
            
            exec(command, { 
                maxBuffer: 1024 * 1024 * 10,
                timeout: 30000 
            }, (error, stdout, stderr) => {
                if (error) {
                    Logger.error(`فشل في جلب معلومات الفيديو: ${error.message}`);
                    reject(error);
                    return;
                }
                
                try {
                    const lines = stdout.trim().split('\n').filter(line => line.trim());
                    const videos = lines.map(line => JSON.parse(line));
                    Logger.info(`تم جلب معلومات ${videos.length} فيديو`);
                    resolve(videos);
                } catch (parseError) {
                    Logger.error(`خطأ في تحليل JSON: ${parseError.message}`);
                    reject(parseError);
                }
            });
        });
    }
    
    static async downloadVideo(url, format, quality, outputPath, onProgress) {
        return new Promise((resolve, reject) => {
            let formatSelector;
            let outputTemplate;
            
            if (format === 'audio') {
                const audioBitrate = quality === 'best' ? 'bestaudio' : 
                                   quality === 'worst' ? 'worstaudio' :
                                   `bestaudio[abr<=${quality}]`;
                formatSelector = audioBitrate;
                outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
            } else {
                switch (quality) {
                    case 'best':
                        formatSelector = 'best[ext=mp4]';
                        break;
                    case 'worst':
                        formatSelector = 'worst[ext=mp4]';
                        break;
                    case '2160p':
                        formatSelector = 'best[height<=2160][ext=mp4]';
                        break;
                    case '1440p':
                        formatSelector = 'best[height<=1440][ext=mp4]';
                        break;
                    case '1080p':
                        formatSelector = 'best[height<=1080][ext=mp4]';
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
                outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
            }
            
            const args = [
                '-f', formatSelector,
                '--no-warnings',
                '--extract-flat', 'false',
                '-o', outputTemplate
            ];
            
            if (format === 'audio') {
                args.push('--extract-audio', '--audio-format', 'mp3');
            }
            
            args.push(url);
            
            Logger.info(`بدء التحميل: ${url}`);
            const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
            const ytdlp = spawn(ytdlpPath, args);
            
            let downloadedFile = null;
            
            ytdlp.stdout.on('data', (data) => {
                const output = data.toString();
                if (config.verboseLogging) {
                    Logger.info(`yt-dlp stdout: ${output.trim()}`);
                }
                
                // تتبع التقدم
                const progressMatch = output.match(/(\d+\.?\d*)%/);
                if (progressMatch && onProgress) {
                    onProgress(parseFloat(progressMatch[1]));
                }
            });
            
            ytdlp.stderr.on('data', (data) => {
                const error = data.toString();
                if (config.verboseLogging) {
                    Logger.warn(`yt-dlp stderr: ${error.trim()}`);
                }
            });
            
            ytdlp.on('close', (code) => {
                if (code === 0) {
                    // البحث عن الملف المحمل
                    try {
                        const files = fs.readdirSync(outputPath);
                        const latestFile = files
                            .map(file => ({
                                name: file,
                                path: path.join(outputPath, file),
                                time: fs.statSync(path.join(outputPath, file)).mtime
                            }))
                            .sort((a, b) => b.time - a.time)[0];
                        
                        if (latestFile) {
                            Logger.info(`تم التحميل بنجاح: ${latestFile.name}`);
                            resolve(latestFile.path);
                        } else {
                            reject(new Error('لم يتم العثور على الملف المحمل'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`فشل التحميل مع الكود: ${code}`));
                }
            });
            
            // مهلة زمنية للتحميل
            setTimeout(() => {
                ytdlp.kill();
                reject(new Error('انتهت مهلة التحميل'));
            }, config.downloadTimeout * 1000);
        });
    }
}

// التحقق من صحة الرابط
function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
        /^https?:\/\/(m\.)?youtube\.com\/watch\?v=.+/,
        /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=.+/,
        /^https?:\/\/youtu\.be\/.+/
    ];
    return patterns.some(pattern => pattern.test(url));
}

function getUrlType(url) {
    if (url.includes('playlist?list=')) return 'playlist';
    return 'video';
}

// إرسال لوحة مفاتيح
function sendInlineKeyboard(chatId, message, options, columns = 2) {
    const keys = Object.entries(options);
    const keyboard = [];
    
    for (let i = 0; i < keys.length; i += columns) {
        const row = keys.slice(i, i + columns).map(([key, value]) => ({
            text: value,
            callback_data: key
        }));
        keyboard.push(row);
    }
    
    bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: 'HTML'
    });
}

// معالجة الأوامر
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    stats.totalUsers.add(userId);
    Logger.info(`مستخدم جديد: ${userId}`);
    
    bot.sendMessage(chatId, messages.welcome, { parse_mode: 'HTML' });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, messages.help, { parse_mode: 'HTML' });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const statsMessage = `📊 إحصائيات البوت:

👥 إجمالي المستخدمين: ${stats.totalUsers.size}
📥 إجمالي التحميلات: ${stats.totalDownloads}
✅ التحميلات الناجحة: ${stats.successfulDownloads}
❌ الأخطاء: ${stats.errors}
⏰ وقت التشغيل: ${hours}س ${minutes}د
💾 استخدام الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

    bot.sendMessage(chatId, statsMessage);
});

bot.onText(/\/quality/, (msg) => {
    const chatId = msg.chat.id;
    
    let qualityInfo = `🎯 خيارات الجودة المتاحة:

📹 <b>للفيديو:</b>
`;
    
    Object.entries(qualityOptions.video).forEach(([key, value]) => {
        qualityInfo += `• ${value}\n`;
    });
    
    qualityInfo += `\n🎵 <b>للصوت:</b>
`;
    
    Object.entries(qualityOptions.audio).forEach(([key, value]) => {
        qualityInfo += `• ${value}\n`;
    });
    
    qualityInfo += `\n💡 <b>نصائح:</b>
• الجودة الأعلى = حجم أكبر
• للهواتف: استخدم 720p أو أقل
• للصوت: 128kbps كافي للاستماع العادي`;
    
    bot.sendMessage(chatId, qualityInfo, { parse_mode: 'HTML' });
});

// معالجة الروابط
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;
    
    if (!isValidYouTubeUrl(text)) {
        if (text.includes('youtube') || text.includes('youtu.be')) {
            bot.sendMessage(chatId, messages.invalidUrl);
        }
        return;
    }
    
    try {
        stats.totalUsers.add(userId);
        
        const processingMsg = await bot.sendMessage(chatId, messages.processing);
        
        // جلب معلومات الفيديو
        await bot.editMessageText(messages.fetchingInfo, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });
        
        const urlType = getUrlType(text);
        const videoInfo = await DownloadHandler.getVideoInfo(text);
        
        if (urlType === 'playlist' && videoInfo.length > config.maxPlaylistSize) {
            await bot.editMessageText(messages.playlistTooLarge, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
            return;
        }
        
        // حذف رسالة المعالجة
        await bot.deleteMessage(chatId, processingMsg.message_id);
        
        // حفظ حالة المستخدم
        userStates.set(chatId, {
            url: text,
            type: urlType,
            videoInfo: videoInfo,
            step: 'format'
        });
        
        // عرض معلومات الفيديو/القائمة
        let infoText = '';
        if (urlType === 'playlist') {
            infoText = `📋 <b>قائمة تشغيل</b>
📊 عدد الفيديوهات: ${videoInfo.length}
👤 القناة: ${videoInfo[0].uploader || 'غير محدد'}

`;
        } else {
            const video = videoInfo[0];
            const duration = video.duration ? 
                `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : 
                'غير محدد';
            
            infoText = `🎬 <b>${video.title}</b>
👤 القناة: ${video.uploader || 'غير محدد'}
⏱️ المدة: ${duration}
👀 المشاهدات: ${video.view_count ? video.view_count.toLocaleString() : 'غير محدد'}

`;
        }
        
        infoText += '🎯 اختر نوع التحميل:';
        
        const formatOptions = {
            'video': '📹 فيديو (MP4)',
            'audio': '🎵 صوت (MP3)'
        };
        
        sendInlineKeyboard(chatId, infoText, formatOptions);
        
    } catch (error) {
        Logger.error(`خطأ في معالجة الرابط: ${error.message}`);
        stats.errors++;
        bot.sendMessage(chatId, messages.error);
    }
});

// معالجة الأزرار
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const userState = userStates.get(chatId);
    
    if (!userState) {
        bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'انتهت الجلسة، يرجى إرسال الرابط مرة أخرى' 
        });
        return;
    }
    
    try {
        if (userState.step === 'format') {
            userState.format = data;
            userState.step = 'quality';
            
            const options = qualityOptions[data];
            const message = `🎯 اختر جودة ${data === 'video' ? 'الفيديو' : 'الصوت'}:`;
            
            await bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: Object.entries(options).map(([key, value]) => [
                        { text: value, callback_data: key }
                    ])
                }
            });
            
        } else if (userState.step === 'quality') {
            userState.quality = data;
            
            await bot.answerCallbackQuery(callbackQuery.id);
            await bot.deleteMessage(chatId, messageId);
            
            // بدء عملية التحميل
            await processDownload(chatId, userState);
        }
        
    } catch (error) {
        Logger.error(`خطأ في معالجة الزر: ${error.message}`);
        stats.errors++;
        bot.sendMessage(chatId, messages.error);
    }
});

// معالجة التحميل المحسنة
async function processDownload(chatId, userState) {
    const { url, format, quality, type, videoInfo } = userState;
    const userDir = path.join(config.downloadDir, `user_${chatId}`);
    
    try {
        fs.ensureDirSync(userDir);
        stats.totalDownloads++;
        
        if (type === 'playlist') {
            const statusMsg = await bot.sendMessage(chatId, messages.downloadStarted);
            
            for (let i = 0; i < videoInfo.length; i++) {
                const video = videoInfo[i];
                const videoUrl = video.webpage_url || video.url;
                
                // تحديث الحالة
                await bot.editMessageText(
                    `${messages.downloadProgress(i + 1, videoInfo.length)}\n${messages.processingVideo(video.title)}`,
                    {
                        chat_id: chatId,
                        message_id: statusMsg.message_id
                    }
                );
                
                try {
                    const filePath = await DownloadHandler.downloadVideo(
                        videoUrl, 
                        format, 
                        quality, 
                        userDir,
                        (progress) => {
                            // يمكن إضافة تحديث التقدم هنا
                        }
                    );
                    
                    const fileStats = fs.statSync(filePath);
                    const fileSizeMB = fileStats.size / (1024 * 1024);
                    
                    if (fileSizeMB > config.maxFileSize) {
                        await bot.sendMessage(chatId, `⚠️ ${video.title} - ${messages.fileTooLarge}`);
                        fs.removeSync(filePath);
                        continue;
                    }
                    
                    // رفع الملف
                    if (format === 'audio') {
                        await bot.sendAudio(chatId, filePath, {
                            title: video.title,
                            performer: video.uploader || 'Unknown',
                            caption: `🎵 ${video.title}`
                        });
                    } else {
                        await bot.sendVideo(chatId, filePath, {
                            caption: `🎬 ${video.title}`,
                            supports_streaming: true
                        });
                    }
                    
                    fs.removeSync(filePath);
                    stats.successfulDownloads++;
                    
                } catch (videoError) {
                    Logger.error(`فشل تحميل الفيديو ${video.title}: ${videoError.message}`);
                    await bot.sendMessage(chatId, `❌ فشل تحميل: ${video.title}`);
                }
            }
            
            await bot.editMessageText(
                `✅ تم تحميل قائمة التشغيل! (${videoInfo.length} فيديو)`,
                {
                    chat_id: chatId,
                    message_id: statusMsg.message_id
                }
            );
            
        } else {
            // تحميل فيديو واحد
            const statusMsg = await bot.sendMessage(chatId, messages.downloadStarted);
            
            const filePath = await DownloadHandler.downloadVideo(
                url, 
                format, 
                quality, 
                userDir,
                async (progress) => {
                    if (progress % 25 === 0) { // تحديث كل 25%
                        await bot.editMessageText(
                            `⬇️ التحميل: ${progress.toFixed(1)}%`,
                            {
                                chat_id: chatId,
                                message_id: statusMsg.message_id
                            }
                        );
                    }
                }
            );
            
            const fileStats = fs.statSync(filePath);
            const fileSizeMB = fileStats.size / (1024 * 1024);
            
            if (fileSizeMB > config.maxFileSize) {
                await bot.editMessageText(messages.fileTooLarge, {
                    chat_id: chatId,
                    message_id: statusMsg.message_id
                });
                fs.removeSync(filePath);
                return;
            }
            
            await bot.editMessageText(messages.uploadStarted, {
                chat_id: chatId,
                message_id: statusMsg.message_id
            });
            
            const video = videoInfo[0];
            if (format === 'audio') {
                await bot.sendAudio(chatId, filePath, {
                    title: video.title,
                    performer: video.uploader || 'Unknown',
                    caption: `🎵 ${video.title}`
                });
            } else {
                await bot.sendVideo(chatId, filePath, {
                    caption: `🎬 ${video.title}`,
                    supports_streaming: true
                });
            }
            
            fs.removeSync(filePath);
            stats.successfulDownloads++;
            
            await bot.editMessageText(messages.completed, {
                chat_id: chatId,
                message_id: statusMsg.message_id
            });
        }
        
    } catch (error) {
        Logger.error(`خطأ في التحميل: ${error.message}`);
        stats.errors++;
        bot.sendMessage(chatId, messages.error);
    } finally {
        userStates.delete(chatId);
        if (fs.existsSync(userDir)) {
            fs.removeSync(userDir);
        }
    }
}

// تنظيف دوري
setInterval(() => {
    const now = Date.now();
    const cleanupTime = config.autoCleanupMinutes * 60 * 1000;
    
    if (fs.existsSync(config.downloadDir)) {
        const userDirs = fs.readdirSync(config.downloadDir);
        userDirs.forEach(dir => {
            const dirPath = path.join(config.downloadDir, dir);
            const stats = fs.statSync(dirPath);
            
            if (now - stats.mtime.getTime() > cleanupTime) {
                fs.removeSync(dirPath);
                Logger.info(`تم حذف المجلد المؤقت: ${dir}`);
            }
        });
    }
}, 10 * 60 * 1000); // كل 10 دقائق

// معالجة الأخطاء
bot.on('polling_error', (error) => {
    Logger.error(`خطأ في البوت: ${error.message}`);
});

process.on('uncaughtException', (error) => {
    Logger.error(`خطأ غير معالج: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(`رفض غير معالج: ${reason}`);
});

Logger.info('🚀 بوت تحميل اليوتيوب المحسن يعمل الآن...');
Logger.info(`📊 الإعدادات: حجم الملف=${config.maxFileSize}MB, قائمة التشغيل=${config.maxPlaylistSize}`);
Logger.info('💡 تأكد من إضافة BOT_TOKEN في ملف .env');
