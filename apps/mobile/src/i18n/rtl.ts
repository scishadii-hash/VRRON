import { I18nManager } from "react-native";

/**
 * Phase 1.1: allow RTL layout. The layout follows the device language
 * (Arabic device = RTL). Whether the app should force RTL regardless of the
 * device language is an open decision, see NEXT_STEPS.md.
 */
export function enableRtlSupport(): void {
  I18nManager.allowRTL(true);
}
