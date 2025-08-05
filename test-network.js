// اختبار الاتصال بـ Telegram API
const https = require('https');
require('dotenv').config();

console.log('🌐 اختبار الاتصال بـ Telegram API...\n');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.log('❌ BOT_TOKEN غير موجود');
    process.exit(1);
}

// اختبار الاتصال المباشر
function testTelegramAPI() {
    return new Promise((resolve, reject) => {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
        
        console.log('🔍 اختبار الاتصال بـ Telegram API...');
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.ok) {
                        console.log('✅ الاتصال بـ Telegram API نجح!');
                        console.log(`🤖 اسم البوت: ${result.result.first_name}`);
                        console.log(`📛 Username: @${result.result.username}`);
                        resolve(result);
                    } else {
                        console.log('❌ خطأ من Telegram API:', result.description);
                        reject(new Error(result.description));
                    }
                } catch (error) {
                    console.log('❌ خطأ في تحليل الاستجابة:', error.message);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.log('❌ خطأ في الشبكة:', error.message);
            
            if (error.code === 'ENOTFOUND') {
                console.log('\n🔧 حلول مقترحة:');
                console.log('1. تحقق من اتصال الإنترنت');
                console.log('2. تحقق من إعدادات Firewall');
                console.log('3. جرب VPN إذا كان Telegram محجوب');
                console.log('4. تحقق من إعدادات Proxy');
            }
            
            reject(error);
        });
    });
}

// اختبار DNS
function testDNS() {
    return new Promise((resolve, reject) => {
        const dns = require('dns');
        
        console.log('🔍 اختبار DNS لـ api.telegram.org...');
        
        dns.lookup('api.telegram.org', (err, address) => {
            if (err) {
                console.log('❌ فشل في حل DNS:', err.message);
                reject(err);
            } else {
                console.log(`✅ DNS يعمل: api.telegram.org -> ${address}`);
                resolve(address);
            }
        });
    });
}

// تشغيل الاختبارات
async function runTests() {
    try {
        await testDNS();
        await testTelegramAPI();
        
        console.log('\n🎉 جميع الاختبارات نجحت! يمكنك تشغيل البوت الآن.');
        
    } catch (error) {
        console.log('\n❌ فشل في الاختبار:', error.message);
        console.log('\n🔧 حلول مقترحة:');
        console.log('1. تحقق من اتصال الإنترنت');
        console.log('2. أعد تشغيل الراوتر');
        console.log('3. جرب VPN مختلف');
        console.log('4. تحقق من Firewall/Antivirus');
        console.log('5. جرب شبكة مختلفة (مثل الهاتف المحمول)');
    }
}

runTests();
