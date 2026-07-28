import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEntry } from '../types/task';

const GLOBAL_HISTORY_KEY = '@global_history';

export async function getGlobalHistory(): Promise<HistoryEntry[]> {
  const json = await AsyncStorage.getItem(GLOBAL_HISTORY_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveGlobalHistory(history: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(history));
}