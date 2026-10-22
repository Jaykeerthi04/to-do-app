import { Task } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tasks: undefined;
  TaskForm: { task?: Task } | undefined; // task present = edit mode
};
