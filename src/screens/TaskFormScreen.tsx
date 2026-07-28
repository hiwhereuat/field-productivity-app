import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ScrollView, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { validateTask } from '../utils/validation';
import { Task, TaskStatus } from '../types/task';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const TaskFormScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { dispatch, state, addLogEntry } = useTasks();
  const taskId = route.params?.taskId;
  const existingTask = taskId ? state.tasks.find(t => t.id === taskId) : null;

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [dueDate, setDueDate] = useState<Date>(
    existingTask?.dueDate ? new Date(existingTask.dueDate) : new Date()
  );
  const [address, setAddress] = useState(existingTask?.address ?? '');
  const [latitude, setLatitude] = useState(existingTask?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(existingTask?.longitude?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePickerIOS, setShowDatePickerIOS] = useState(false);

  const openDatePickerAndroid = () => {
    DateTimePickerAndroid.open({
      value: dueDate,
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed') return;
        if (selectedDate) {
          const currentDate = selectedDate;
          DateTimePickerAndroid.open({
            value: dueDate,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type === 'dismissed') return;
              if (selectedTime) {
                const combined = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  currentDate.getDate(),
                  selectedTime.getHours(),
                  selectedTime.getMinutes()
                );
                setDueDate(combined);
              }
            },
          });
        }
      },
    });
  };

  const handleSave = () => {
    if (typeof dispatch !== 'function') {
      console.warn('dispatch is not a function');
      return;
    }

    const validDueDate = dueDate instanceof Date && !isNaN(dueDate.getTime())
      ? dueDate : new Date();
    const taskData = {
      title,
      description,
      dueDate: validDueDate.toISOString(),
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };

    const validationErrors = validateTask(taskData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (existingTask) {
        const updated: Task = {
          ...existingTask,
          title: title.trim(),
          description: description.trim(),
          dueDate: taskData.dueDate,
          address: address.trim(),
          latitude: taskData.latitude,
          longitude: taskData.longitude,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_TASK', payload: updated });
        addLogEntry('EDIT', 'Task details updated', updated.id, updated.title);
      } else {
        const now = new Date().toISOString();
        const newTask: Task = {
          id: generateId(),
          title: title.trim(),
          description: description.trim(),
          dueDate: taskData.dueDate,
          address: address.trim(),
          latitude: taskData.latitude,
          longitude: taskData.longitude,
          status: 'New' as TaskStatus,
          attachments: [],
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
        };
        dispatch({ type: 'ADD_TASK', payload: newTask });
        addLogEntry('CREATE', 'Task created', newTask.id, newTask.title);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        value={title} onChangeText={setTitle} placeholder="Task title"
        placeholderTextColor={theme.border}
      />
      {errors.title && <Text style={{ color: theme.error }}>{errors.title}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        value={description} onChangeText={setDescription} placeholder="Task description"
        multiline placeholderTextColor={theme.border}
      />
      {errors.description && <Text style={{ color: theme.error }}>{errors.description}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Due date & time *</Text>
      <Button title={dueDate.toLocaleString()} onPress={() => {
        if (Platform.OS === 'android') openDatePickerAndroid();
        else setShowDatePickerIOS(true);
      }} />
      {Platform.OS === 'ios' && showDatePickerIOS && (
        <DateTimePicker value={dueDate} mode="datetime" display="spinner"
          onChange={(event, date) => {
            setShowDatePickerIOS(false);
            if (date) setDueDate(date);
          }}
        />
      )}
      {errors.dueDate && <Text style={{ color: theme.error }}>{errors.dueDate}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Address *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        value={address} onChangeText={setAddress} placeholder="Enter address"
        placeholderTextColor={theme.border}
      />
      {errors.address && <Text style={{ color: theme.error }}>{errors.address}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Latitude (optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        value={latitude} onChangeText={setLatitude} keyboardType="numeric"
        placeholder="Lat" placeholderTextColor={theme.border}
      />
      <Text style={[styles.label, { color: theme.text }]}>Longitude (optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        value={longitude} onChangeText={setLongitude} keyboardType="numeric"
        placeholder="Lon" placeholderTextColor={theme.border}
      />

      <Button title={existingTask ? 'Update Task' : 'Create Task'} onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 4 },
});

export default TaskFormScreen;