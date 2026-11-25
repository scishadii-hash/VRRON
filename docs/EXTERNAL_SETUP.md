# VRRON — تشغيل وربط المشروع من الهاتف

المستودع: [scishadii-hash/VRRON](https://github.com/scishadii-hash/VRRON)
الفرع الأساسي: `main`

## الحالة الحالية

- واجهة Expo الأساسية موجودة، والـCore API والـAssistant Registry موجودان.
- فحوصات GitHub Actions ناجحة على آخر تحديث.
- الـAPI يدعم حاليًا `GET /health` و`GET /assistants`.
- لا توجد محادثة فعلية أو مساعدون مفعّلون بعد؛ لا تعتبر الواجهة الحالية بوتًا مكتملًا.
- ملف `render.yaml` جاهز، لكن إنشاء خدمة Render وربطها بحسابك يحتاج موافقتك داخل لوحة Render.

## 1) نشر VRRON Core على Render

1. افتح [Render](https://render.com/) وسجّل الدخول باستخدام GitHub.
2. اختر **New → Blueprint**.
3. اربط المستودع `scishadii-hash/VRRON`، والفرع `main`.
4. Render سيقرأ `render.yaml` ويعرض خدمة `vrron-core`. اضغط **Apply**.
5. انتظر حتى يصبح النشر Live، ثم انسخ رابط الخدمة العام، مثل `https://your-service.onrender.com`.

اختبر الرابط من متصفح الهاتف:
- `https://YOUR-SERVICE.onrender.com/health` — يجب أن يرجع JSON بحالة `ok`.
- `https://YOUR-SERVICE.onrender.com/assistants` — حاليًا متوقع قائمة فارغة، لأن مفيش مساعد مفعّل.

> لا تضع رابطًا تجريبيًا أو اسمًا متوقعًا في التطبيق. استخدم رابط Render الحقيقي الذي يظهر بعد النشر.

## 2) ربط تطبيق Expo بالـCore

من [Expo Dashboard](https://expo.dev/):

1. افتح مشروع Expo المرتبط بحسابك.
2. ادخل **Environment variables**.
3. أضف للبيئة `preview`:
   - **Name:** `EXPO_PUBLIC_VRRON_API_URL`
   - **Value:** رابط Render الأساسي فقط، من غير `/health` أو `/assistants` ومن غير slash في النهاية.
4. احفظ المتغير، ثم أعد بناء APK بملف تعريف `preview`.

قيمة `EXPO_PUBLIC_...` تُضمّن داخل التطبيق وقت البناء؛ لذلك الـAPK القديم لن يتصل بالخدمة بعد إضافة المتغير.

## 3) بناء APK (بعد تجهيز مشروع EAS)

إذا كان مشروع Expo قد تم ربطه بالفعل بحسابك:

```bash
npm install
cd apps/mobile
eas build -p android --profile preview
```

إذا طلب EAS تسجيل الدخول:
```bash
eas login
```

لو لم يتم ربط المشروع بـEAS بعد، شغّل `eas init` مرة واحدة من مجلد `apps/mobile`، ثم احفظ التعديل الذي ينشئه في `app.json` وارفعه إلى GitHub قبل البناء.

## 4) تشغيل الفحوصات في بيئة تطوير

المشروع يتطلب Node.js إصدار `22.18` أو أحدث:

```bash
npm install
npm run check
npm test
npm run typecheck
```

لتشغيل الـCore محليًا:

```bash
npm run api:start
```

ثم اختبر:
```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/assistants
```

## ملاحظة مهمة عن Codespaces

لا يلزم أن تكون داخل Codespace لفتح المستودع أو تنفيذ خطوات Render/Expo من المتصفح. لكن أوامر `npm` و`eas` تحتاج بيئة Terminal متاحة؛ صفحة GitHub العادية على الهاتف لا تشغّل الأوامر بنفسها.
