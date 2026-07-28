import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Task, HistoryEntry } from '../types/task';
import { getTasks, saveTasks } from '../services/taskStorage';
import { getGlobalHistory, saveGlobalHistory } from '../services/globalHistoryStorage';
import { createHistoryEntry } from '../utils/history';
import { performSync } from '../services/syncEngine';

interface State {
  tasks: Task[];
  sortBy: 'createdAt' | 'dueDate' | 'status';
  globalHistory: HistoryEntry[];
  loading: boolean;
}

const initialState: State = { tasks: [], sortBy: 'createdAt', globalHistory: [], loading: true };

type Action =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SORT'; payload: State['sortBy'] }
  | { type: 'SET_GLOBAL_HISTORY'; payload: HistoryEntry[] }
  | { type: 'ADD_GLOBAL_HISTORY'; payload: HistoryEntry }
  | { type: 'SET_LOADING'; payload: boolean };

function sortTasks(tasks: Task[], sortBy: State['sortBy']): Task[] {
  const sorted = [...tasks];
  if (sortBy === 'createdAt') {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'dueDate') {
    sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  } else if (sortBy === 'status') {
    const statusOrder = { New: 0, InProgress: 1, Completed: 2, Cancelled: 3 };
    sorted.sort((a, b) => (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0));
  }
  return sorted;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    case 'SET_GLOBAL_HISTORY':
      return { ...state, globalHistory: action.payload };
    case 'ADD_GLOBAL_HISTORY':
      return { ...state, globalHistory: [...state.globalHistory, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  addLogEntry: (action: string, description: string, taskId: string, taskTitle: string) => void;
  syncNow: () => Promise<void>;
  loading: boolean;
}>({
  state: initialState,
  dispatch: () => {},
  addLogEntry: () => {},
  syncNow: async () => {},
  loading: true,
});

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Promise.all([getTasks(), getGlobalHistory()]).then(([tasks, history]) => {
      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_GLOBAL_HISTORY', payload: history });
      dispatch({ type: 'SET_LOADING', payload: false });
    });
  }, []);

  useEffect(() => {
    saveTasks(state.tasks);
  }, [state.tasks]);

  useEffect(() => {
    saveGlobalHistory(state.globalHistory);
  }, [state.globalHistory]);

  const addLogEntry = useCallback(
    (action: string, description: string, taskId: string, taskTitle: string) => {
      const entry = createHistoryEntry(action, description, taskId, taskTitle);
      dispatch({ type: 'ADD_GLOBAL_HISTORY', payload: entry });
    },
    []
  );

  const syncNow = useCallback(async () => {
    try {
      const { tasks, historyEntries } = await performSync();
      dispatch({ type: 'SET_TASKS', payload: tasks });
      historyEntries.forEach(entry => {
        dispatch({ type: 'ADD_GLOBAL_HISTORY', payload: entry });
      });
    } catch (error) {
      console.warn('Sync failed', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      if (netState.isConnected) {
        syncNow();
      }
    });
    return () => unsubscribe();
  }, [syncNow]);

  const displayState: State = {
    ...state,
    tasks: sortTasks(state.tasks, state.sortBy),
  };

  return (
    <TaskContext.Provider value={{ state: displayState, dispatch, addLogEntry, syncNow, loading: state.loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);