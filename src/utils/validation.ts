import { Task } from '../types/task';

export function validateTask(data: Partial<Task>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.title?.trim()) errors.title = 'Title is required';
  if (!data.description?.trim()) errors.description = 'Description is required';
  if (!data.dueDate) errors.dueDate = 'Due date is required';
  if (!data.address?.trim()) errors.address = 'Location address is required';
  return errors;
}