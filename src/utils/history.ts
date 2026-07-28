import { HistoryEntry } from '../types/task';

let counter = 0;
const generateHistoryId = () => {
  counter += 1;
  return `${Date.now()}-${counter}`;
};

export function createHistoryEntry(
  action: string,
  description: string,
  taskId: string,
  taskTitle: string
): HistoryEntry {
  return {
    id: generateHistoryId(),
    timestamp: new Date().toISOString(),
    action,
    description,
    taskId,
    taskTitle,
  };
}