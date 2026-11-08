/**
 * TranslateScreen — main translation UI.
 *
 * Features:
 *  - Text input with character counter
 *  - Language selector (source)
 *  - Translate button (calls REST API with Basic Auth)
 *  - Display result in Arabic RTL text
 *  - Copy to clipboard
 *  - Text-to-speech read-aloud (expo-speech)
 *  - Translation history (AsyncStorage)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView, Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translatorApi, TranslationResponse } from '../services/TranslatorApi';
import { colors, spacing, typography } from '../theme';

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Arabic (Modern Standard)',
  'German', 'Italian', 'Portuguese',
];

const HISTORY_KEY = '@darija_history';
const MAX_CHARS = 5000;
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  original: string;
  translated: string;
  sourceLanguage: string;
  model: string;
  timestamp: number;
}

export default function TranslateScreen() {
  const [inputText, setInputText]         = useState('');
  const [sourceLang, setSourceLang]       = useState('English');
  const [result, setResult]               = useState<TranslationResponse | null>(null);
  const [loading, setLoading]             = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      Alert.alert('Input required', 'Please enter text to translate.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await translatorApi.translate({
        text: inputText,
        sourceLanguage: sourceLang,
      });
      setResult(response);

      // Animate result in
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();

      // Save to history
      await saveToHistory({
        id:             Date.now().toString(),
        original:       inputText,
        translated:     response.translatedText,
        sourceLanguage: sourceLang,
        model:          response.model,
        timestamp:      response.timestamp,
      });

    } catch (err: any) {
      Alert.alert('Translation Error', err.message ?? 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [inputText, sourceLang, fadeAnim]);

  const handleCopy = useCallback(async () => {
    if (!result?.translatedText) return;
    await Clipboard.setStringAsync(result.translatedText);
    Alert.alert('Copied!', 'Translation copied to clipboard.');
  }, [result]);

  const handleSpeak = useCallback(async () => {
    if (!result?.translatedText) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(result.translatedText, {
      language: 'ar',
      rate:     0.9,
      onDone:   () => setIsSpeaking(false),
      onError:  () => setIsSpeaking(false),
    });
  }, [result, isSpeaking]);

  const handleClear = useCallback(() => {
    setInputText('');
    setResult(null);
    fadeAnim.setValue(0);
    Speech.stop();
    setIsSpeaking(false);
  }, [fadeAnim]);

  const saveToHistory = async (entry: HistoryEntry) => {
    try {
      const json = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryEntry[] = json ? JSON.parse(json) : [];
      history.unshift(entry);
      if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* non-fatal */
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Language Row ──────────────────────────────────────────────── */}
        <View style={styles.langRow}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setShowLangPicker(!showLangPicker)}
            accessibilityLabel="Select source language"
          >
            <Text style={styles.langBtnText}>{sourceLang}</Text>
            <Text style={styles.langArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.langArrowMain}>→</Text>
          <View style={[styles.langBtn, styles.langBtnTarget]}>
            <Text style={[styles.langBtnText, { color: colors.accent }]}>Darija 🇲🇦</Text>
          </View>
        </View>

        {/* ── Language Picker Dropdown ───────────────────────────────────── */}
        {showLangPicker && (
          <View style={styles.langPicker}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, sourceLang === lang && styles.langOptionSelected]}
                onPress={() => { setSourceLang(lang); setShowLangPicker(false); }}
              >
                <Text style={[styles.langOptionText, sourceLang === lang && { color: colors.primary }]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Input Box ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            multiline
            value={inputText}
            onChangeText={(t) => setInputText(t.slice(0, MAX_CHARS))}
            placeholder="Enter text to translate…"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
            accessibilityLabel="Text to translate"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{inputText.length} / {MAX_CHARS}</Text>
            <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear input">
              <Text style={styles.clearBtn}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Translate Button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.translateBtn, loading && styles.translateBtnDisabled]}
          onPress={handleTranslate}
          disabled={loading}
          accessibilityLabel="Translate"
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.translateBtnText}>Translate →</Text>
          }
        </TouchableOpacity>

        {/* ── Result Box ────────────────────────────────────────────────── */}
        {result && (
          <Animated.View style={[styles.card, styles.resultCard, { opacity: fadeAnim }]}>
            <Text style={styles.resultLabel}>Translation (Darija)</Text>
            <Text style={styles.resultText} accessibilityLanguage="ar">
              {result.translatedText}
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Text style={styles.actionBtnText}>📋 Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleSpeak}>
                <Text style={styles.actionBtnText}>{isSpeaking ? '⏹ Stop' : '🔊 Read'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.metaText}>Model: {result.model}</Text>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: spacing.md, paddingBottom: spacing.xl },
  langRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e8f5e9', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#c8e6c9',
  },
  langBtnTarget: { backgroundColor: '#fff3e0', borderColor: '#ffcc80' },
  langBtnText:   { fontSize: 13, fontWeight: '600', color: colors.primary },
  langArrow:     { fontSize: 10, marginLeft: 6, color: colors.muted },
  langArrowMain: { fontSize: 20, color: colors.muted },
  langPicker: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .1, shadowRadius: 4, elevation: 3,
  },
  langOption:         { paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  langOptionSelected: { backgroundColor: '#f0fff4' },
  langOptionText:     { fontSize: 14, color: colors.text },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .08, shadowRadius: 6, elevation: 2,
    marginBottom: spacing.sm,
  },
  input:        { fontSize: 15, color: colors.text, minHeight: 120, lineHeight: 22 },
  inputFooter:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  charCount:    { fontSize: 12, color: colors.muted },
  clearBtn:     { fontSize: 12, color: colors.muted, fontWeight: '600' },
  translateBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginBottom: spacing.sm,
  },
  translateBtnDisabled: { backgroundColor: '#aaa' },
  translateBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard:    { borderLeftWidth: 4, borderLeftColor: colors.primary },
  resultLabel:   { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  resultText:    { fontSize: 20, lineHeight: 32, color: colors.text, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif', marginBottom: 12 },
  resultActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionBtn:     { flex: 1, backgroundColor: '#f0f4f8', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  metaText:      { fontSize: 11, color: colors.muted },
});
