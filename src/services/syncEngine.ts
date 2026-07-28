import { Task, HistoryEntry } from '../types/task';
import { getTasks, saveTasks } from './taskStorage';
import { fetchRemoteTasks, uploadTask, updateRemoteTask } from '../api/syncService';
import { createHistoryEntry } from '../utils/history';

async function reconcile(localTasks: Task[], remoteTasks: Task[]): Promise<Task[]> {
  const map = new Map<string, Task>();
  localTasks.forEach(t => map.set(t.id, t));

  for (const remote of remoteTasks) {
    const localId = (remote as any).localId;
    if (localId && map.has(localId)) {
      const local = map.get(localId)!;
      if (new Date(local.updatedAt) > new Date(remote.updatedAt)) {
        map.set(localId, { ...local, remoteId: remote.id, syncStatus: 'synced' });
      } else {
        map.set(localId, { ...remote, id: localId, remoteId: remote.id, syncStatus: 'synced' });
      }
    } else {
      map.set(remote.id, { ...remote, remoteId: remote.id, syncStatus: 'synced' });
    }
  }
  return Array.from(map.values());
}

export async function performSync(): Promise<{
  tasks: Task[];
  historyEntries: HistoryEntry[];
}> {
  const localTasks = await getTasks();
  const remoteTasks = await fetchRemoteTasks();
  const reconciled = await reconcile(localTasks, remoteTasks);
  const historyEntries: HistoryEntry[] = [];

  for (let task of reconciled) {
    if (task.syncStatus === 'pending' || task.syncStatus === 'failed') {
      try {
        if (task.remoteId) {
          await updateRemoteTask(task);
          task = { ...task, syncStatus: 'synced' };
        } else {
          const remote = await uploadTask(task);
          task = { ...task, remoteId: remote.id, syncStatus: 'synced' };
        }
        historyEntries.push(
          createHistoryEntry('SYNC', `Task "${task.title}" synced`, task.id, task.title)
        );
      } catch {
        task = { ...task, syncStatus: 'failed' };
        historyEntries.push(
          createHistoryEntry('SYNC_FAILED', `Sync failed for "${task.title}"`, task.id, task.title)
        );
      }
    }
  }

  await saveTasks(reconciled);
  return { tasks: reconciled, historyEntries };
}