# سكريبت تحميل yt-dlp مباشرة
Write-Host "🚀 تحميل yt-dlp مباشرة..." -ForegroundColor Green

# رابط التحميل المباشر
$ytdlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$destinationPath = ".\yt-dlp.exe"

try {
    Write-Host "📥 جاري التحميل من GitHub..." -ForegroundColor Yellow
    
    # تحميل الملف
    Invoke-WebRequest -Uri $ytdlpUrl -OutFile $destinationPath -UseBasicParsing
    
    Write-Host "✅ تم تحميل yt-dlp بنجاح!" -ForegroundColor Green
    Write-Host "📍 المسار: $((Get-Location).Path)\yt-dlp.exe" -ForegroundColor Cyan
    
    # اختبار التشغيل
    Write-Host "🧪 اختبار yt-dlp..." -ForegroundColor Yellow
    & ".\yt-dlp.exe" --version
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 yt-dlp يعمل بشكل صحيح!" -ForegroundColor Green
        Write-Host "🚀 يمكنك الآن تشغيل البوت!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ قد تحتاج لتثبيت Visual C++ Redistributable" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ فشل في التحميل: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 جرب التحميل اليدوي من:" -ForegroundColor Yellow
    Write-Host "   https://github.com/yt-dlp/yt-dlp/releases" -ForegroundColor Cyan
}

Write-Host "`n📋 ملاحظات:" -ForegroundColor White
Write-Host "• yt-dlp موجود الآن في مجلد البوت" -ForegroundColor Gray
Write-Host "• لا حاجة لإضافته إلى PATH" -ForegroundColor Gray
Write-Host "• البوت سيستخدمه تلقائياً" -ForegroundColor Gray

Read-Host "`nاضغط Enter للمتابعة..."
