const TelegramBot = require('node-telegram-bot-api');
const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// التحقق من متغيرات البيئة
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ BOT_TOKEN غير محدد في ملف .env');
    process.exit(1);
}

// إعداد البوت مع معالجة أفضل للأخطاء
const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// إعدادات المشروع
const config = {
    downloadDir: process.env.DOWNLOAD_DIR || './downloads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50,
    maxPlaylistSize: parseInt(process.env.MAX_PLAYLIST_SIZE) || 10,
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT) || 300,
    verboseLogging: process.env.VERBOSE_LOGGING === 'true'
};

// إنشاء مجلد التحميل
fs.ensureDirSync(config.downloadDir);

// معالجة أخطاء البوت
bot.on('error', (error) => {
    console.error('❌ خطأ في البوت:', error.message);
    
    if (error.code === 'EFATAL') {
        console.error('خطأ فادح في البوت. يرجى التحقق من BOT_TOKEN');
        process.exit(1);
    }
});

bot.on('polling_error', (error) => {
    console.error('❌ خطأ في Polling:', error.message);
    
    if (error.code === 'ENOTFOUND') {
        console.error('🌐 مشكلة في الاتصال بالإنترنت');
        console.error('💡 جرب: VPN أو تحقق من Firewall');
    }
    
    if (error.code === 'ETELEGRAM') {
        console.error('🤖 مشكلة في Telegram API');
        console.error('💡 جرب: إعادة تشغيل البوت');
    }
});

// رسائل الترحيب
const messages = {
    welcome: `🎬 مرحباً بك في بوت تحميل اليوتيوب!

يمكنني تحميل:
• فيديوهات يوتيوب مفردة
• قوائم تشغيل كاملة
• استخراج الصوت بصيغة MP3

فقط أرسل لي رابط يوتيوب وسأتولى الباقي! 🚀`,

    help: `📋 الأوامر المتاحة:

/start - بدء المحادثة
/help - عرض هذه المساعدة
/quality - تغيير جودة التحميل

🔗 لتحميل فيديو:
فقط أرسل رابط يوتيوب

🎵 لاستخراج الصوت:
أرسل الرابط واختر "صوت فقط"

📝 ملاحظات:
• الحد الأقصى للملف: ${config.maxFileSize} ميجا
• الحد الأقصى للقائمة: ${config.maxPlaylistSize} فيديو`,

    processing: '⏳ جاري المعالجة...',
    downloading: '📥 جاري التحميل...',
    uploading: '📤 جاري الرفع...',
    done: '✅ تم بنجاح!',
    error: '❌ حدث خطأ، يرجى المحاولة مرة أخرى'
};

// التحقق من نوع الرابط
function getLinkType(url) {
    if (url.includes('playlist')) {
        return 'playlist';
    }
    return 'video';
}

// الحصول على معلومات الفيديو
function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
        const command = `"${ytdlpPath}" --dump-json "${url}"`;
        
        exec(command, { 
            maxBuffer: 1024 * 1024 * 10,
            timeout: 30000
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('خطأ في getVideoInfo:', error.message);
                reject(error);
                return;
            }
            
            try {
                const lines = stdout.trim().split('\n');
                const videos = lines.map(line => JSON.parse(line));
                resolve(videos);
            } catch (parseError) {
                console.error('خطأ في تحليل JSON:', parseError.message);
                reject(parseError);
            }
        });
    });
}

// تحميل الفيديو
function downloadVideo(url, format, quality, outputPath) {
    return new Promise((resolve, reject) => {
        const ytdlpPath = path.join(__dirname, 'yt-dlp.exe');
        
        let formatSelector;
        let outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');
        
        if (format === 'audio') {
            formatSelector = 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio';
        } else {
            switch (quality) {
                case '720p':
                    formatSelector = 'best[height<=720][ext=mp4]/best[height<=720]';
                    break;
                case '480p':
                    formatSelector = 'best[height<=480][ext=mp4]/best[height<=480]';
                    break;
                case '360p':
                    formatSelector = 'best[height<=360][ext=mp4]/best[height<=360]';
                    break;
                default:
                    formatSelector = 'best[height<=720][ext=mp4]/best[height<=720]';
            }
        }
        
        const args = [
            '-f', formatSelector,
            '--no-warnings',
            '-o', outputTemplate
        ];
        
        if (format === 'audio') {
            args.push('--extract-audio', '--audio-format', 'mp3');
        }
        
        args.push(url);
        
        console.log(`🚀 بدء التحميل: ${url}`);
        const ytdlp = spawn(ytdlpPath, args);
        
        ytdlp.stdout.on('data', (data) => {
            if (config.verboseLogging) {
                console.log(`yt-dlp: ${data.toString().trim()}`);
            }
        });
        
        ytdlp.stderr.on('data', (data) => {
            console.warn(`yt-dlp warning: ${data.toString().trim()}`);
        });
        
        ytdlp.on('close', (code) => {
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

// معالجة الأوامر
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, messages.welcome);
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, messages.help);
});

bot.onText(/\/quality/, (msg) => {
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🎬 720p (عالية)', callback_data: 'quality_720p' },
                    { text: '🎬 480p (متوسطة)', callback_data: 'quality_480p' }
                ],
                [
                    { text: '🎬 360p (منخفضة)', callback_data: 'quality_360p' },
                    { text: '🎵 صوت فقط', callback_data: 'quality_audio' }
                ]
            ]
        }
    };
    
    bot.sendMessage(msg.chat.id, '⚙️ اختر جودة التحميل:', keyboard);
});

