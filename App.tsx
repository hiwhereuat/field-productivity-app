import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TaskProvider, useTasks } from './src/context/TaskContext';
import TaskListScreen from './src/screens/TaskListScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import MapScreen from './src/screens/MapScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TasksStack = () => {
  const { theme, isDark } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="TaskList" component={TaskListScreen} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task Detail' }} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ title: 'New Task' }} />
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { loading } = useTasks();
  const { theme, isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  const customNavTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      primary: theme.primary,
      border: theme.border,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <NavigationContainer theme={customNavTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'list';
              if (route.name === 'TasksTab') iconName = focused ? 'list-circle' : 'list-outline';
              else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
              else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
              else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.border,
            tabBarStyle: {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
            },
            tabBarLabelStyle: { fontSize: 12 },
          })}
        >
          <Tab.Screen name="TasksTab" component={TasksStack} options={{ tabBarLabel: 'Tasks' }} />
          <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Map' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});