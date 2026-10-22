import { client } from './client';
import { Task, TaskInput } from '../types';

export type ListParams = {
  status?: string;
  priority?: string;
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
};

export const tasksApi = {
  list: (params: ListParams) => client.get<{ tasks: Task[] }>('/tasks', { params }).then((r) => r.data.tasks),
  create: (body: TaskInput) => client.post<{ task: Task }>('/tasks', body).then((r) => r.data.task),
  update: (id: string, body: Partial<TaskInput>) =>
    client.patch<{ task: Task }>(`/tasks/${id}`, body).then((r) => r.data.task),
  toggle: (id: string) => client.patch<{ task: Task }>(`/tasks/${id}/toggle`).then((r) => r.data.task),
  remove: (id: string) => client.delete(`/tasks/${id}`),
  meta: () =>
    client.get<{ categories: string[]; tags: string[] }>('/tasks/meta').then((r) => r.data),
};
