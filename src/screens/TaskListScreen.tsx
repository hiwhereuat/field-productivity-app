import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

const TaskListScreen = ({ navigation }: any) => {
  const { state, dispatch } = useTasks();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.sortRow}>
        <Button title="Date added" onPress={() => dispatch({ type: 'SET_SORT', payload: 'createdAt' })} />
        <Button title="Due date" onPress={() => dispatch({ type: 'SET_SORT', payload: 'dueDate' })} />
        <Button title="Status" onPress={() => dispatch({ type: 'SET_SORT', payload: 'status' })} />
      </View>

      {state.tasks.length === 0 ? (
        <Text style={[styles.empty, { color: theme.text }]}>No tasks yet</Text>
      ) : (
        <FlatList
          data={state.tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            >
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.text }}>Due: {new Date(item.dueDate).toLocaleString()}</Text>
              <Text style={{ color: theme.text }} numberOfLines={1}>{item.address}</Text>
              <Text style={{ color: theme.primary }}>{item.status}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('TaskForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sortRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  item: { padding: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1 },
  title: { fontWeight: 'bold', marginBottom: 4 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
});

export default TaskListScreen;