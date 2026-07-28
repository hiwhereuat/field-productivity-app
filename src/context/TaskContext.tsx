import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task } from '../types/task';
import { getTasks, saveTasks } from '../services/taskStorage';

interface State {
  tasks: Task[];
  sortBy: 'createdAt' | 'dueDate' | 'status';
}

const initialState: State = { tasks: [], sortBy: 'createdAt' };

type Action =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SORT'; payload: State['sortBy'] };

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
    case 'ADD_TASK': {
      const tasks = [...state.tasks, action.payload];
      return { ...state, tasks };
    }
    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t => (t.id === action.payload.id ? action.payload : t));
      return { ...state, tasks };
    }
    case 'DELETE_TASK': {
      const tasks = state.tasks.filter(t => t.id !== action.payload);
      return { ...state, tasks };
    }
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    getTasks().then(tasks => dispatch({ type: 'SET_TASKS', payload: tasks }));
  }, []);

   useEffect(() => {
    saveTasks(state.tasks);
   }, [state.tasks]);

  const displayState: State = {
    ...state,
    tasks: sortTasks(state.tasks, state.sortBy),
  };

  return (
    <TaskContext.Provider value={{ state: displayState, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
