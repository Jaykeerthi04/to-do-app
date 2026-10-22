import { client } from './client';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (body: { name?: string; email: string; password: string }) =>
    client.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    client.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  me: () => client.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
