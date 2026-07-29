import { Task, HistoryEntry } from '../types/task';
import { getTasks, saveTasks, getDeletedTasksInfo, clearDeletedTasksInfo } from './taskStorage';
import { fetchRemoteTasks, uploadTask, updateRemoteTask, deleteRemoteTask } from '../api/syncService';
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
  const deletedInfos = await getDeletedTasksInfo();
  let remoteTasks: Task[] = [];

  try {
    remoteTasks = await fetchRemoteTasks();
  } catch {
    return { tasks: localTasks, historyEntries: [] };
  }

  for (const info of deletedInfos) {
    if (info.remoteId) {
      try {
        await deleteRemoteTask(info.remoteId);
      } catch (e) {
        console.warn('Failed to delete remote task', info.remoteId, e);
      }
    }
  }

  const deletedLocalIds = new Set(deletedInfos.map(d => d.taskId));
  const filteredRemote = remoteTasks.filter(t => {
    const localId = (t as any).localId;
    return !deletedLocalIds.has(t.id) && !deletedLocalIds.has(localId);
  });

  const reconciled = await reconcile(localTasks, filteredRemote);
  const historyEntries: HistoryEntry[] = [];

  for (let i = 0; i < reconciled.length; i++) {
    const task = reconciled[i];
    if (task.syncStatus === 'pending' || task.syncStatus === 'failed') {
      try {
        if (task.remoteId) {
          await updateRemoteTask(task);
          reconciled[i] = { ...task, syncStatus: 'synced' };
        } else {
          const remote = await uploadTask(task);
          reconciled[i] = { ...task, remoteId: remote.id, syncStatus: 'synced' };
        }
        historyEntries.push(
          createHistoryEntry('SYNC', `Task "${task.title}" synced`, task.id, task.title)
        );
      } catch {
        reconciled[i] = { ...task, syncStatus: 'failed' };
        historyEntries.push(
          createHistoryEntry('SYNC_FAILED', `Sync failed for "${task.title}"`, task.id, task.title)
        );
      }
    }
  }

  await saveTasks(reconciled);
  await clearDeletedTasksInfo();
  return { tasks: reconciled, historyEntries };
}