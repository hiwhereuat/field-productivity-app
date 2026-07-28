import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

const TaskDetailScreen = ({ route, navigation }: any) => {
  const { state, dispatch } = useTasks();
  const { theme } = useTheme();
  const task = state.tasks.find(t => t.id === route.params.taskId);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.error }}>Task not found</Text>
      </View>
    );
  }

  const deleteTask = () => {
    Alert.alert('Delete task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'DELETE_TASK', payload: task.id });
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>
      <Text style={{ color: theme.text }}>{task.description}</Text>
      <Text style={{ color: theme.text }}>Due: {new Date(task.dueDate).toLocaleString()}</Text>
      <Text style={{ color: theme.text }}>Address: {task.address}</Text>
      {task.latitude != null && (
        <Text style={{ color: theme.text }}>
          Coordinates: {task.latitude}, {task.longitude}
        </Text>
      )}
      <Text style={{ color: theme.primary, marginVertical: 8 }}>Status: {task.status}</Text>

      <View style={styles.actions}>
        <Button title="Edit" onPress={() => navigation.navigate('TaskForm', { taskId: task.id })} />
        <Button title="Delete" color={theme.error} onPress={deleteTask} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});

export default TaskDetailScreen;