const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BotManager {
    constructor() {
        this.botProcess = null;
        this.isRunning = false;
        this.logFile = path.join('logs', `bot-${new Date().toISOString().split('T')[0]}.log`);
        
        // إنشاء مجلد logs إذا لم يكن موجوداً
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
    }

    // تسجيل الرسائل
    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type}] ${message}\n`;
        
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    }

    // فحص المتطلبات
    async checkRequirements() {
        this.log('فحص المتطلبات...');
        
        return new Promise((resolve) => {
            // فحص ملف .env
            if (!fs.existsSync('.env')) {
                this.log('ملف .env غير موجود', 'ERROR');
                resolve(false);
                return;
            }

            // فحص BOT_TOKEN
            const envContent = fs.readFileSync('.env', 'utf8');
            if (envContent.includes('YOUR_BOT_TOKEN_HERE')) {
                this.log('يرجى تحديث BOT_TOKEN في ملف .env', 'ERROR');
                resolve(false);
                return;
            }

            // فحص yt-dlp
            exec('yt-dlp --version', (error, stdout) => {
                if (error) {
                    this.log('yt-dlp غير مثبت', 'ERROR');
                    resolve(false);
                    return;
                }
                
                this.log(`yt-dlp متوفر: ${stdout.trim()}`);
                resolve(true);
            });
        });
    }

    // بدء البوت
    async start() {
        if (this.isRunning) {
            this.log('البوت يعمل بالفعل', 'WARN');
            return;
        }

        const requirementsMet = await this.checkRequirements();
        if (!requirementsMet) {
            this.log('لا يمكن بدء البوت - متطلبات مفقودة', 'ERROR');
            return;
        }

        this.log('بدء تشغيل البوت...');
        
        this.botProcess = exec('node bot.js', (error, stdout, stderr) => {
            if (error) {
                this.log(`خطأ في البوت: ${error.message}`, 'ERROR');
                this.isRunning = false;
                return;
            }
            
            if (stderr) {
                this.log(`تحذير: ${stderr}`, 'WARN');
            }
            
            this.log('البوت توقف');
            this.isRunning = false;
        });

        this.botProcess.stdout.on('data', (data) => {
            this.log(`البوت: ${data.toString().trim()}`);
        });

        this.botProcess.stderr.on('data', (data) => {
            this.log(`خطأ البوت: ${data.toString().trim()}`, 'ERROR');
        });

        this.isRunning = true;
        this.log('البوت يعمل الآن');
    }

    // إيقاف البوت
    stop() {
        if (!this.isRunning || !this.botProcess) {
            this.log('البوت غير يعمل', 'WARN');
            return;
        }

        this.log('إيقاف البوت...');
        this.botProcess.kill();
        this.isRunning = false;
        this.log('تم إيقاف البوت');
    }

    // إعادة تشغيل البوت
    async restart() {
        this.log('إعادة تشغيل البوت...');
        this.stop();
        
        // انتظار لضمان الإغلاق الكامل
        setTimeout(() => {
            this.start();
        }, 2000);
    }

    // حالة البوت
    getStatus() {
        return {
            isRunning: this.isRunning,
            processId: this.botProcess ? this.botProcess.pid : null,
            logFile: this.logFile
        };
    }

    // تنظيف الملفات المؤقتة
    cleanup() {
        this.log('تنظيف الملفات المؤقتة...');
        
        const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
        
        if (fs.existsSync(downloadDir)) {
            const files = fs.readdirSync(downloadDir);
            files.forEach(file => {
                const filePath = path.join(downloadDir, file);
                const stats = fs.statSync(filePath);
                
                // حذف الملفات الأقدم من ساعة
                if (Date.now() - stats.mtime.getTime() > 3600000) {
                    fs.removeSync(filePath);
                    this.log(`تم حذف الملف المؤقت: ${file}`);
                }
            });
        }
    }

    // إحصائيات البوت
    getStats() {
        const stats = {
            uptime: this.isRunning ? process.uptime() : 0,
            memoryUsage: process.memoryUsage(),
            logFileSize: fs.existsSync(this.logFile) ? fs.statSync(this.logFile).size : 0
        };

        return stats;
    }
}

// واجهة سطر الأوامر
if (require.main === module) {
    const manager = new BotManager();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            manager.start();
            break;
            
        case 'stop':
            manager.stop();
            break;
            
        case 'restart':
            manager.restart();
            break;
            
        case 'status':
            const status = manager.getStatus();
            console.log('حالة البوت:', status);
            break;
            
        case 'cleanup':
            manager.cleanup();
            break;
            
        case 'stats':
            const stats = manager.getStats();
            console.log('إحصائيات البوت:', stats);
            break;
            
        default:
            console.log(`
🤖 مدير بوت تحميل اليوتيوب

الأوامر المتاحة:
  start    - بدء البوت
  stop     - إيقاف البوت
  restart  - إعادة تشغيل البوت
  status   - حالة البوت
  cleanup  - تنظيف الملفات المؤقتة
  stats    - إحصائيات البوت

الاستخدام:
  node bot-manager.js <command>
            `);
    }
}

module.exports = BotManager;
