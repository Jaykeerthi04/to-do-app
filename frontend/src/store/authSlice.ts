import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { authApi } from '../api/auth';
import { getErrorMessage, setAuthToken } from '../api/client';
import { User } from '../types';
import { tokenStorage } from '../utils/storage';

interface AuthState {
  token: string | null;
  user: User | null;
  bootstrapped: boolean; // true once we've checked storage for a saved session
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { token: null, user: null, bootstrapped: false, loading: false, error: null };

type Creds = { email: string; password: string };
type Session = { token: string; user: User };

/** On app start: restore the saved token and verify it with the server (auto-login). */
export const bootstrap = createAsyncThunk<Session | null>('auth/bootstrap', async () => {
  const token = await tokenStorage.get();
  if (!token) return null;
  setAuthToken(token);
  try {
    const user = await authApi.me();
    return { token, user };
  } catch (e) {
    // Expired/invalid token: drop it. Any other failure (e.g. offline) also falls back to login.
    if (axios.isAxiosError(e) && e.response?.status === 401) await tokenStorage.clear();
    setAuthToken(null);
    return null;
  }
});

const persist = async (s: Session) => {
  await tokenStorage.set(s.token);
  setAuthToken(s.token);
  return s;
};

export const login = createAsyncThunk<Session, Creds, { rejectValue: string }>(
  'auth/login',
  async (creds, { rejectWithValue }) => {
    try {
      return await persist(await authApi.login(creds));
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const register = createAsyncThunk<Session, Creds & { name?: string }, { rejectValue: string }>(
  'auth/register',
  async (body, { rejectWithValue }) => {
    try {
      return await persist(await authApi.register(body));
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await tokenStorage.clear();
  setAuthToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.fulfilled, (state, { payload }) => {
        state.bootstrapped = true;
        state.token = payload?.token ?? null;
        state.user = payload?.user ?? null;
      })
      .addCase(bootstrap.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.error = null;
      });

    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.loading = false;
          state.token = payload.token;
          state.user = payload.user;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload ?? 'Something went wrong';
        });
    }
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
