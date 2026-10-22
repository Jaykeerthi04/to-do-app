export type Priority = 'low' | 'medium' | 'high';
export type SortMode = 'smart' | 'deadline' | 'due' | 'priority' | 'newest';
export type StatusFilter = 'all' | 'active' | 'completed' | 'overdue';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  dueAt: string; // ISO date-time: when the user plans to do it
  deadline: string; // ISO date-time: hard deadline
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  category: string;
  tags: string[];
  smartScore?: number; // computed by the backend for the "smart" sort
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueAt: string;
  deadline: string;
  priority: Priority;
  category?: string;
  tags?: string[];
}

export interface Filters {
  status: StatusFilter;
  priority: Priority | 'all';
  category: string; // 'all' or a category name
  tag: string; // 'all' or a tag
  sort: SortMode;
  search: string;
}
