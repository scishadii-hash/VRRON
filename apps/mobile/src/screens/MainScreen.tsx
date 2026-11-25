import { useEffect, useState } from "react";
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontFamily,
  fontSize,
  glowRgb,
  lineHeight,
  radius,
  spacing,
} from "@vrron/design";
import { GlowOrb } from "../components/GlowOrb";

type Tab = "home" | "chats" | "settings";

type AssistantSummary = {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  accent: "violet" | "blue";
};

type RegistryStatus = "loading" | "unconfigured" | "ready" | "error";

type Props = {
  fontsReady: boolean;
};

const tabs: { key: Tab; label: string; symbol: string }[] = [
  { key: "home", label: "الرئيسية", symbol: "⌂" },
  { key: "chats", label: "المحادثات", symbol: "▤" },
  { key: "settings", label: "الإعدادات", symbol: "⚙" },
];

function TextLabel({
  children,
  style,
  fontsReady,
}: {
  children: string;
  style?: TextStyle;
  fontsReady: boolean;
}) {
  return (
    <Text style={[fontsReady && { fontFamily: fontFamily.regular }, style]}>
      {children}
    </Text>
  );
}

export function MainScreen({ fontsReady }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [assistants, setAssistants] = useState<AssistantSummary[]>([]);
  const [registryStatus, setRegistryStatus] = useState<RegistryStatus>("loading");
  const apiBase = (process.env.EXPO_PUBLIC_VRRON_API_URL ?? "").trim().replace(/\/$/, "");

  useEffect(() => {
    if (!apiBase) {
      setRegistryStatus("unconfigured");
      return;
    }
    const controller = new AbortController();
    setRegistryStatus("loading");
    fetch(apiBase + "/assistants", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Core request failed: " + response.status);
        return response.json() as Promise<{ assistants?: AssistantSummary[] }>;
      })
      .then((payload) => {
        if (!Array.isArray(payload.assistants)) throw new Error("Invalid registry response");
        setAssistants(payload.assistants);
        setRegistryStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRegistryStatus("error");
      });
    return () => controller.abort();
  }, [apiBase]);
  const isRtl = I18nManager.isRTL;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View>
            <TextLabel fontsReady={fontsReady} style={styles.brand}>VRRON</TextLabel>
            <TextLabel fontsReady={fontsReady} style={styles.brandCaption}>
              One Vision. Infinite Intelligence.
            </TextLabel>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <TextLabel fontsReady={fontsReady} style={styles.statusText}>المرحلة التأسيسية</TextLabel>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "home" && (
            <>
              <View style={styles.hero}>
                <View pointerEvents="none" style={styles.heroGlow}>
                  <GlowOrb size={250} rgb={glowRgb.violet} peakAlpha={0.32} />
                </View>
                <TextLabel fontsReady={fontsReady} style={styles.eyebrow}>
                  عالمك، بإمكانات أوسع
                </TextLabel>
                <TextLabel fontsReady={fontsReady} style={styles.headline}>
                  {"ذكاء واحد.\nرؤى بلا حدود."}
                </TextLabel>
                <TextLabel fontsReady={fontsReady} style={styles.heroDescription}>
                  مساحة تجمع مساعديك الذكيين في تجربة واحدة، مصممة حولك.
                </TextLabel>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="افتح شاشة المحادثات"
                onPress={() => setActiveTab("chats")}
                style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}
              >
                <View style={styles.cardGlow} />
                <View style={styles.cardTop}>
                  <TextLabel fontsReady={fontsReady} style={styles.cardKicker}>
                    بداية جديدة
                  </TextLabel>
                  <Text style={styles.cardArrow}>{isRtl ? "↙" : "↘"}</Text>
                </View>
                <TextLabel fontsReady={fontsReady} style={styles.cardTitle}>
                  ابدأ رحلتك مع VRRON
                </TextLabel>
                <TextLabel fontsReady={fontsReady} style={styles.cardDescription}>
                  واجهة المحادثات قيد التجهيز. قريبًا ستجد مساعديك هنا.
                </TextLabel>
              </Pressable>

              <View style={styles.sectionHeading}>
                <TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>
                  منظومتك
                </TextLabel>
                <TextLabel fontsReady={fontsReady} style={styles.sectionHint}>
                  الأساس جاهز، والتجربة تتطور
                </TextLabel>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>✦</Text>
                </View>
                <View style={styles.infoText}>
                  <TextLabel fontsReady={fontsReady} style={styles.infoTitle}>
                    مساعدون متخصصون
                  </TextLabel>
                  <TextLabel fontsReady={fontsReady} style={styles.infoBody}>
                    سيتم عرض المساعدين الفعليين عند ربط التطبيق بالـCore.
                  </TextLabel>
                </View>
              </View>
            </>
          )}

          {activeTab === "chats" && (
            <View style={styles.chatPage}>
              <TextLabel fontsReady={fontsReady} style={styles.pageTitle}>مساحة المحادثات</TextLabel>
              <TextLabel fontsReady={fontsReady} style={styles.pageSubtitle}>اختار المساعد المناسب لمهمتك</TextLabel>
              <View style={styles.assistantIntro}>
                <View style={styles.assistantIntroIcon}><Text style={styles.infoIconText}>✦</Text></View>
                <View style={styles.infoText}>
                  <TextLabel fontsReady={fontsReady} style={styles.infoTitle}>منظومة VRRON</TextLabel>
                  <TextLabel fontsReady={fontsReady} style={styles.infoBody}>الواجهة جاهزة، ويتم تجهيز ربط قائمة المساعدين بالـCore.</TextLabel>
                </View>
              </View>
              <TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>مساعدوك</TextLabel>
              <View style={styles.registryCard}>
                {registryStatus === "loading" && <TextLabel fontsReady={fontsReady} style={styles.registryBody}>جارٍ تحميل قائمة المساعدين من VRRON Core…</TextLabel>}
                {registryStatus === "unconfigured" && <><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>الـCore غير متصل بعد</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>قائمة المساعدين ستظهر بعد نشر الـCore وضبط عنوان API العام في إعدادات البناء.</TextLabel></>}
                {registryStatus === "error" && <><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>تعذّر الاتصال بالـCore</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>تحقق من عنوان API واتصال الخدمة، ثم أعد فتح التطبيق.</TextLabel></>}
                {registryStatus === "ready" && assistants.length === 0 && <><View style={styles.registryOrb}><GlowOrb size={82} rgb={glowRgb.blue} peakAlpha={0.28} /><Text style={styles.registrySymbol}>⌘</Text></View><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>لا يوجد مساعدون مفعّلون</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>وصل التطبيق بالـCore بنجاح، لكن الـAssistant Registry لا يحتوي حاليًا على مساعد مفعّل.</TextLabel></>}
                {registryStatus === "ready" && assistants.map((assistant) => <View key={assistant.id} style={styles.assistantRow}><View style={[styles.assistantBadge, assistant.accent === "blue" && styles.assistantBadgeBlue]}><Text style={styles.assistantBadgeSymbol}>✦</Text></View><View style={styles.infoText}><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>{assistant.name.ar || assistant.name.en}</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>{assistant.description.ar || assistant.description.en}</TextLabel></View></View>)}
                <View style={styles.phaseTag}><TextLabel fontsReady={fontsReady} style={styles.phaseTagText}>Assistant Registry · Core API</TextLabel></View>
              </View>
              <View style={styles.composerPreview}>
                <TextLabel fontsReady={fontsReady} style={styles.composerHint}>اكتب رسالتك بعد اختيار المساعد</TextLabel>
                <View style={styles.composerDisabled}>
                  <TextLabel fontsReady={fontsReady} style={styles.composerPlaceholder}>المحادثة غير مفعّلة في هذه المرحلة</TextLabel>
                  <View style={styles.sendDisabled}><Text style={styles.sendSymbol}>↑</Text></View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "settings" && (
            <>
              <TextLabel fontsReady={fontsReady} style={styles.pageTitle}>
                الإعدادات
              </TextLabel>
              <TextLabel fontsReady={fontsReady} style={styles.pageSubtitle}>
                تفاصيل تجربة VRRON
              </TextLabel>
              <View style={styles.settingsCard}>
                <SettingRow fontsReady={fontsReady} title="لغة الواجهة" value="العربية" />
                <SettingRow fontsReady={fontsReady} title="اتجاه العرض" value={isRtl ? "من اليمين إلى اليسار" : "من اليسار إلى اليمين"} />
                <SettingRow fontsReady={fontsReady} title="إصدار التطبيق" value="0.1.0 · تأسيسي" last />
              </View>
              <TextLabel fontsReady={fontsReady} style={styles.settingsNote}>
                إعدادات الحساب والمساعدين ستظهر عند اكتمال ربط الخدمات.
              </TextLabel>
            </>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                onPress={() => setActiveTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabSymbol, selected && styles.tabSymbolSelected]}>
                  {tab.symbol}
                </Text>
                <TextLabel
                  fontsReady={fontsReady}
                  style={{ ...styles.tabLabel, ...(selected ? styles.tabLabelSelected : {}) }}
                >
                  {tab.label}
                </TextLabel>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingRow({
  title,
  value,
  last = false,
  fontsReady,
}: {
  title: string;
  value: string;
  last?: boolean;
  fontsReady: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.settingDivider]}>
      <TextLabel fontsReady={fontsReady} style={styles.settingTitle}>{title}</TextLabel>
      <TextLabel fontsReady={fontsReady} style={styles.settingValue}>{value}</TextLabel>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 21,
    fontFamily: fontFamily.bold,
    letterSpacing: 3,
  },
  brandCaption: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.25,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.violetLight,
  },
  statusText: { color: colors.textSecondary, fontSize: 10 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  hero: { minHeight: 215, justifyContent: "center", paddingVertical: spacing.xl },
  heroGlow: { position: "absolute", top: -10, alignSelf: "center" },
  eyebrow: { color: colors.violetLight, fontSize: fontSize.body - 2, marginBottom: spacing.sm },
  headline: {
    color: colors.textPrimary,
    fontSize: fontSize.headline,
    lineHeight: lineHeight.headline + 5,
    fontFamily: fontFamily.bold,
  },
  heroDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.body - 1,
    lineHeight: lineHeight.body,
    marginTop: spacing.md,
    maxWidth: 310,
  },
  primaryCard: {
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: "#39305C",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -95,
    left: -55,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardKicker: { color: colors.violetLight, fontSize: fontSize.caption },
  cardArrow: { color: colors.blueLight, fontSize: 22 },
  cardTitle: { color: colors.textPrimary, fontSize: fontSize.bodyLarge, fontFamily: fontFamily.semiBold },
  cardDescription: { color: colors.textSecondary, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body - 2 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  sectionHeading: { gap: 4, marginTop: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.title, fontFamily: fontFamily.semiBold },
  sectionHint: { color: colors.textMuted, fontSize: fontSize.caption },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 58, 237, 0.16)",
  },
  infoIconText: { color: colors.violetLight, fontSize: 23 },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { color: colors.textPrimary, fontSize: fontSize.body, fontFamily: fontFamily.semiBold },
  infoBody: { color: colors.textSecondary, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body - 3 },
  chatPage: { gap: spacing.lg, paddingBottom: spacing.lg },
  assistantIntro: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  assistantIntroIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124, 58, 237, 0.16)" },
  registryCard: { alignItems: "stretch", padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  assistantRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  assistantBadge: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124, 58, 237, 0.18)" },
  assistantBadgeBlue: { backgroundColor: "rgba(59, 130, 246, 0.18)" },
  assistantBadgeSymbol: { color: colors.violetLight, fontSize: 22 },
  registryOrb: { width: 82, height: 82, alignItems: "center", justifyContent: "center" },
  registrySymbol: { position: "absolute", color: colors.blueLight, fontSize: 30 },
  registryTitle: { color: colors.textPrimary, fontSize: fontSize.body, fontFamily: fontFamily.semiBold, textAlign: "center" },
  registryBody: { color: colors.textSecondary, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body, textAlign: "center" },
  composerPreview: { gap: spacing.sm, marginTop: spacing.md },
  composerHint: { color: colors.textMuted, fontSize: fontSize.caption },
  composerDisabled: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  composerPlaceholder: { flex: 1, color: colors.textMuted, fontSize: fontSize.caption },
  sendDisabled: { width: 34, height: 34, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised },
  sendSymbol: { color: colors.textMuted, fontSize: 22 },
  emptyState: { flex: 1, minHeight: 430, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, gap: spacing.lg },
  emptyOrb: { width: 150, height: 150, alignItems: "center", justifyContent: "center" },
  emptySymbol: { position: "absolute", color: colors.blueLight, fontSize: 44 },
  headlineSmall: { color: colors.textPrimary, fontSize: fontSize.title, fontFamily: fontFamily.semiBold, textAlign: "center" },
  emptyDescription: { color: colors.textSecondary, fontSize: fontSize.body - 1, lineHeight: lineHeight.body, textAlign: "center" },
  phaseTag: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  phaseTagText: { color: colors.violetLight, fontSize: fontSize.caption },
  pageTitle: { color: colors.textPrimary, fontSize: fontSize.headline, fontFamily: fontFamily.bold, marginTop: spacing.xl },
  pageSubtitle: { color: colors.textSecondary, fontSize: fontSize.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  settingsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  settingRow: { paddingVertical: spacing.lg, gap: spacing.xs },
  settingDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  settingTitle: { color: colors.textPrimary, fontSize: fontSize.body },
  settingValue: { color: colors.textMuted, fontSize: fontSize.caption + 1 },
  settingsNote: { color: colors.textMuted, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body - 2, marginTop: spacing.md },
  tabBar: {
    flexDirection: "row",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: spacing.sm, borderRadius: radius.md },
  tabSelected: { backgroundColor: colors.surfaceRaised },
  tabSymbol: { color: colors.textMuted, fontSize: 18 },
  tabSymbolSelected: { color: colors.violetLight },
  tabLabel: { color: colors.textMuted, fontSize: 10 },
  tabLabelSelected: { color: colors.textPrimary, fontFamily: fontFamily.semiBold },
});
