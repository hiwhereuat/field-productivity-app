import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

const HistoryScreen = () => {
  const { state } = useTasks();
  const { theme } = useTheme();

  const sortedHistory = [...state.globalHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {sortedHistory.length === 0 ? (
        <Text style={[styles.empty, { color: theme.text }]}>No history yet</Text>
      ) : (
        <FlatList
          data={sortedHistory}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.taskTitle}</Text>
              <Text style={{ color: theme.primary }}>{item.action}</Text>
              <Text style={{ color: theme.text }}>{item.description}</Text>
              <Text style={{ color: theme.text, fontSize: 12 }}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  item: { padding: 12, marginBottom: 8, borderRadius: 8, borderWidth: 1 },
});

export default HistoryScreen;