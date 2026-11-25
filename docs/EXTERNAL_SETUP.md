# EXTERNAL_SETUP

كل الخطوات مصممة للعمل من الهاتف فقط، عبر GitHub Codespaces (بيئة تطوير داخل المتصفح). يُفضّل فتح GitHub بوضع "Desktop site" في متصفح الهاتف.

## الحسابات المطلوبة

| الحساب | الاستخدام | ملاحظة |
|---|---|---|
| GitHub | المستودع وCodespaces | الحصة المجانية الشهرية لـCodespaces محدودة وقد تتغير. راجع الصفحة الرسمية قبل الاعتماد عليها. |
| Expo (expo.dev) | EAS Build | الخطة المجانية تحدد عدد البنيات الشهرية وقد تُبطئ الطابور. راجع expo.dev/pricing. |
| Google Play Console | نشر AAB على Google Play | غير مطلوب الآن. رسوم تسجيل لمرة واحدة. |

لا يلزم أي مفتاح API أو خدمة مدفوعة في المرحلة 1.1.

## 1. إنشاء المستودع

1. في GitHub: New repository.
2. الاسم: `VRRON`. يُفضّل Private.
3. لا تُفعّل Add README ولا .gitignore ولا license.

## 2. رفع ملف ZIP

1. افتح المستودع الفارغ ← Add file ← Upload files.
2. اختر `vrron-phase-1.1.zip` واضغط Commit changes.

صفحة الرفع على الهاتف ترفع الملف كما هو ولا تفك الضغط، لذلك نفكّه في الخطوة التالية.

## 3. فتح Codespace وفك الملفات

1. من صفحة المستودع: Code ← Codespaces ← Create codespace on main.
2. في الـTerminal:

```bash
unzip -o vrron-phase-1.1.zip
git rm -f vrron-phase-1.1.zip
git add -A
git commit -m "Phase 1.1: VRRON foundation"
git push
```

ملفات الـZIP تُفك مباشرة في جذر المستودع بدون مجلد وسيط.

## 4. التحقق من الـAPI والاختبارات

```bash
node -v                 # يجب أن يكون v22.18 أو أعلى
npm install
npm run check
npm test
npm run api:start
```

إذا كان إصدار Node أقدم: `nvm install 22 && nvm use 22`.

في Terminal ثانٍ:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/assistants
```

المتوقع: `/health` يرد بـ`status: ok`، و`/assistants` يرد بقائمة فارغة.

## 5. تثبيت تبعيات تطبيق Expo (مرة واحدة)

لم نثبّت إصدارات Expo يدويًا حتى لا نخمّنها. الأمر الرسمي `expo install` يختار الإصدارات المتوافقة مع بعضها:

```bash
cd apps/mobile
npm install expo@latest
npx expo install react react-native expo-status-bar expo-font react-native-safe-area-context @expo-google-fonts/ibm-plex-sans-arabic
npm install -D @types/react
npx expo install --fix
npx expo-doctor
cd ../..
npm run typecheck
```

ثم ارفع التغييرات، ومنها `package-lock.json` (مطلوب لبناء EAS):

```bash
git add -A
git commit -m "Install Expo dependencies"
git push
```

## 6. بناء APK بـEAS

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init
eas build -p android --profile preview
```

- `eas init` ينشئ المشروع على expo.dev ويكتب `projectId` في `app.json`. ارفع هذا التعديل بعد ذلك.
- عند السؤال عن Keystore اختر أن يولّده EAS.
- عند انتهاء البناء يظهر رابط. افتحه من هاتفك، نزّل الـAPK، وفعّل "التثبيت من مصادر غير معروفة" عند الطلب.
- اسم الحزمة الحالي `com.vrron.app` (في `apps/mobile/app.json`). غيّره قبل أول بناء إذا أردت اسمًا آخر، لأنه لا يتغير بعد النشر على Google Play.

لإخراج AAB لاحقًا: `eas build -p android --profile production`.

## 7. إذا فشل شيء

انسخ آخر 30 سطرًا من الخطأ (أو رابط سجل البناء على expo.dev) وأرسلها. المتوقع أن أول بناء قد يحتاج تعديلًا صغيرًا لأن إعداد المونوريبو مع EAS لم يُختبر بعد.

## نشر VRRON Core على Render

تم تجهيز `render.yaml` في جذر المستودع، والسيرفر يستمع على `0.0.0.0` ويستخدم متغير `PORT` الذي توفره منصة الاستضافة.

1. افتح [Render](https://render.com/) وسجّل الدخول بحساب GitHub المرتبط بالمستودع.
2. من لوحة Render اختر **New → Blueprint**، ثم اختر المستودع `scishadii-hash/VRRON` والفرع `main`.
3. راجع الخدمة المكتشفة باسم `vrron-core` من ملف `render.yaml`، ثم اضغط **Apply** لإنشاء ونشر الخدمة.
4. بعد انتهاء النشر، افتح صفحة الخدمة وانسخ رابطها العام `https://...onrender.com`.
5. اختبر من المتصفح بإضافة `/health` إلى الرابط. يجب أن ترى JSON يحتوي `status: "ok"`، ثم اختبر `/assistants`.

### ربط تطبيق الهاتف بعنوان الـCore

في [Expo Dashboard](https://expo.dev/)، افتح مشروع VRRON ثم **Environment variables**، وأضف المتغير التالي لبيئة `preview`:

- Name: `EXPO_PUBLIC_VRRON_API_URL`
- Value: رابط خدمة Render العام فقط، دون `/assistants` أو `/health`، ودون slash في النهاية.

بعد حفظ المتغير، أعد بناء APK من مشروع Expo باستخدام ملف `apps/mobile/eas.json` وملف تعريف `preview`. قيمة `EXPO_PUBLIC_...` تُضمّن وقت البناء؛ لذلك لن يتصل APK القديم بالخدمة تلقائيًا.
