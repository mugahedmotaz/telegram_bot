const TelegramBot = require('node-telegram-bot-api');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

// إعداد Express للـ health check
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot_running: bot ? true : false
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'YouTube Telegram Bot is running!',
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
});

// إعداد البوت
const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('❌ BOT_TOKEN غير موجود في متغيرات البيئة');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// إعدادات الإنتاج
const config = {
    downloadDir: process.env.DOWNLOAD_DIR || './downloads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50,
    maxPlaylistSize: parseInt(process.env.MAX_PLAYLIST_SIZE) || 5, // أقل للإنتاج
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT) || 300,
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    autoCleanupMinutes: parseInt(process.env.AUTO_CLEANUP_MINUTES) || 30, // تنظيف أسرع
    isProduction: process.env.NODE_ENV === 'production'
};

// إنشاء مجلدات
fs.ensureDirSync(config.downloadDir);
fs.ensureDirSync('./logs');

// نظام التسجيل المحسن للإنتاج
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

// رسائل البوت
const messages = {
    welcome: `🎬 مرحباً بك في بوت تحميل اليوتيوب!

📹 يمكنني تحميل:
• فيديوهات مفردة من اليوتيوب
• قوائم تشغيل (حتى ${config.maxPlaylistSize} فيديوهات)
• تحويل إلى صوت MP3

🔗 فقط أرسل لي رابط اليوتيوب!

⚠️ حدود الخدمة:
• حجم الملف: ${config.maxFileSize} ميجابايت
• قائمة التشغيل: ${config.maxPlaylistSize} فيديوهات`,

    processing: '🔄 جاري المعالجة...',
    downloadStarted: '📥 بدء التحميل...',
    uploadStarted: '📤 جاري رفع الملف...',
    completed: '✅ تم بنجاح!',
    error: '❌ حدث خطأ! يرجى المحاولة مرة أخرى.',
    invalidUrl: '❌ رابط غير صالح! يرجى إرسال رابط يوتيوب صحيح.',
    fileTooLarge: `📏 الملف كبير جداً! الحد الأقصى ${config.maxFileSize} ميجابايت`,
    playlistTooLarge: `📋 القائمة كبيرة جداً! الحد الأقصى ${config.maxPlaylistSize} فيديوهات`,
    serverBusy: '⏳ الخادم مشغول، يرجى المحاولة بعد قليل'
};

// خيارات الجودة (محدودة للإنتاج)
const qualityOptions = {
    video: {
        '720p': '🎯 HD (720p)',
        '480p': '📱 SD (480p)',
        '360p': '💾 (360p) - أصغر حجم',
        'worst': '💿 أصغر حجم ممكن'
    },
    audio: {
        '128': '🎧 128kbps - جودة جيدة',
        'worst': '💿 أصغر حجم'
    }
};

// إحصائيات البوت
const stats = {
    totalDownloads: 0,
    totalUsers: new Set(),
    startTime: Date.now(),
    errors: 0,
    successfulDownloads: 0,
    activeDownloads: 0
};

// تخزين حالات المستخدمين
const userStates = new Map();

// حد أقصى للتحميلات المتزامنة
const MAX_CONCURRENT_DOWNLOADS = 3;

