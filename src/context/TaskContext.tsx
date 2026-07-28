import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, HistoryEntry } from '../types/task';
import { getTasks, saveTasks } from '../services/taskStorage';
import { getGlobalHistory, saveGlobalHistory } from '../services/globalHistoryStorage';
import { createHistoryEntry } from '../utils/history';

interface State {
  tasks: Task[];
  sortBy: 'createdAt' | 'dueDate' | 'status';
  globalHistory: HistoryEntry[];
}

const initialState: State = { tasks: [], sortBy: 'createdAt', globalHistory: [] };

type Action =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SORT'; payload: State['sortBy'] }
  | { type: 'SET_GLOBAL_HISTORY'; payload: HistoryEntry[] }
  | { type: 'ADD_GLOBAL_HISTORY'; payload: HistoryEntry };

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
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    case 'SET_GLOBAL_HISTORY':
      return { ...state, globalHistory: action.payload };
    case 'ADD_GLOBAL_HISTORY':
      return { ...state, globalHistory: [...state.globalHistory, action.payload] };
    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  addLogEntry: (action: string, description: string, taskId: string, taskTitle: string) => void;
}>({ state: initialState, dispatch: () => {}, addLogEntry: () => {} });

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getTasks().then(tasks => dispatch({ type: 'SET_TASKS', payload: tasks }));
    getGlobalHistory().then(history => dispatch({ type: 'SET_GLOBAL_HISTORY', payload: history }));
  }, []);

  useEffect(() => {
    saveTasks(state.tasks);
  }, [state.tasks]);

  useEffect(() => {
    saveGlobalHistory(state.globalHistory);
  }, [state.globalHistory]);

  const addLogEntry = (action: string, description: string, taskId: string, taskTitle: string) => {
    const entry = createHistoryEntry(action, description, taskId, taskTitle);
    dispatch({ type: 'ADD_GLOBAL_HISTORY', payload: entry });
  };

  const displayState: State = {
    ...state,
    tasks: sortTasks(state.tasks, state.sortBy),
  };

  return (
    <TaskContext.Provider value={{ state: displayState, dispatch, addLogEntry }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);