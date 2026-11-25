# VRRON

**One Vision. Infinite Intelligence.**

منظومة ذكاء اصطناعي متكاملة: مجموعة مساعدين متخصصين داخل تطبيق Android واحد، يديرها Core مركزي مستقل عن الواجهة.

> الحالة الحالية: **المرحلة 1.1 (التأسيس)**. اقرأ `PROJECT_STATUS.md` لمعرفة ما تم وما لم يتم، و`NEXT_STEPS.md` لمعرفة الخطوة التالية.

## هيكل المشروع

```
vrron/
├─ apps/
│  ├─ mobile/   تطبيق Android (React Native + Expo + TypeScript)
│  └─ api/      VRRON Core + API (Node.js + TypeScript)
├─ packages/
│  ├─ contract/ أنواع الـAPI المشتركة (types فقط)
│  └─ design/   Design Tokens (ألوان، خطوط، مسافات)
├─ docs/
│  ├─ ARCHITECTURE.md    القرارات المعمارية
│  └─ EXTERNAL_SETUP.md  الحسابات والإعدادات الخارجية وخطوات العمل من الهاتف
├─ PROJECT_STATUS.md
└─ NEXT_STEPS.md
```

## التشغيل السريع

يتطلب Node.js بإصدار 22.18 أو أعلى.

```bash
npm install
npm run check        # فحص الإعدادات
npm test             # اختبارات الـAPI والتصميم
npm run api:start    # تشغيل الـAPI على http://127.0.0.1:3000
```

جرّب الـAPI:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/assistants
```

`/assistants` يرجع قائمة فارغة في المرحلة 1.1 لأن VRRON General غير مفعّل بعد، وهذا مقصود.

## تطبيق Android

إعداد تبعيات Expo وبناء APK من الهاتف مشروحان خطوة بخطوة في `docs/EXTERNAL_SETUP.md`.

## قواعد المشروع

- لا مفاتيح API داخل الكود أو التطبيق. المفاتيح تُحفظ كمتغيرات بيئة في الـBackend فقط.
- لا مساعدين وهميين ولا أزرار شكلية. الواجهة تعرض ما يسجله الـCore فعلًا.
- المشاريع القديمة مستقلة تمامًا وليست جزءًا من هذا المستودع في الوقت الحالي.
