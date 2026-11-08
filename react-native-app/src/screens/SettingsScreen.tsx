/**
 * SettingsScreen — configure API endpoint and credentials.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translatorApi } from '../services/TranslatorApi';
import { colors, spacing } from '../theme';

const SETTINGS_KEY = '@darija_settings';

export default function SettingsScreen() {
  const [apiUrl,    setApiUrl]    = useState('http://localhost:8080/api/translate');
  const [username,  setUsername]  = useState('user');
  const [password,  setPassword]  = useState('user123');
  const [showPass,  setShowPass]  = useState(false);
  const [testing,   setTesting]   = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json) {
        const s = JSON.parse(json);
        setApiUrl(s.apiUrl ?? apiUrl);
        setUsername(s.username ?? username);
        setPassword(s.password ?? password);
        translatorApi.configure({ baseUrl: s.apiUrl, username: s.username, password: s.password });
      }
    } catch { /* no-op */ }
  };

  const saveSettings = async () => {
    const settings = { apiUrl: apiUrl.trim(), username: username.trim(), password };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    translatorApi.configure({ baseUrl: settings.apiUrl, username: settings.username, password: settings.password });
    Alert.alert('Saved', 'Settings have been updated.');
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      translatorApi.configure({ baseUrl: apiUrl.trim(), username: username.trim(), password });
      const health = await translatorApi.healthCheck();
      Alert.alert('Connection OK ✅', `Service status: ${health.status}`);
    } catch (e: any) {
      Alert.alert('Connection Failed ❌', e.message ?? 'Could not reach the server.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>

        <View style={styles.field}>
          <Text style={styles.label}>API URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://localhost:8080/api/translate"
            autoCapitalize="none"
            keyboardType="url"
            accessibilityLabel="API URL"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            accessibilityLabel="Username"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoComplete="password"
              accessibilityLabel="Password"
            />
            <Switch
              value={showPass}
              onValueChange={setShowPass}
              style={{ marginLeft: 8 }}
              accessibilityLabel="Show password"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.testBtn} onPress={testConnection} disabled={testing}>
        <Text style={styles.testBtnText}>{testing ? '⏳ Testing…' : '🔌 Test Connection'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveBtnText}>💾 Save Settings</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About</Text>
        <Text style={styles.infoText}>
          This app connects to the LLM-Powered Darija Translator REST service,
          implemented with Jakarta RESTful Web Services (Quarkus) and secured with
          HTTP Basic Authentication (Jakarta Security).
        </Text>
        <Text style={styles.infoText}>
          The service uses Google Gemini LLM to translate text into
          Moroccan Arabic Dialect (Darija).
        </Text>
        <Text style={[styles.infoText, { marginTop: 8, fontWeight: '700' }]}>
          Default credentials:
        </Text>
        <Text style={styles.infoText}>• user / user123</Text>
        <Text style={styles.infoText}>• admin / admin123</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { padding: spacing.md, paddingBottom: 40 },
  section:     { backgroundColor: '#fff', borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: .07, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  field:       { marginBottom: spacing.sm },
  label:       { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:       { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, fontFamily: 'System', color: colors.text, backgroundColor: '#fafafa' },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  testBtn:     { borderWidth: 2, borderColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: spacing.sm },
  testBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  saveBtn:     { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox:     { backgroundColor: '#f0fff4', borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: '#c8e6c9' },
  infoTitle:   { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  infoText:    { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 2 },
});
