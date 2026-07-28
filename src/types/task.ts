export type TaskStatus = 'New' | 'InProgress' | 'Completed' | 'Cancelled';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Attachment {
  id: string;
  uri: string;
  type: string;
  name: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  taskId: string;
  taskTitle: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: TaskStatus;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  remoteId?: string;
  notificationId?: string;
}