// فئة معالج التحميل المحسن للإنتاج
class DownloadHandler {
    static async getVideoInfo(url) {
        return new Promise((resolve, reject) => {
            // تحديد مسار yt-dlp حسب البيئة
            const isWindows = process.platform === 'win32';
            const ytdlpPath = isWindows ? path.join(__dirname, 'yt-dlp.exe') : 'yt-dlp';
            const command = `"${ytdlpPath}" --dump-json --flat-playlist "${url}"`;
            
            exec(command, { 
                maxBuffer: 1024 * 1024 * 5, // أقل للإنتاج
                timeout: 20000 // مهلة أقل
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
    
    static async downloadVideo(url, format, quality, outputPath) {
        return new Promise((resolve, reject) => {
            if (stats.activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
                reject(new Error('الخادم مشغول، يرجى المحاولة لاحقاً'));
                return;
            }
            
            stats.activeDownloads++;
            
            let formatSelector;
            let outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
            
            if (format === 'audio') {
                formatSelector = quality === '128' ? 'bestaudio[abr<=128]' : 'worstaudio';
            } else {
                switch (quality) {
                    case '720p':
                        formatSelector = 'best[height<=720][ext=mp4]';
                        break;
                    case '480p':
                        formatSelector = 'best[height<=480][ext=mp4]';
                        break;
                    case '360p':
                        formatSelector = 'best[height<=360][ext=mp4]';
                        break;
                    case 'worst':
                        formatSelector = 'worst[ext=mp4]';
                        break;
                    default:
                        formatSelector = 'best[height<=720][ext=mp4]';
                }
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
            
            // تحديد مسار yt-dlp حسب البيئة
            const isWindows = process.platform === 'win32';
            const ytdlpPath = isWindows ? path.join(__dirname, 'yt-dlp.exe') : 'yt-dlp';
            const ytdlp = spawn(ytdlpPath, args);
            
            ytdlp.stdout.on('data', (data) => {
                if (config.verboseLogging) {
                    Logger.info(`yt-dlp: ${data.toString().trim()}`);
                }
            });
            
            ytdlp.stderr.on('data', (data) => {
                Logger.warn(`yt-dlp warning: ${data.toString().trim()}`);
            });
            
            ytdlp.on('close', (code) => {
                stats.activeDownloads--;
                
                if (code === 0) {
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
            
            // مهلة زمنية أقل للإنتاج
            setTimeout(() => {
                ytdlp.kill();
                stats.activeDownloads--;
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
function sendInlineKeyboard(chatId, message, options) {
    const keyboard = Object.entries(options).map(([key, value]) => [
        { text: value, callback_data: key }
    ]);
    
    bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard }
    });
}

// معالجة الأوامر
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    stats.totalUsers.add(userId);
    Logger.info(`مستخدم جديد: ${userId}`);
    
    bot.sendMessage(chatId, messages.welcome);
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const statsMessage = `📊 إحصائيات البوت:

👥 المستخدمين: ${stats.totalUsers.size}
📥 التحميلات: ${stats.totalDownloads}
✅ الناجحة: ${stats.successfulDownloads}
❌ الأخطاء: ${stats.errors}
🔄 النشطة: ${stats.activeDownloads}
⏰ وقت التشغيل: ${hours}س ${minutes}د
💾 الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

    bot.sendMessage(chatId, statsMessage);
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
    
    // فحص الحمولة
    if (stats.activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
        bot.sendMessage(chatId, messages.serverBusy);
        return;
    }
    
    try {
        stats.totalUsers.add(userId);
        stats.totalDownloads++;
        
        const processingMsg = await bot.sendMessage(chatId, messages.processing);
        
        const urlType = getUrlType(text);
        const videoInfo = await DownloadHandler.getVideoInfo(text);
        
        if (urlType === 'playlist' && videoInfo.length > config.maxPlaylistSize) {
            await bot.editMessageText(messages.playlistTooLarge, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
            return;
        }
        
        await bot.deleteMessage(chatId, processingMsg.message_id);
        
        userStates.set(chatId, {
            url: text,
            type: urlType,
            videoInfo: videoInfo,
            step: 'format'
        });
        
        let infoText = '';
        if (urlType === 'playlist') {
            infoText = `📋 قائمة تشغيل: ${videoInfo.length} فيديو\n\n`;
        } else {
            const video = videoInfo[0];
            infoText = `🎬 ${video.title}\n👤 ${video.uploader || 'غير محدد'}\n\n`;
        }
        
        infoText += 'اختر نوع التحميل:';
        
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
            const message = `اختر جودة ${data === 'video' ? 'الفيديو' : 'الصوت'}:`;
            
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
            
            await processDownload(chatId, userState);
        }
        
    } catch (error) {
        Logger.error(`خطأ في معالجة الزر: ${error.message}`);
        stats.errors++;
        bot.sendMessage(chatId, messages.error);
    }
});

// معالجة التحميل
async function processDownload(chatId, userState) {
    const { url, format, quality, type, videoInfo } = userState;
    const userDir = path.join(config.downloadDir, `user_${chatId}`);
    
    try {
        fs.ensureDirSync(userDir);
        
        if (type === 'playlist') {
            const statusMsg = await bot.sendMessage(chatId, messages.downloadStarted);
            
            for (let i = 0; i < Math.min(videoInfo.length, config.maxPlaylistSize); i++) {
                const video = videoInfo[i];
                const videoUrl = video.webpage_url || video.url;
                
                await bot.editMessageText(
                    `📥 ${i + 1}/${videoInfo.length}: ${video.title.substring(0, 30)}...`,
                    {
                        chat_id: chatId,
                        message_id: statusMsg.message_id
                    }
                );
                
                try {
                    const filePath = await DownloadHandler.downloadVideo(videoUrl, format, quality, userDir);
                    
                    const fileStats = fs.statSync(filePath);
                    const fileSizeMB = fileStats.size / (1024 * 1024);
                    
                    if (fileSizeMB > config.maxFileSize) {
                        await bot.sendMessage(chatId, `⚠️ ${video.title} - كبير جداً`);
                        fs.removeSync(filePath);
                        continue;
                    }
                    
                    if (format === 'audio') {
                        await bot.sendAudio(chatId, filePath, {
                            title: video.title,
                            caption: `🎵 ${video.title}`
                        });
                    } else {
                        await bot.sendVideo(chatId, filePath, {
                            caption: `🎬 ${video.title}`
                        });
                    }
                    
                    fs.removeSync(filePath);
                    stats.successfulDownloads++;
                    
                } catch (videoError) {
                    Logger.error(`فشل تحميل الفيديو: ${videoError.message}`);
                }
            }
            
            await bot.editMessageText('✅ تم تحميل القائمة!', {
                chat_id: chatId,
                message_id: statusMsg.message_id
            });
            
        } else {
            const statusMsg = await bot.sendMessage(chatId, messages.downloadStarted);
            
            const filePath = await DownloadHandler.downloadVideo(url, format, quality, userDir);
            
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
                    caption: `🎵 ${video.title}`
                });
            } else {
                await bot.sendVideo(chatId, filePath, {
                    caption: `🎬 ${video.title}`
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

// تنظيف دوري أسرع للإنتاج
setInterval(() => {
    const now = Date.now();
    const cleanupTime = config.autoCleanupMinutes * 60 * 1000;
    
    if (fs.existsSync(config.downloadDir)) {
        const userDirs = fs.readdirSync(config.downloadDir);
        userDirs.forEach(dir => {
            const dirPath = path.join(config.downloadDir, dir);
            if (fs.existsSync(dirPath)) {
                const stats = fs.statSync(dirPath);
                
                if (now - stats.mtime.getTime() > cleanupTime) {
                    fs.removeSync(dirPath);
                    Logger.info(`تم حذف المجلد المؤقت: ${dir}`);
                }
            }
        });
    }
}, 5 * 60 * 1000); // كل 5 دقائق

// Keep-alive للحفاظ على البوت نشطاً
if (config.isProduction) {
    setInterval(() => {
        axios.get(`http://localhost:${PORT}/health`).catch(() => {});
    }, 14 * 60 * 1000); // كل 14 دقيقة
}

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

Logger.info('🚀 بوت تحميل اليوتيوب (الإنتاج) يعمل الآن...');
Logger.info(`📊 الإعدادات: حجم=${config.maxFileSize}MB, قائمة=${config.maxPlaylistSize}, تنظيف=${config.autoCleanupMinutes}د`);
Logger.info(`🌐 Health check متاح على: http://localhost:${PORT}/health`);
