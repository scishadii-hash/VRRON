import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  I18nManager,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
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
type ChatMessage = { role: "user" | "assistant"; content: string; feedback?: "helpful" | "unhelpful" };
type ChatConversation = {
  id: string;
  assistantId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

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
  numberOfLines,
}: {
  children: ReactNode;
  style?: TextStyle;
  fontsReady: boolean;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[fontsReady && { fontFamily: fontFamily.regular }, style]}>
      {children}
    </Text>
  );
}

export function MainScreen({ fontsReady }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [assistants, setAssistants] = useState<AssistantSummary[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState("general");
  const [registryStatus, setRegistryStatus] = useState<RegistryStatus>("loading");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [favoriteAssistantIds, setFavoriteAssistantIds] = useState<string[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationsReady, setConversationsReady] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatBusyRef = useRef(false);
  const [registryRefreshKey, setRegistryRefreshKey] = useState(0);
  const [chatError, setChatError] = useState("");
  const apiBase = (process.env.EXPO_PUBLIC_VRRON_API_URL ?? "https://vrron.sci-shadii.workers.dev").trim().replace(/\/$/, "");

  const conversationsFile = FileSystem.documentDirectory
    ? FileSystem.documentDirectory + "vrron-conversations.json"
    : null;

  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      try {
        if (!conversationsFile) return;
        const fileInfo = await FileSystem.getInfoAsync(conversationsFile);
        if (!fileInfo.exists) return;
        const saved = JSON.parse(await FileSystem.readAsStringAsync(conversationsFile)) as {
          conversations?: ChatConversation[];
          activeConversationId?: string | null;
          favoriteAssistantIds?: string[];
        };
        if (!mounted || !Array.isArray(saved.conversations)) return;
        const validConversations = saved.conversations.filter((item) =>
          item && typeof item.id === "string" && typeof item.assistantId === "string" &&
          Array.isArray(item.messages) && typeof item.updatedAt === "number"
        );
        setConversations(validConversations);
        if (Array.isArray(saved.favoriteAssistantIds)) setFavoriteAssistantIds(saved.favoriteAssistantIds.filter((id) => typeof id === "string"));
        const savedActive = validConversations.find((item) => item.id === saved.activeConversationId);
        if (savedActive) {
          setActiveConversationId(savedActive.id);
          setSelectedAssistantId(savedActive.assistantId);
          setChatMessages(savedActive.messages);
        }
      } catch {
        // A damaged or older local file should never prevent the app from opening.
      } finally {
        if (mounted) setConversationsReady(true);
      }
    }
    void loadConversations();
    return () => { mounted = false; };
  }, [conversationsFile]);

  useEffect(() => {
    if (!conversationsReady || !conversationsFile) return;
    void FileSystem.writeAsStringAsync(
      conversationsFile,
      JSON.stringify({ conversations, activeConversationId, favoriteAssistantIds }),
    ).catch(() => {
      // Chat remains usable if device storage is temporarily unavailable.
    });
  }, [conversations, activeConversationId, favoriteAssistantIds, conversationsReady, conversationsFile]);

  function updateConversationMessages(conversationId: string, assistantId: string, messages: ChatMessage[]) {
    const firstUserMessage = messages.find((message) => message.role === "user")?.content ?? "";
    const title = firstUserMessage.trim().slice(0, 54) || "محادثة جديدة";
    const now = Date.now();
    setConversations((current) => {
      const existing = current.find((item) => item.id === conversationId);
      if (existing) {
        return current.map((item) => item.id === conversationId
          ? { ...item, messages, title: item.title === "محادثة جديدة" ? title : item.title, updatedAt: now }
          : item);
      }
      return [{ id: conversationId, assistantId, title, messages, createdAt: now, updatedAt: now }, ...current];
    });
  }

  function openConversation(conversation: ChatConversation) {
    setActiveConversationId(conversation.id);
    setSelectedAssistantId(conversation.assistantId);
    setChatMessages(conversation.messages);
    setChatError("");
    setShowConversationHistory(false);
    setRenamingConversationId(null);
  }

  function startNewChat() {
    setActiveConversationId(null);
    setChatMessages([]);
    setChatError("");
    setChatInput("");
    setShowConversationHistory(false);
  }

  function toggleFavoriteAssistant(assistantId: string) {
    setFavoriteAssistantIds((current) => current.includes(assistantId)
      ? current.filter((id) => id !== assistantId)
      : [...current, assistantId]);
  }

  async function shareConversation(conversation: ChatConversation) {
    const assistant = assistants.find((item) => item.id === conversation.assistantId);
    const transcript = conversation.messages.map((message) =>
      (message.role === "user" ? "أنت" : assistant?.name.ar || "VRRON") + ":\n" + message.content
    ).join("\n\n");
    try {
      await Share.share({
        title: conversation.title,
        message: "VRRON · " + conversation.title + "\nالمساعد: " + (assistant?.name.ar || conversation.assistantId) + "\n\n" + transcript,
      });
    } catch {
      Alert.alert("تعذّر مشاركة المحادثة", "حاول مرة تانية.");
    }
  }

  function rateAssistantReply(messageIndex: number, feedback: "helpful" | "unhelpful") {\n    const updated = chatMessages.map((message, index) => index === messageIndex && message.role === "assistant"\n      ? { ...message, feedback: message.feedback === feedback ? undefined : feedback }\n      : message);\n    setChatMessages(updated);\n    if (activeConversationId) updateConversationMessages(activeConversationId, selectedAssistantId, updated);\n  }\n\n  async function shareAssistantReply(content: string) {
    try {
      await Share.share({ title: "رد من VRRON", message: "رد من VRRON\n\n" + content });
    } catch {
      Alert.alert("تعذّرت مشاركة الرد", "حاول مرة تانية.");
    }
  }

  function deleteConversation(conversationId: string) {
    Alert.alert("حذف المحادثة", "المحادثة هتتمسح من الجهاز نهائيًا.", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => {
        setConversations((current) => current.filter((item) => item.id !== conversationId));
        if (activeConversationId === conversationId) startNewChat();
        if (renamingConversationId === conversationId) setRenamingConversationId(null);
      } },
    ]);
  }

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
        setSelectedAssistantId((current) => payload.assistants?.some((item) => item.id === current) ? current : payload.assistants?.[0]?.id ?? "general");
        setRegistryStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setRegistryStatus("error");
      });
    return () => controller.abort();
  }, [apiBase, registryRefreshKey]);
  async function sendChatMessage(retryLast = false) {
    const content = chatInput.trim();
    if (chatBusyRef.current || chatBusy || !apiBase || !conversationsReady) return;
    const nextMessages: ChatMessage[] = retryLast
      ? chatMessages
      : [...chatMessages, { role: "user", content }];
    if (!retryLast && !content) return;
    if (retryLast && nextMessages[nextMessages.length - 1]?.role !== "user") return;
    const conversationId = activeConversationId ?? String(Date.now());
    if (!retryLast) {
      setChatMessages(nextMessages);
      updateConversationMessages(conversationId, selectedAssistantId, nextMessages);
      setActiveConversationId(conversationId);
      setChatInput("");
    }
    chatBusyRef.current = true;
    setChatBusy(true);
    setChatError("");
    try {
      const response = await fetch(apiBase + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assistantId: selectedAssistantId, messages: nextMessages }),
      });
      const payload = await response.json() as { reply?: string; error?: string | { message?: string; code?: string } };
      const apiError = typeof payload.error === "string" ? payload.error : payload.error?.message;
      if (!response.ok) throw new Error(apiError || "الخدمة ردّت بكود " + response.status);
      if (!payload.reply) throw new Error("وصل رد من غير محتوى. جرّب مرة تانية.");
      const updated = [...nextMessages, { role: "assistant" as const, content: payload.reply as string }];
      setChatMessages(updated);
      updateConversationMessages(conversationId, selectedAssistantId, updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "حصل خطأ غير متوقع.";
      setChatError(message.includes("Network request failed") || message.includes("fetch")
        ? "مفيش اتصال بالـCore حاليًا. راجع الإنترنت واضغط إعادة المحاولة."
        : message);
    } finally {
      chatBusyRef.current = false;
      setChatBusy(false);
    }
  }

  const isRtl = I18nManager.isRTL;
  const favoriteAssistants = assistants.filter((assistant) => favoriteAssistantIds.includes(assistant.id));
  const filteredConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).filter((conversation) => {
    const query = conversationSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    const assistant = assistants.find((item) => item.id === conversation.assistantId);
    return [conversation.title, conversation.assistantId, assistant?.name.ar, assistant?.name.en,
      ...conversation.messages.map((message) => message.content)].some((value) => value?.toLocaleLowerCase().includes(query));
  });

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
                  ابدأ محادثة مباشرة مع مساعد VRRON العام.
                </TextLabel>
              </Pressable>

              <View style={styles.sectionHeading}>
                <TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>مساعدوك</TextLabel>
                <TextLabel fontsReady={fontsReady} style={styles.sectionHint}>اختار مساعد وابدأ من هنا</TextLabel>
              </View>
              {registryStatus === "loading" && <View style={styles.infoCard}><TextLabel fontsReady={fontsReady} style={styles.infoBody}>بنحمّل مساعديك من VRRON Core…</TextLabel></View>}
              {registryStatus === "error" && <Pressable onPress={() => setActiveTab("chats")} style={styles.infoCard}><TextLabel fontsReady={fontsReady} style={styles.infoBody}>تعذّر تحميل المساعدين — افتح المحادثات للتحقق من الاتصال</TextLabel></Pressable>}
              {registryStatus === "ready" && favoriteAssistants.length > 0 && <><View style={styles.sectionHeading}><TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>وصول سريع للمفضّلين ★</TextLabel><TextLabel fontsReady={fontsReady} style={styles.sectionHint}>افتح مساعدك المفضّل بضغطة واحدة</TextLabel></View>{favoriteAssistants.map((assistant) => <Pressable key={"favorite-" + assistant.id} accessibilityRole="button" onPress={() => { setSelectedAssistantId(assistant.id); const latest = conversations.filter((item) => item.assistantId === assistant.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (latest) openConversation(latest); else startNewChat(); setSelectedAssistantId(assistant.id); setChatError(""); setActiveTab("chats"); }} style={({pressed}) => [styles.infoCard, pressed && styles.pressed]}><View style={[styles.infoIcon, assistant.accent === "blue" && styles.assistantBadgeBlue]}><Text style={styles.infoIconText}>★</Text></View><View style={styles.infoText}><TextLabel fontsReady={fontsReady} style={styles.infoTitle}>{assistant.name.ar || assistant.name.en}</TextLabel><TextLabel fontsReady={fontsReady} style={styles.infoBody}>{assistant.description.ar || assistant.description.en}</TextLabel></View><Text style={styles.cardArrow}>↙</Text></Pressable>)}</>}
              {registryStatus === "ready" && assistants.map((assistant) => <Pressable key={assistant.id} onPress={() => { setSelectedAssistantId(assistant.id); const latest = conversations.filter((item) => item.assistantId === assistant.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (latest) openConversation(latest); else startNewChat(); setSelectedAssistantId(assistant.id); setChatError(""); setActiveTab("chats"); }} style={({pressed}) => [styles.infoCard, pressed && styles.pressed]}><View style={[styles.infoIcon, assistant.accent === "blue" && styles.assistantBadgeBlue]}><Text style={styles.infoIconText}>✦</Text></View><View style={styles.infoText}><TextLabel fontsReady={fontsReady} style={styles.infoTitle}>{assistant.name.ar || assistant.name.en}</TextLabel><TextLabel fontsReady={fontsReady} style={styles.infoBody}>{assistant.description.ar || assistant.description.en}</TextLabel></View><Text style={styles.cardArrow}>↙</Text></Pressable>)}
            </>
          )}

          {activeTab === "chats" && (
            <View style={styles.chatPage}>
              <View style={styles.chatTitleRow}><TextLabel fontsReady={fontsReady} style={styles.pageTitle}>{showConversationHistory ? "سجل المحادثات" : "محادثة " + (assistants.find((item) => item.id === selectedAssistantId)?.name.ar || "VRRON General")}</TextLabel><View style={styles.chatHeaderActions}><Pressable accessibilityRole="button" onPress={() => setShowConversationHistory((value) => !value)} style={styles.clearChatButton}><TextLabel fontsReady={fontsReady} style={styles.clearChatText}>{showConversationHistory ? "رجوع للمحادثة" : "السجل"}</TextLabel></Pressable><Pressable accessibilityRole="button" accessibilityLabel="محادثة جديدة" onPress={startNewChat} style={styles.clearChatButton}><TextLabel fontsReady={fontsReady} style={styles.clearChatText}>+ جديدة</TextLabel></Pressable></View></View>
              <TextLabel fontsReady={fontsReady} style={styles.pageSubtitle}>المساعد المختار: {assistants.find((item) => item.id === selectedAssistantId)?.name.en || selectedAssistantId}</TextLabel>
              <View style={styles.assistantIntro}>
                <View style={styles.assistantIntroIcon}><Text style={styles.infoIconText}>✦</Text></View>
                <View style={styles.infoText}>
                  <TextLabel fontsReady={fontsReady} style={styles.infoTitle}>منظومة VRRON</TextLabel>
                  <TextLabel fontsReady={fontsReady} style={styles.infoBody}>المحادثة متصلة بـVRRON Core عبر Workers AI.</TextLabel>
                </View>
              </View>
              <TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>مساعدوك</TextLabel>
              <View style={styles.registryCard}>
                {registryStatus === "loading" && <TextLabel fontsReady={fontsReady} style={styles.registryBody}>جارٍ تحميل قائمة المساعدين من VRRON Core…</TextLabel>}
                {registryStatus === "unconfigured" && <><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>الـCore غير متصل بعد</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>اضبط EXPO_PUBLIC_VRRON_API_URL إذا كنت تستخدم عنوان Core مختلفًا.</TextLabel></>}
                {registryStatus === "error" && <><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>تعذّر الاتصال بالـCore</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>راجع الإنترنت، وحاول تحديث قائمة المساعدين.</TextLabel><Pressable accessibilityRole="button" onPress={() => setRegistryRefreshKey((key) => key + 1)} style={styles.retryButton}><TextLabel fontsReady={fontsReady} style={styles.retryText}>إعادة الاتصال ↻</TextLabel></Pressable></>}
                {registryStatus === "ready" && assistants.length === 0 && <><View style={styles.registryOrb}><GlowOrb size={82} rgb={glowRgb.blue} peakAlpha={0.28} /><Text style={styles.registrySymbol}>⌘</Text></View><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>لا يوجد مساعدون مفعّلون</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>اتصل التطبيق بالـCore، لكن لا يوجد مساعد مفعّل حاليًا.</TextLabel></>}
                {registryStatus === "ready" && assistants.map((assistant) => <Pressable key={assistant.id} accessibilityRole="button" accessibilityState={{ selected: assistant.id === selectedAssistantId }} onPress={() => { if (assistant.id !== selectedAssistantId) { setSelectedAssistantId(assistant.id); const latest = conversations.filter((item) => item.assistantId === assistant.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (latest) openConversation(latest); else startNewChat(); setSelectedAssistantId(assistant.id); setChatError(""); } }} style={({ pressed }) => [styles.assistantRow, assistant.id === selectedAssistantId && styles.assistantRowSelected, pressed && styles.pressed]}><View style={[styles.assistantBadge, assistant.accent === "blue" && styles.assistantBadgeBlue]}><Text style={styles.assistantBadgeSymbol}>{favoriteAssistantIds.includes(assistant.id) ? "★" : "✦"}</Text></View><View style={styles.infoText}><TextLabel fontsReady={fontsReady} style={styles.registryTitle}>{assistant.name.ar || assistant.name.en}</TextLabel><TextLabel fontsReady={fontsReady} style={styles.registryBody}>{assistant.description.ar || assistant.description.en}</TextLabel></View><TextLabel fontsReady={fontsReady} style={styles.assistantSelectMark}>{assistant.id === selectedAssistantId ? "✓" : "›"}</TextLabel></Pressable>)}
                <View style={styles.phaseTag}><TextLabel fontsReady={fontsReady} style={styles.phaseTagText}>Assistant Registry · Core API</TextLabel></View>
              </View>
              {showConversationHistory ? (
                <View style={styles.historyList}>
                  <TextInput value={conversationSearch} onChangeText={setConversationSearch} placeholder="ابحث في المحادثات أو اسم المساعد…" placeholderTextColor={colors.textMuted} returnKeyType="search" style={styles.historySearch} accessibilityLabel="البحث في سجل المحادثات" />
                  {!conversationsReady && <TextLabel fontsReady={fontsReady} style={styles.registryBody}>بنحمّل سجل المحادثات…</TextLabel>}
                  {conversationsReady && conversations.length === 0 && <TextLabel fontsReady={fontsReady} style={styles.chatWelcome}>لسه مفيش محادثات محفوظة. ابدأ محادثة جديدة وهتظهر هنا.</TextLabel>}
                  {conversationsReady && conversations.length > 0 && filteredConversations.length === 0 && <TextLabel fontsReady={fontsReady} style={styles.chatWelcome}>مفيش محادثات مطابقة للبحث ده.</TextLabel>}
                  {filteredConversations.map((conversation) => {
                    const assistant = assistants.find((item) => item.id === conversation.assistantId);
                    const preview = [...conversation.messages].reverse().find((item) => item.role === "user")?.content ?? "";
                    const isRenaming = renamingConversationId === conversation.id;
                    return <View key={conversation.id} style={styles.historyCard}>
                      <Pressable accessibilityRole="button" onPress={() => openConversation(conversation)} style={styles.historyOpen}>
                        <TextLabel fontsReady={fontsReady} style={styles.historyTitle}>{conversation.title}</TextLabel>
                        <TextLabel fontsReady={fontsReady} style={styles.historyMeta}>{assistant?.name.ar || conversation.assistantId} · {conversation.messages.length} رسالة</TextLabel>
                        {!!preview && <TextLabel fontsReady={fontsReady} style={styles.historyPreview} numberOfLines={2}>{preview}</TextLabel>}
                      </Pressable>
                      {isRenaming ? <View style={styles.renameRow}>
                        <TextInput value={renameDraft} onChangeText={setRenameDraft} placeholder="اسم المحادثة" placeholderTextColor={colors.textMuted} style={styles.renameInput} maxLength={54} />
                        <Pressable onPress={() => { const title = renameDraft.trim(); if (title) setConversations((items) => items.map((item) => item.id === conversation.id ? { ...item, title } : item)); setRenamingConversationId(null); }} style={styles.historyAction}><TextLabel fontsReady={fontsReady} style={styles.historyActionText}>حفظ</TextLabel></Pressable>
                      </View> : <View style={styles.historyActions}>
                        <Pressable onPress={() => { setRenamingConversationId(conversation.id); setRenameDraft(conversation.title); }} style={styles.historyAction}><TextLabel fontsReady={fontsReady} style={styles.historyActionText}>تعديل الاسم</TextLabel></Pressable>
                        <Pressable onPress={() => { void shareConversation(conversation); }} style={styles.historyAction}><TextLabel fontsReady={fontsReady} style={styles.historyActionText}>مشاركة</TextLabel></Pressable>
                        <Pressable onPress={() => deleteConversation(conversation.id)} style={styles.historyAction}><TextLabel fontsReady={fontsReady} style={styles.historyDeleteText}>حذف</TextLabel></Pressable>
                      </View>}
                    </View>;
                  })}
                </View>
              ) : <>
                <View style={styles.conversation}>
                  {chatMessages.length === 0 && <View style={styles.chatStarter}><TextLabel fontsReady={fontsReady} style={styles.chatWelcome}>ابدأ محادثتك مع {assistants.find((item) => item.id === selectedAssistantId)?.name.ar || "VRRON General"}</TextLabel><View style={styles.suggestionList}>{["ساعدني أبدأ", "اشرح لي فكرة ببساطة", "اقترح عليّ خطة"].map((suggestion) => <Pressable key={suggestion} onPress={() => setChatInput(suggestion)} style={styles.suggestionChip}><TextLabel fontsReady={fontsReady} style={styles.suggestionText}>{suggestion}</TextLabel></Pressable>)}</View></View>}
                  {chatMessages.map((message, index) => <View key={index} style={[styles.messageBubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}><TextLabel fontsReady={fontsReady} style={styles.messageText}>{message.content}</TextLabel>{message.role === "assistant" && <View style={styles.replyActions}><Pressable accessibilityRole="button" accessibilityLabel="الرد مفيد" accessibilityState={{ selected: message.feedback === "helpful" }} onPress={() => rateAssistantReply(index, "helpful")} style={styles.replyShareButton}><TextLabel fontsReady={fontsReady} style={[styles.replyShareText, message.feedback === "helpful" && styles.replyFeedbackSelected]}>👍</TextLabel></Pressable><Pressable accessibilityRole="button" accessibilityLabel="الرد غير مفيد" accessibilityState={{ selected: message.feedback === "unhelpful" }} onPress={() => rateAssistantReply(index, "unhelpful")} style={styles.replyShareButton}><TextLabel fontsReady={fontsReady} style={[styles.replyShareText, message.feedback === "unhelpful" && styles.replyFeedbackSelected]}>👎</TextLabel></Pressable><Pressable accessibilityRole="button" accessibilityLabel="مشاركة رد المساعد" onPress={() => { void shareAssistantReply(message.content); }} style={styles.replyShareButton}><TextLabel fontsReady={fontsReady} style={styles.replyShareText}>مشاركة الرد ↗</TextLabel></Pressable></View>}</View>)}
                  {chatBusy && <TextLabel fontsReady={fontsReady} style={styles.chatLoading}>VRRON يفكر…</TextLabel>}
                  {!!chatError && <View style={styles.chatErrorBox}><TextLabel fontsReady={fontsReady} style={styles.chatError}>{chatError}</TextLabel><Pressable accessibilityRole="button" accessibilityLabel="إعادة إرسال آخر رسالة" onPress={() => { void sendChatMessage(true); }} disabled={chatBusy} style={styles.retryButton}><TextLabel fontsReady={fontsReady} style={styles.retryText}>إعادة المحاولة ↻</TextLabel></Pressable></View>}
                </View>
                <View style={styles.composerPreview}>
                  <TextInput value={chatInput} onChangeText={setChatInput} placeholder="اكتب رسالتك هنا…" placeholderTextColor={colors.textMuted} multiline style={styles.chatInput} editable={!chatBusy} />
                  <Pressable accessibilityRole="button" accessibilityLabel="إرسال الرسالة" onPress={() => { void sendChatMessage(); }} disabled={chatBusy || !chatInput.trim() || !apiBase || !conversationsReady} style={({ pressed }) => [styles.sendButton, (chatBusy || !chatInput.trim() || !apiBase || !conversationsReady) && styles.sendButtonDisabled, pressed && styles.pressed]}><Text style={styles.sendSymbol}>↑</Text></Pressable>
                </View>
              </>}
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
                <SettingRow fontsReady={fontsReady} title="حالة VRRON Core" value={registryStatus === "ready" ? "متصل" : registryStatus === "loading" ? "جارٍ الاتصال…" : "غير متصل"} />
                <SettingRow fontsReady={fontsReady} title="المحادثات المحفوظة" value={String(conversations.length)} />
                <SettingRow fontsReady={fontsReady} title="إصدار التطبيق" value="0.1.0 · تأسيسي" last />
              </View>
              <View style={styles.settingsFavorites}>
                <View style={styles.sectionHeading}>
                  <TextLabel fontsReady={fontsReady} style={styles.sectionTitle}>المساعدون المفضّلون</TextLabel>
                  <TextLabel fontsReady={fontsReady} style={styles.sectionHint}>اختار المساعدين اللي تحب توصل لهم بسرعة</TextLabel>
                </View>
                {assistants.length === 0 && <TextLabel fontsReady={fontsReady} style={styles.settingsNote}>قائمة المساعدين هتظهر بعد الاتصال بالـCore.</TextLabel>}
                {assistants.length > 0 && favoriteAssistants.length === 0 && <TextLabel fontsReady={fontsReady} style={styles.settingsNote}>لسه مفيش مساعد مفضّل. اضغط على النجمة بجانب أي مساعد هنا.</TextLabel>}
                {assistants.map((assistant) => {
                  const favorite = favoriteAssistantIds.includes(assistant.id);
                  return <View key={assistant.id} style={styles.favoriteRow}>
                    <View style={styles.infoText}>
                      <TextLabel fontsReady={fontsReady} style={styles.infoTitle}>{assistant.name.ar || assistant.name.en}</TextLabel>
                      <TextLabel fontsReady={fontsReady} style={styles.infoBody}>{assistant.description.ar || assistant.description.en}</TextLabel>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={favorite ? "إزالة من المفضّلين" : "إضافة للمفضّلين"} accessibilityState={{ selected: favorite }} onPress={() => toggleFavoriteAssistant(assistant.id)} style={styles.favoriteButton}>
                      <Text style={[styles.favoriteSymbol, favorite && styles.favoriteSymbolSelected]}>{favorite ? "★" : "☆"}</Text>
                    </Pressable>
                  </View>;
                })}
              </View>
              <TextLabel fontsReady={fontsReady} style={styles.settingsNote}>المفضّلون وسجل المحادثات محفوظين على الجهاز، من غير حساب أو مزامنة سحابية حاليًا.</TextLabel>
              <TextLabel fontsReady={fontsReady} style={styles.settingsNote}>
                تقدر تغيّر المفضّلين في أي وقت، وسجلّك بيظل محفوظ على نفس الجهاز.
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
  chatErrorBox: { gap: 8, alignItems: "flex-start" },
  retryButton: { borderWidth: 1, borderColor: colors.violetLight, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  retryText: { color: colors.violetLight, fontSize: fontSize.caption, fontFamily: fontFamily.semiBold },
  assistantRowSelected: { borderColor: colors.violetLight, backgroundColor: colors.surfaceRaised },
  assistantSelectMark: { color: colors.violetLight, fontSize: 18, paddingHorizontal: 4 },
  chatTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  chatHeaderActions: { flexDirection: "row", gap: spacing.xs },
  historyList: { gap: spacing.md },
  historySearch: { color: colors.textPrimary, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, textAlign: "right" },
  historyCard: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, gap: spacing.sm },
  historyOpen: { gap: 5 },
  historyTitle: { color: colors.textPrimary, fontSize: fontSize.body, fontFamily: fontFamily.semiBold },
  historyMeta: { color: colors.violetLight, fontSize: fontSize.caption },
  historyPreview: { color: colors.textSecondary, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body - 2 },
  historyActions: { flexDirection: "row", justifyContent: "flex-start", gap: spacing.sm },
  renameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  renameInput: { flex: 1, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  historyAction: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm },
  historyActionText: { color: colors.violetLight, fontSize: fontSize.caption },
  historyDeleteText: { color: "#FCA5A5", fontSize: fontSize.caption },
  clearChatButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7 },
  clearChatText: { color: colors.violetLight, fontSize: fontSize.caption },
  chatStarter: { gap: spacing.sm },
  suggestionList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  suggestionChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  suggestionText: { color: colors.textSecondary, fontSize: fontSize.caption },
  assistantRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  assistantBadge: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124, 58, 237, 0.18)" },
  assistantBadgeBlue: { backgroundColor: "rgba(59, 130, 246, 0.18)" },
  assistantBadgeSymbol: { color: colors.violetLight, fontSize: 22 },
  registryOrb: { width: 82, height: 82, alignItems: "center", justifyContent: "center" },
  registrySymbol: { position: "absolute", color: colors.blueLight, fontSize: 30 },
  registryTitle: { color: colors.textPrimary, fontSize: fontSize.body, fontFamily: fontFamily.semiBold, textAlign: "center" },
  registryBody: { color: colors.textSecondary, fontSize: fontSize.caption + 1, lineHeight: lineHeight.body, textAlign: "center" },
  conversation: { gap: spacing.md, paddingVertical: spacing.md },
  chatWelcome: { color: colors.textSecondary, fontSize: fontSize.body, lineHeight: lineHeight.body, textAlign: "center", paddingVertical: spacing.xl },
  messageBubble: { maxWidth: "92%", padding: spacing.md, borderRadius: radius.md },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(124, 58, 237, 0.2)", borderColor: "#514078", borderWidth: 1 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
  messageText: { color: colors.textPrimary, fontSize: fontSize.body, lineHeight: lineHeight.body },
  replyActions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },\n  replyShareButton: { alignSelf: "flex-start", marginTop: spacing.sm, paddingVertical: 3, paddingHorizontal: spacing.xs },\n  replyFeedbackSelected: { color: "#FBBF24" },
  replyShareText: { color: colors.violetLight, fontSize: fontSize.caption },
  chatLoading: { color: colors.violetLight, fontSize: fontSize.caption },
  chatError: { color: "#FCA5A5", fontSize: fontSize.caption, lineHeight: lineHeight.body },
  chatInput: { flex: 1, minHeight: 44, maxHeight: 110, color: colors.textPrimary, fontSize: fontSize.body, paddingVertical: spacing.sm },
  sendButton: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.violet },
  sendButtonDisabled: { opacity: 0.4 },
  composerPreview: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
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
  settingsFavorites: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  favoriteRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  favoriteButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  favoriteSymbol: { color: colors.textMuted, fontSize: 25 },
  favoriteSymbolSelected: { color: "#FBBF24" },
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
