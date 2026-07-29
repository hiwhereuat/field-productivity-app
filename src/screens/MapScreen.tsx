import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const { state } = useTasks();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const tasksWithCoords = state.tasks.filter(
    t => t.latitude != null && t.longitude != null && !isNaN(t.latitude) && !isNaN(t.longitude)
  );

  const openTaskDetail = (taskId: string) => {
    navigation.navigate('TasksTab', {
      screen: 'TaskDetail',
      params: { taskId },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6176,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {tasksWithCoords.map(task => (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.latitude!,
              longitude: task.longitude!,
            }}
            title={task.title}
            description={task.status}
          >
            <Callout onPress={() => openTaskDetail(task.id)}>
              <View style={styles.callout}>
                <Text style={{ fontWeight: 'bold' }}>{task.title}</Text>
                <Text>{task.address}</Text>
                <Text style={{ color: theme.primary }}>{task.status}</Text>
                <Text style={{ fontSize: 12, marginTop: 4, color: theme.primary }}>
                  Tap to view details
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: { padding: 8, maxWidth: 200 },
});

export default MapScreen;