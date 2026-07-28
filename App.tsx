import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from './src/context/ThemeContext';
import { TaskProvider } from './src/context/TaskContext';
import TaskListScreen from './src/screens/TaskListScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import MapScreen from './src/screens/MapScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TasksStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="TaskList" component={TaskListScreen} options={{ title: 'Tasks' }} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task Detail' }} />
    <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ title: 'New Task' }} />
  </Stack.Navigator>
);

export default function App() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <NavigationContainer>
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="TasksTab" component={TasksStack} options={{ tabBarLabel: 'Tasks' }} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </TaskProvider>
    </ThemeProvider>
  );
}