# ARCHITECTURE

## المبدأ

التطبيق واجهة رفيعة، والـCore هو العقل. أي واجهة مستقبلية (Android، ويب، غيرها) تتحدث مع نفس الـCore عبر نفس العقد (`packages/contract`).

## مسار الرسالة (الهدف النهائي)

```
المستخدم ← التطبيق ← API ← Router ← تحميل إعدادات المساعد
        ← تجهيز السياق ← Provider ← تنفيذ الأدوات عند الحاجة ← Streaming للتطبيق
```

في المرحلة 1.1 تعمل الأجزاء التالية فقط: API، Router، Registry، تحميل إعدادات المساعدين. باقي المسار يُبنى في المرحلة 2.

## الطبقات

| الطبقة | المكان | المسؤولية |
|---|---|---|
| التطبيق | `apps/mobile` | عرض الواجهة فقط. لا مفاتيح ولا منطق ذكاء. |
| HTTP adapter | `apps/api/src/http` | يحوّل طلب `node:http` إلى `CoreRequest` ويكتب الرد. لا منطق فيه. |
| Core | `apps/api/src/core` | الـRouter والـRegistry والتحميل. لا يعرف أي إطار ويب. |
| المساعدون | `apps/api/src/assistants` | مجلد لكل مساعد، فيه `config.ts` فقط. |
| العقد | `packages/contract` | أنواع الطلبات والردود. types فقط. |
| الهوية | `packages/design` | Design Tokens. |

## استقلال الـCore عن طبقة HTTP

`handleRequest(request, deps)` دالة نقية: تستقبل `{ method, path }` وترجع `{ status, headers, body }`. اختبار `Core works without any HTTP layer` يثبت ذلك. الانتقال من `node:http` إلى Hono لاحقًا يعني كتابة adapter جديد فقط، دون لمس الـRouter أو الـRegistry.

## الـAssistant Registry

- كل مساعد مجلد داخل `apps/api/src/assistants/<id>/` فيه `config.ts` يصدّر الإعداد كـ`default`.
- `loadAssistants` يكتشف المجلدات تلقائيًا ويتحقق من كل إعداد (الشكل، `id` يطابق اسم المجلد، عدم التكرار).
- إعداد غير صالح يُتخطى ويُسجَّل تحذير، ولا يوقف الخادم.
- `registry.list()` يرجع المساعدين المفعّلين فقط، وبحقول آمنة للعرض فقط (`id` و`name` و`description` و`accent`). `systemPrompt` و`tools` لا تغادر الخادم أبدًا.
- لأن القائمة تأتي من الخادم، إضافة مساعد جديد لا تتطلب إصدار APK جديد.

### إضافة مساعد جديد

1. أنشئ المجلد `apps/api/src/assistants/finance/`.
2. أنشئ داخله `config.ts`:

```ts
import type { AssistantConfig } from "../../core/assistant.ts";

const config: AssistantConfig = {
  id: "finance", // يطابق اسم المجلد
  name: { ar: "VRRON Finance", en: "VRRON Finance" },
  description: { ar: "...", en: "..." },
  accent: "blue",
  enabled: true,
  systemPrompt: "...",
  tools: [],
};

export default config;
```

3. أعد تشغيل الـAPI. لا تعديل على أي ملف آخر.

## Provider Abstraction

`apps/api/src/core/providers/types.ts` يعرّف واجهة `AIProvider` فقط. لا يوجد ربط فعلي بأي مزود في المرحلة 1.1. في المرحلة 2 يطبّق كل مزود هذه الواجهة، فلا يرتبط الـCore بمزود واحد.

## القرارات الأساسية وأسبابها

| القرار | السبب | المقابل |
|---|---|---|
| React Native + Expo + TypeScript | تطبيق Android حقيقي، لغة واحدة مع الـBackend، وويب/PWA اختياري لاحقًا من نفس الكود. | الهوية البصرية المخصصة جدًا أسهل في Flutter. |
| EAS Build | إخراج APK/AAB سحابيًا دون Android Studio، مناسب للعمل من الهاتف. | حدود الخطة المجانية وطابور الانتظار. |
| `node:http` في 1.1 | بلا تبعيات، فيمكن تشغيل الـAPI واختباره في أي بيئة. | يلزم Hono أو ما يشبهه عند ظهور الحاجة إلى middleware وStreaming وCORS. |
| Registry على الخادم | مساعد جديد بدون APK جديد، وأسرار المساعد لا تصل للجهاز. | التطبيق يحتاج اتصالًا لعرض المساعدين. |
| npm workspaces | بدون أدوات إضافية. | دعم EAS للمونوريبو لم يُختبر في هذا المشروع بعد. |
| TypeScript يعمل مباشرة على Node | لا خطوة بناء للـAPI. | يتطلب Node 22.18+ وكتابة imports بامتداد `.ts` وصيغة TypeScript قابلة للحذف فقط (`erasableSyntaxOnly`). |

## الأمان

- لا مفاتيح في التطبيق ولا في المستودع. `npm run check` يفحص الملفات بحثًا عن قيم تشبه المفاتيح.
- الـAPI يرد برؤوس `no-store` و`nosniff`.
- الأخطاء غير المتوقعة ترجع رسالة عامة (500) وتُسجَّل في الخادم فقط.
- عزل بيانات المستخدمين والمصادقة يبدآن مع قاعدة البيانات في المرحلة 2.
