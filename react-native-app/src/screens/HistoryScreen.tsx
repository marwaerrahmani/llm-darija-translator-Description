/**
 * HistoryScreen — displays past translations stored in AsyncStorage.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { HistoryEntry } from './TranslateScreen';
import { colors, spacing } from '../theme';

const HISTORY_KEY = '@darija_history';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const json = await AsyncStorage.getItem(HISTORY_KEY);
      setHistory(json ? JSON.parse(json) : []);
    } catch {
      setHistory([]);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all translation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(HISTORY_KEY);
            setHistory([]);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View style={styles.card}>
      <Text style={styles.original} numberOfLines={2}>{item.original}</Text>
      <Text style={styles.translated}>{item.translated}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{item.sourceLanguage} → Darija</Text>
        <Text style={styles.metaText}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
          <Text style={styles.clearBtnText}>🗑️ Clear History</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No translations yet.</Text>
            <Text style={styles.emptySubtext}>Your translation history will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list:      { padding: spacing.md },
  clearBtn:  { margin: spacing.md, marginBottom: 0, alignSelf: 'flex-end' },
  clearBtnText: { color: colors.error, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: .07, shadowRadius: 4, elevation: 2,
  },
  original:   { fontSize: 13, color: colors.muted, marginBottom: 6 },
  translated: { fontSize: 17, color: colors.text, textAlign: 'right', marginBottom: 8, lineHeight: 26 },
  meta:       { flexDirection: 'row', justifyContent: 'space-between' },
  metaText:   { fontSize: 11, color: colors.muted },
  empty:      { alignItems: 'center', paddingTop: 80 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: 13, color: colors.muted, marginTop: 4 },
});
