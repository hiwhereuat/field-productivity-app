import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, Image } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { TaskStatus } from '../types/task';
import { cancelNotification } from '../services/notificationService';
import { addDeletedTaskInfo } from '../services/taskStorage';

const statusFlow: Record<TaskStatus, TaskStatus[]> = {
  New: ['InProgress', 'Cancelled'],
  InProgress: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TaskDetailScreen = ({ route, navigation }: any) => {
  const { state, dispatch, addLogEntry } = useTasks();
  const { theme } = useTheme();
  const task = state.tasks.find(t => t.id === route.params.taskId);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.error }}>Task not found</Text>
      </View>
    );
  }

  const taskHistory = state.globalHistory.filter(h => h.taskId === task.id);

  const changeStatus = (newStatus: TaskStatus) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { ...task, status: newStatus, updatedAt: new Date().toISOString() },
    });
    addLogEntry(
      'STATUS_CHANGE',
      `Status changed from ${task.status} to ${newStatus}`,
      task.id,
      task.title
    );
  };

  const deleteTask = () => {
    Alert.alert('Delete task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (task.notificationId) {
            await cancelNotification(task.notificationId);
          }
          await addDeletedTaskInfo({ taskId: task.id, remoteId: task.remoteId });
          addLogEntry('DELETE', `Task "${task.title}" deleted`, task.id, task.title);
          dispatch({ type: 'DELETE_TASK', payload: task.id });
          navigation.goBack();
        },
      },
    ]);
  };

  const nextStatuses = statusFlow[task.status] || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Task Details</Text>
      <Text style={[styles.detailText, { color: theme.text }]}>Title: {task.title}</Text>
      <Text style={[styles.detailText, { color: theme.text }]}>Description: {task.description}</Text>
      <Text style={[styles.detailText, { color: theme.text }]}>Due: {formatDateTime(task.dueDate)}</Text>
      <Text style={[styles.detailText, { color: theme.text }]}>Address: {task.address}</Text>
      {task.latitude != null && (
        <Text style={[styles.detailText, { color: theme.text }]}>
          Coordinates: {task.latitude}, {task.longitude}
        </Text>
      )}
      <Text style={[styles.statusText, { color: theme.primary }]}>
        Status: {task.status}
      </Text>

      <View style={styles.statusButtons}>
        {nextStatuses.map(status => (
          <Button key={status} title={status} onPress={() => changeStatus(status)} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Edit" onPress={() => navigation.navigate('TaskForm', { taskId: task.id })} />
        <Button title="Delete" color={theme.error} onPress={deleteTask} />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Attachments</Text>
      {task.attachments.length === 0 ? (
        <Text style={[styles.detailText, { color: theme.text }]}>No attachments</Text>
      ) : (
        task.attachments.map(att => (
          <View key={att.id} style={styles.attachmentItem}>
            <Image source={{ uri: att.uri }} style={styles.image} />
            <Text style={[styles.detailText, { color: theme.text, marginTop: 4 }]}>{att.name}</Text>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>History</Text>
      {taskHistory.length === 0 ? (
        <Text style={[styles.detailText, { color: theme.text }]}>No history entries</Text>
      ) : (
        taskHistory
          .slice()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map(item => (
            <View key={item.id} style={[styles.historyItem, { borderLeftColor: theme.primary }]}>
              <Text style={[styles.historyAction, { color: theme.primary }]}>{item.action}</Text>
              <Text style={[styles.historyDesc, { color: theme.text }]}>{item.description}</Text>
              <Text style={[styles.historyTime, { color: theme.text }]}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  detailText: { fontSize: 16, marginBottom: 4 },
  statusText: { fontWeight: 'bold', fontSize: 16, marginVertical: 8 },
  statusButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  historyItem: {
    padding: 8,
    marginVertical: 4,
    borderLeftWidth: 3,
    paddingLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  historyAction: { fontWeight: 'bold' },
  historyDesc: { fontSize: 14 },
  historyTime: { fontSize: 12 },
  attachmentItem: { marginBottom: 16 },
  image: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
});

export default TaskDetailScreen;