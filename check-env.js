// سكريبت للتحقق من إعدادات البيئة
require('dotenv').config();

console.log('🔍 فحص متغيرات البيئة...\n');

const requiredVars = [
    'BOT_TOKEN',
    'NODE_ENV',
    'DOWNLOAD_DIR',
    'MAX_FILE_SIZE',
    'MAX_PLAYLIST_SIZE'
];

let allGood = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'YOUR_BOT_TOKEN_HERE' || value === 'YOUR_ACTUAL_BOT_TOKEN_HERE') {
        console.log(`❌ ${varName}: غير محدد أو يحتاج تحديث`);
        allGood = false;
    } else {
        // إخفاء التوكن للأمان
        const displayValue = varName === 'BOT_TOKEN' 
            ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
            : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
    console.log('🎉 جميع المتغيرات محددة بشكل صحيح!');
    console.log('يمكنك الآن تشغيل البوت بأمان.');
} else {
    console.log('⚠️  يرجى تحديث المتغيرات المطلوبة في ملف .env');
    console.log('\nللحصول على BOT_TOKEN:');
    console.log('1. ابحث عن @BotFather في تلجرام');
    console.log('2. أرسل /newbot');
    console.log('3. اتبع التعليمات');
    console.log('4. احفظ التوكن في ملف .env');
}

console.log('\n📁 مسار ملف .env: ' + require('path').join(__dirname, '.env'));
