import { I18nManager, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontFamily, fontSize, glowRgb, lineHeight, radius, spacing } from "@vrron/design";
import { GlowOrb } from "../components/GlowOrb";

type Props = {
  fontsReady: boolean;
};

type StatusRowProps = {
  label: string;
  value: string;
  ok: boolean;
  fontsReady: boolean;
};

function StatusRow({ label, value, ok, fontsReady }: StatusRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: ok ? colors.success : colors.textMuted }]} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, fontsReady && { fontFamily: fontFamily.semiBold }]}>{label}</Text>
        <Text style={[styles.rowValue, fontsReady && { fontFamily: fontFamily.regular }]}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Technical foundation screen (Phase 1.1). It is not the home screen.
 * It shows only facts the app can verify about itself; nothing is simulated.
 */
export function FoundationScreen({ fontsReady }: Props) {
  const isRtl = I18nManager.isRTL;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowLayer} pointerEvents="none">
          <GlowOrb size={300} rgb={glowRgb.violet} peakAlpha={0.55} />
          <View style={styles.blueOrb}>
            <GlowOrb size={200} rgb={glowRgb.blue} peakAlpha={0.4} />
          </View>
        </View>
        <Text style={[styles.wordmark, fontsReady && { fontFamily: fontFamily.bold }]}>VRRON</Text>
        <Text style={[styles.tagline, fontsReady && { fontFamily: fontFamily.regular }]}>
          One Vision. Infinite Intelligence.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={[styles.panelTitle, fontsReady && { fontFamily: fontFamily.semiBold }]}>
          حالة التأسيس
        </Text>
        <StatusRow
          label="اتجاه الواجهة"
          value={isRtl ? "من اليمين إلى اليسار (RTL)" : "من اليسار إلى اليمين (LTR)"}
          ok={isRtl}
          fontsReady={fontsReady}
        />
        <StatusRow
          label="الخط العربي"
          value={fontsReady ? "IBM Plex Sans Arabic محمّل" : "تعذر تحميل الخط، يُستخدم خط النظام"}
          ok={fontsReady}
          fontsReady={fontsReady}
        />
        <StatusRow
          label="الاتصال بـ Core"
          value="غير مربوط بعد، يبدأ في الخطوة 1.2"
          ok={false}
          fontsReady={fontsReady}
        />
        <Text style={[styles.note, fontsReady && { fontFamily: fontFamily.regular }]}>
          هذه شاشة تأسيس تقنية وليست الشاشة الرئيسية.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glowLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  blueOrb: {
    position: "absolute",
    transform: [{ translateX: 56 }, { translateY: 36 }],
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: 10, // Latin wordmark only. Never on Arabic text.
    textShadowColor: `rgba(${glowRgb.violet}, 0.7)`,
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.caption + 2,
    lineHeight: lineHeight.caption,
    letterSpacing: 0.6,
  },
  panel: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.bodyLarge,
    lineHeight: lineHeight.bodyLarge,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    marginTop: 9,
    borderRadius: radius.pill,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: fontSize.body - 2,
    lineHeight: lineHeight.body,
  },
  note: {
    color: colors.textMuted,
    fontSize: fontSize.caption + 1,
    lineHeight: lineHeight.caption + 2,
  },
});
