import { Task } from '../types/task';

const BASE_URL = 'http://10.0.2.2:3000'; 

export async function fetchRemoteTasks(): Promise<Task[]> {
  const response = await fetch(`${BASE_URL}/tasks`);
  if (!response.ok) throw new Error('Fetch failed');
  return response.json();
}

export async function uploadTask(task: Task): Promise<Task> {
  const { id, ...data } = task;
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, localId: id }),
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function updateRemoteTask(task: Task): Promise<Task> {
  if (!task.remoteId) throw new Error('Missing remoteId');
  const response = await fetch(`${BASE_URL}/tasks/${task.remoteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Update failed');
  return response.json();
}

export async function deleteRemoteTask(remoteId: string): Promise<void> {
  await fetch(`${BASE_URL}/tasks/${remoteId}`, { method: 'DELETE' });
}