# VRRON — بناء نسخة Android بعد ربط المحادثة

## الحالة

- شاشة المحادثات ترسل إلى `POST /chat` وتعرض الردود.
- عنوان Cloudflare Worker الافتراضي داخل التطبيق: `https://vrron.sci-shadii.workers.dev`.
- فحوصات GitHub Actions نجحت بعد تعديلات شاشة المحادثة.
- لم يتم إنشاء APK جديد بعد؛ البناء والتثبيت الفعليان لم يُؤكدا.

## قبل البناء

1. افتح Cloudflare Worker وتأكد أن آخر commit من فرع `main` تم نشره. جرّب `/health` و`/assistants`.
2. تأكد من وجود AI binding باسم `AI` في إعدادات Worker (موجود في `cloudflare/wrangler.jsonc`).
3. افتح Expo على `https://expo.dev/` وسجّل الدخول بحسابك.

## أول ربط EAS

من GitHub Codespaces أو أي طرفية فيها Node.js 22+، نفّذ من جذر المستودع:

```bash
npm install
cd apps/mobile
npx eas-cli login
npx eas-cli init
```

إذا طلب `eas init` إنشاء مشروع جديد، وافق، ثم ارفع التعديل الذي يضيف `extra.eas.projectId` في `app.json` إلى GitHub.

## إخراج APK

من داخل `apps/mobile`:

```bash
npx eas-cli build -p android --profile preview
```

اختر إعداد Android الذي ينتج APK، وانتظر انتهاء البناء. افتح رابط البناء الناتج من EAS على هاتف Android وثبّت الملف.

## اختبار المحادثة

بعد تثبيت النسخة الجديدة، افتح تبويب المحادثات، اكتب رسالة عربية، واضغط إرسال. يجب أن يظهر رد المساعد أو خطأ واضح من الخدمة.

ملاحظة: لا يحتاج هذا المسار إلى إدخال بيانات بطاقة في مستودع GitHub. لا تضع أي Token أو مفتاح سري في الكود أو في متغير `EXPO_PUBLIC_`.