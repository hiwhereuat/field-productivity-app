import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const TASKS_KEY = '@tasks';
const DELETED_TASKS_KEY = '@deleted_tasks';

interface DeletedTaskInfo {
  taskId: string;
  remoteId?: string;
}

export async function getTasks(): Promise<Task[]> {
  const json = await AsyncStorage.getItem(TASKS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function getDeletedTasksInfo(): Promise<DeletedTaskInfo[]> {
  const json = await AsyncStorage.getItem(DELETED_TASKS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addDeletedTaskInfo(info: DeletedTaskInfo): Promise<void> {
  const list = await getDeletedTasksInfo();
  list.push(info);
  await AsyncStorage.setItem(DELETED_TASKS_KEY, JSON.stringify(list));
}

export async function clearDeletedTasksInfo(): Promise<void> {
  await AsyncStorage.removeItem(DELETED_TASKS_KEY);
}