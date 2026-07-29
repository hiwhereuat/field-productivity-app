import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, Image, Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { validateTask } from '../utils/validation';
import { Task, TaskStatus, Attachment } from '../types/task';
import { saveAttachment, deleteAttachment as deleteFile } from '../services/fileService';
import { scheduleTaskReminder, requestPermissions } from '../services/notificationService';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const DEFAULT_DUE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const TaskFormScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { dispatch, state, addLogEntry } = useTasks();
  const taskId = route.params?.taskId;
  const existingTask = taskId ? state.tasks.find(t => t.id === taskId) : null;

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [dueDate, setDueDate] = useState<Date>(
    existingTask?.dueDate ? new Date(existingTask.dueDate) : DEFAULT_DUE_DATE
  );
  const [address, setAddress] = useState(existingTask?.address ?? '');
  const [latitude, setLatitude] = useState(existingTask?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(existingTask?.longitude?.toString() ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(existingTask?.attachments ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePickerIOS, setShowDatePickerIOS] = useState(false);

  const openDatePickerAndroid = () => {
    DateTimePickerAndroid.open({
      value: dueDate,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === 'dismissed') return;
        if (selectedDate) {
          const currentDate = selectedDate;
          DateTimePickerAndroid.open({
            value: dueDate,
            mode: 'time',
            is24Hour: true,
            minimumDate:
              currentDate.toDateString() === new Date().toDateString()
                ? new Date()
                : undefined,
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
                if (combined <= new Date()) {
                  Alert.alert('Invalid date', 'Due date must be in the future.');
                  return;
                }
                setDueDate(combined);
              }
            },
          });
        }
      },
    });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to photos to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      try {
        const saved = await saveAttachment(asset.uri, asset.fileName ?? 'image.jpg');
        const newAtt: Attachment = {
          id: saved.id,
          uri: saved.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'image.jpg',
        };
        setAttachments(prev => [...prev, newAtt]);
      } catch (err) {
        Alert.alert('Error', 'Failed to save attachment');
      }
    }
  };

  const removeAttachment = async (att: Attachment) => {
    await deleteFile(att.uri);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to get coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude.toString());
      setLongitude(loc.coords.longitude.toString());
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location. Ensure GPS is enabled.');
    }
  };

  const handleSave = () => {
    if (typeof dispatch !== 'function') {
      console.warn('dispatch is not a function');
      return;
    }

    const validDueDate = dueDate instanceof Date && !isNaN(dueDate.getTime())
      ? dueDate : new Date();
    if (validDueDate <= new Date()) {
      setErrors({ dueDate: 'Due date must be in the future' });
      return;
    }
    const taskData = {
      title,
      description,
      dueDate: validDueDate.toISOString(),
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      attachments,
    };

    const validationErrors = validateTask(taskData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const scheduleReminder = async (task: Task) => {
      const granted = await requestPermissions();
      if (granted) {
        const notifId = await scheduleTaskReminder(task.id, task.title, task.dueDate);
        if (notifId) {
          const updatedTask = { ...task, notificationId: notifId };
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        }
      }
    };

    try {
      if (existingTask) {
        const oldAttachments = existingTask.attachments || [];
        const updated: Task = {
          ...existingTask,
          title: title.trim(),
          description: description.trim(),
          dueDate: taskData.dueDate,
          address: address.trim(),
          latitude: taskData.latitude,
          longitude: taskData.longitude,
          attachments,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_TASK', payload: updated });
        addLogEntry('EDIT', 'Task details updated', updated.id, updated.title);
        if (JSON.stringify(oldAttachments) !== JSON.stringify(attachments)) {
          setTimeout(() => {
            addLogEntry('ATTACHMENTS', 'Attachments updated', updated.id, updated.title);
          }, 0);
        }
        scheduleReminder(updated);
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
          attachments,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
        };
        dispatch({ type: 'ADD_TASK', payload: newTask });
        addLogEntry('CREATE', 'Task created', newTask.id, newTask.title);
        if (attachments.length > 0) {
          setTimeout(() => {
            addLogEntry('ATTACHMENTS', `Added ${attachments.length} attachment(s)`, newTask.id, newTask.title);
          }, 0);
        }
        scheduleReminder(newTask);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        value={title} onChangeText={setTitle} placeholder="Task title"
        placeholderTextColor={theme.border}
      />
      {errors.title && <Text style={{ color: theme.error }}>{errors.title}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        value={description} onChangeText={setDescription} placeholder="Task description"
        multiline placeholderTextColor={theme.border}
      />
      {errors.description && <Text style={{ color: theme.error }}>{errors.description}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Due date & time *</Text>
      <Button title={formatDateTime(dueDate)} onPress={() => {
        if (Platform.OS === 'android') openDatePickerAndroid();
        else setShowDatePickerIOS(true);
      }} />
      {Platform.OS === 'ios' && showDatePickerIOS && (
        <DateTimePicker
          value={dueDate}
          mode="datetime"
          display="spinner"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePickerIOS(false);
            if (date && date > new Date()) {
              setDueDate(date);
            } else if (date) {
              Alert.alert('Invalid date', 'Due date must be in the future.');
            }
          }}
        />
      )}
      {errors.dueDate && <Text style={{ color: theme.error }}>{errors.dueDate}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Address *</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        value={address} onChangeText={setAddress} placeholder="Enter address"
        placeholderTextColor={theme.border}
      />
      {errors.address && <Text style={{ color: theme.error }}>{errors.address}</Text>}

      <Text style={[styles.label, { color: theme.text }]}>Latitude (optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        value={latitude} onChangeText={setLatitude} keyboardType="numeric"
        placeholder="Lat" placeholderTextColor={theme.border}
      />
      <Text style={[styles.label, { color: theme.text }]}>Longitude (optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        value={longitude} onChangeText={setLongitude} keyboardType="numeric"
        placeholder="Lon" placeholderTextColor={theme.border}
      />
      <Button title="Use current location" onPress={getCurrentLocation} />

      <Text style={[styles.label, { color: theme.text, marginTop: 8 }]}>Attachments</Text>
      {attachments.map((att, index) => (
        <View key={att.id} style={styles.attachmentRow}>
          <Image source={{ uri: att.uri }} style={styles.thumbnail} />
          <Text style={{ color: theme.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
            {att.name}
          </Text>
          <Button title="Remove" onPress={() => removeAttachment(att)} color={theme.error} />
        </View>
      ))}
      <View style={{ marginBottom: 8 }}>
        <Button title="Add Image" onPress={pickImage} />
      </View>

      <View style={styles.saveButtonContainer}>
        <Button title={existingTask ? 'Update Task' : 'Create Task'} onPress={handleSave} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 4 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  thumbnail: { width: 40, height: 40, borderRadius: 4, marginRight: 8 },
  saveButtonContainer: { marginTop: 24, marginBottom: 16 },
});

export default TaskFormScreen;