// معالجة الروابط
bot.on('message', async (msg) => {
    if (msg.text && (msg.text.includes('youtube.com') || msg.text.includes('youtu.be'))) {
        const chatId = msg.chat.id;
        const url = msg.text.trim();
        
        try {
            // إرسال رسالة المعالجة
            const processingMsg = await bot.sendMessage(chatId, messages.processing);
            
            // الحصول على معلومات الفيديو
            const videos = await getVideoInfo(url);
            
            if (videos.length === 0) {
                await bot.editMessageText('❌ لم يتم العثور على فيديوهات', {
                    chat_id: chatId,
                    message_id: processingMsg.message_id
                });
                return;
            }
            
            const linkType = getLinkType(url);
            
            if (linkType === 'playlist' && videos.length > config.maxPlaylistSize) {
                await bot.editMessageText(
                    `⚠️ القائمة تحتوي على ${videos.length} فيديو\nالحد الأقصى المسموح: ${config.maxPlaylistSize}`,
                    {
                        chat_id: chatId,
                        message_id: processingMsg.message_id
                    }
                );
                return;
            }
            
            // عرض خيارات التحميل
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🎬 720p', callback_data: `download_720p_${Buffer.from(url).toString('base64')}` },
                            { text: '🎬 480p', callback_data: `download_480p_${Buffer.from(url).toString('base64')}` }
                        ],
                        [
                            { text: '🎬 360p', callback_data: `download_360p_${Buffer.from(url).toString('base64')}` },
                            { text: '🎵 صوت فقط', callback_data: `download_audio_${Buffer.from(url).toString('base64')}` }
                        ]
                    ]
                }
            };
            
            const videoInfo = videos[0];
            const infoText = `📹 ${videoInfo.title || 'فيديو يوتيوب'}\n` +
                           `⏱️ المدة: ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, '0')}\n` +
                           `👁️ المشاهدات: ${videoInfo.view_count?.toLocaleString() || 'غير معروف'}\n\n` +
                           `اختر جودة التحميل:`;
            
            await bot.editMessageText(infoText, {
                chat_id: chatId,
                message_id: processingMsg.message_id,
                reply_markup: keyboard.reply_markup
            });
            
        } catch (error) {
            console.error('خطأ في معالجة الرابط:', error.message);
            await bot.sendMessage(chatId, `❌ خطأ: ${error.message}`);
        }
    }
});

// معالجة أزرار التحميل
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    
    if (data.startsWith('download_')) {
        const [, quality, encodedUrl] = data.split('_');
        const url = Buffer.from(encodedUrl, 'base64').toString();
        
        try {
            await bot.editMessageText(messages.downloading, {
                chat_id: chatId,
                message_id: messageId
            });
            
            const format = quality === 'audio' ? 'audio' : 'video';
            const outputPath = path.join(config.downloadDir, `${Date.now()}`);
            fs.ensureDirSync(outputPath);
            
            const filePath = await downloadVideo(url, format, quality, outputPath);
            
            await bot.editMessageText(messages.uploading, {
                chat_id: chatId,
                message_id: messageId
            });
            
            const stats = fs.statSync(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            
            if (fileSizeMB > config.maxFileSize) {
                await bot.editMessageText(
                    `❌ الملف كبير جداً (${fileSizeMB.toFixed(1)} ميجا)\nالحد الأقصى: ${config.maxFileSize} ميجا`,
                    {
                        chat_id: chatId,
                        message_id: messageId
                    }
                );
                fs.removeSync(outputPath);
                return;
            }
            
            if (format === 'audio') {
                await bot.sendAudio(chatId, filePath);
            } else {
                await bot.sendVideo(chatId, filePath);
            }
            
            await bot.editMessageText(messages.done, {
                chat_id: chatId,
                message_id: messageId
            });
            
            // تنظيف الملفات
            setTimeout(() => {
                fs.removeSync(outputPath);
            }, 5000);
            
        } catch (error) {
            console.error('خطأ في التحميل:', error.message);
            await bot.editMessageText(`❌ فشل التحميل: ${error.message}`, {
                chat_id: chatId,
                message_id: messageId
            });
        }
    }
    
    await bot.answerCallbackQuery(callbackQuery.id);
});

// بدء البوت
console.log('🤖 بوت تحميل اليوتيوب (مستقر) يعمل الآن...');
console.log('📡 في انتظار الرسائل...');
