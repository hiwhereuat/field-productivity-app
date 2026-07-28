import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { requestPermissions, scheduleDemoNotification } from '../services/notificationService';

const SettingsScreen = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { state } = useTasks();

  const triggerDemo = async () => {
    if (state.tasks.length === 0) {
      Alert.alert('No tasks', 'Create a task first for demo.');
      return;
    }
    const granted = await requestPermissions();
    if (granted) {
      const task = state.tasks[0];
      await scheduleDemoNotification(task.id, task.title);
      Alert.alert('Demo scheduled', 'Notification will appear in 30 seconds.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Candidate Code: SA-RN-1234</Text>
      <Button title={`Theme: ${isDark ? 'Dark' : 'Light'}`} onPress={toggleTheme} />
      <View style={{ marginTop: 20 }}>
        <Button title="Test Notification (30s)" onPress={triggerDemo} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  text: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
});

export default SettingsScreen;