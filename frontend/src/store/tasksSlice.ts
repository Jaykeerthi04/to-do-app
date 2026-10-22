import { createAsyncThunk, createSlice, PayloadAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { tasksApi } from '../api/tasks';
import { getErrorMessage } from '../api/client';
import { Filters, Task, TaskInput } from '../types';
import { logout } from './authSlice';
import type { RootState } from './index';

interface TasksState {
  items: Task[];
  categories: string[];
  tags: string[];
  filters: Filters;
  loading: boolean;
  error: string | null;
  currentRequestId: string | null; // used to ignore out-of-order responses
}

const initialState: TasksState = {
  items: [],
  categories: [],
  tags: [],
  filters: { status: 'all', priority: 'all', category: 'all', tag: 'all', sort: 'smart', search: '' },
  loading: false,
  error: null,
  currentRequestId: null,
};

// Thunk config: typed state + dispatch so thunks can dispatch other thunks (e.g. refetch after create).
type Rejectable = {
  state: RootState;
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
  rejectValue: string;
};

/** Loads tasks using the current filters; the server applies filtering and the smart sort. */
export const fetchTasks = createAsyncThunk<Task[], void, Rejectable>(
  'tasks/fetch',
  async (_, { getState, rejectWithValue }) => {
    const f = getState().tasks.filters;
    try {
      return await tasksApi.list({
        status: f.status === 'all' ? undefined : f.status,
        priority: f.priority === 'all' ? undefined : f.priority,
        category: f.category === 'all' ? undefined : f.category,
        tag: f.tag === 'all' ? undefined : f.tag,
        search: f.search || undefined,
        sort: f.sort,
      });
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

/** Categories and tags that power the filter chips. */
export const fetchMeta = createAsyncThunk('tasks/fetchMeta', async () => tasksApi.meta());

export const createTask = createAsyncThunk<Task, TaskInput, Rejectable>(
  'tasks/create',
  async (input, { dispatch, rejectWithValue }) => {
    try {
      const task = await tasksApi.create(input);
      dispatch(fetchTasks());
      dispatch(fetchMeta());
      return task;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const updateTask = createAsyncThunk<Task, { id: string; changes: Partial<TaskInput> }, Rejectable>(
  'tasks/update',
  async ({ id, changes }, { dispatch, rejectWithValue }) => {
    try {
      const task = await tasksApi.update(id, changes);
      dispatch(fetchTasks());
      dispatch(fetchMeta());
      return task;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

/** Optimistic toggle: the checkbox flips instantly and rolls back if the server fails. */
export const toggleTask = createAsyncThunk<Task, string, Rejectable>(
  'tasks/toggle',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const task = await tasksApi.toggle(id);
      dispatch(fetchTasks()); // order may change (completed tasks sink)
      return task;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteTask = createAsyncThunk<string, string, Rejectable>(
  'tasks/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await tasksApi.remove(id);
      dispatch(fetchMeta());
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

const flip = (state: TasksState, id: string) => {
  const t = state.items.find((x) => x._id === id);
  if (t) t.completed = !t.completed;
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    clearTasksError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return; // stale response
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload ?? 'Failed to load tasks';
      })
      .addCase(fetchMeta.fulfilled, (state, { payload }) => {
        state.categories = payload.categories;
        state.tags = payload.tags;
      })
      .addCase(toggleTask.pending, (state, action) => flip(state, action.meta.arg))
      .addCase(toggleTask.rejected, (state, action) => {
        flip(state, action.meta.arg); // roll back
        state.error = action.payload ?? 'Could not update task';
      })
      .addCase(deleteTask.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((t) => t._id !== payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload ?? 'Could not delete task';
      })
      .addCase(logout.fulfilled, () => initialState); // wipe all task data on logout
  },
});

export const { setFilters, resetFilters, clearTasksError } = tasksSlice.actions;
export default tasksSlice.reducer;
