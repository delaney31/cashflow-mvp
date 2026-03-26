import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '@cashflow/ui';
import { Ionicons } from '@expo/vector-icons';
import type { AiCoachRequest, AiExplanationResponse } from '../api/types';
import { ApiError, executeAiCoachRequest } from '../api/http';
import { useApiConfig } from '../api/ApiContext';
import { AiStructuredCard } from '../components/ai/AiStructuredCard';
import { ScreenShell } from '../components/ScreenShell';
import { useAppTheme } from '../theme/ThemeContext';
import { radii, spacing, typography } from '../theme/theme';
import { requestFromStarter, requestFromUserMessage } from '../utils/aiCoachRouter';

const STARTERS: { id: 'afford_this' | 'over_budget' | 'car' | 'safe_spend'; label: string }[] = [
  { id: 'afford_this', label: 'Can I afford this?' },
  { id: 'over_budget', label: 'Why am I over budget?' },
  { id: 'car', label: 'What happens if I buy this car?' },
  { id: 'safe_spend', label: 'How much can I safely spend this week?' },
];

const WELCOME =
  "I'm your cash-flow coach. I only use numbers from your linked data and the same budget engine as the app—I won't invent balances. Pick a prompt or type a question; include a dollar amount when asking if you can afford something.";

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  userText?: string;
  ai?: AiExplanationResponse;
  error?: string;
};

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function AiCoachScreen() {
  const { colors } = useAppTheme();
  const { token } = useApiConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastRequestRef = useRef<AiCoachRequest | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  const runRequest = useCallback(
    async (req: AiCoachRequest) => {
      if (!token) return;
      lastRequestRef.current = req;
      setSending(true);
      try {
        const ai = await executeAiCoachRequest(token, req);
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', ai }]);
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? `${e.message}${e.body ? ` — ${e.body.slice(0, 200)}` : ''}`
            : e instanceof Error
              ? e.message
              : 'Something went wrong';
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', error: msg }]);
      } finally {
        setSending(false);
      }
    },
    [token],
  );

  const onSendText = useCallback(async () => {
    const text = input.trim();
    if (!text || !token || sending) return;
    setInput('');
    setMessages((m) => [...m, { id: nextId(), role: 'user', userText: text }]);
    const req = requestFromUserMessage(text);
    await runRequest(req);
  }, [input, token, sending, runRequest]);

  const onStarter = useCallback(
    async (id: (typeof STARTERS)[number]['id'], label: string) => {
      if (!token || sending) return;
      setMessages((m) => [...m, { id: nextId(), role: 'user', userText: label }]);
      const req = requestFromStarter(id);
      await runRequest(req);
    },
    [token, sending, runRequest],
  );

  const onRetry = useCallback(() => {
    const req = lastRequestRef.current;
    if (!req || !token || sending) return;
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last?.role === 'assistant' && last.error) return m.slice(0, -1);
      return m;
    });
    queueMicrotask(() => void runRequest(req));
  }, [token, sending, runRequest]);

  if (!token) {
    return (
      <ScreenShell title="AI Coach" subtitle="Disciplined answers from your real numbers">
        <AppText style={{ color: colors.textSecondary }}>
          Set EXPO_PUBLIC_API_TOKEN to use the coach.
        </AppText>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="AI Coach" subtitle="Disciplined answers from your real numbers" scroll={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {messages.length === 0 ? (
            <View style={[styles.welcome, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{WELCOME}</AppText>
            </View>
          ) : null}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.msgWrap,
                msg.role === 'user' ? styles.msgWrapUser : styles.msgWrapAssistant,
              ]}
            >
              {msg.role === 'user' && msg.userText ? (
                <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
                  <AppText style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>{msg.userText}</AppText>
                </View>
              ) : null}
              {msg.role === 'assistant' && msg.ai ? (
                <View style={{ maxWidth: '100%' }}>
                  <AiStructuredCard structured={msg.ai.structured} />
                  <AppText style={[styles.disclaimer, { color: colors.textSecondary }]}>{msg.ai.disclaimer}</AppText>
                  <AppText style={[styles.modelLine, { color: colors.textSecondary }]}>
                    Model: {msg.ai.model}
                  </AppText>
                </View>
              ) : null}
              {msg.role === 'assistant' && msg.error ? (
                <View style={[styles.errorBox, { borderColor: colors.danger, backgroundColor: colors.surface }]}>
                  <AppText style={{ color: colors.danger, marginBottom: spacing.sm }}>{msg.error}</AppText>
                  <Pressable onPress={onRetry} style={styles.retryBtn}>
                    <AppText style={{ color: colors.primary, fontWeight: '600' }}>Retry</AppText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}

          {sending ? (
            <View style={[styles.typing, { backgroundColor: colors.surfaceMuted }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText style={{ color: colors.textSecondary, marginLeft: 10, fontSize: 14 }}>
                Checking your data…
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.starters, { borderTopColor: colors.tabBarBorder }]}>
          <AppText style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Starter prompts</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starterScroll}>
            {STARTERS.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => void onStarter(s.id, s.label)}
                disabled={sending}
                style={[
                  styles.starterChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    opacity: sending ? 0.5 : 1,
                  },
                ]}
              >
                <AppText style={{ color: colors.text, fontSize: 13 }} numberOfLines={2}>
                  {s.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputRow, { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about spending, caps, or a purchase…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            editable={!sending}
            onSubmitEditing={() => void onSendText()}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => void onSendText()}
            disabled={sending || !input.trim()}
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending || !input.trim() ? 0.4 : 1 }]}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  welcome: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  msgWrap: {
    marginBottom: spacing.md,
    maxWidth: '100%',
  },
  msgWrapUser: {
    alignItems: 'flex-end',
  },
  msgWrapAssistant: {
    alignItems: 'stretch',
  },
  userBubble: {
    maxWidth: '92%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  modelLine: {
    fontSize: 11,
    marginTop: 4,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    maxWidth: '100%',
  },
  retryBtn: {
    alignSelf: 'flex-start',
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  starters: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  starterScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  starterChip: {
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
