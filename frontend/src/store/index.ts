import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { setUnauthorizedHandler } from '../api/client';
import authReducer, { logout } from './authSlice';
import tasksReducer from './tasksSlice';

export const store = configureStore({
  reducer: { auth: authReducer, tasks: tasksReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks so components get full type safety.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auto-logout when the API reports an invalid/expired token.
setUnauthorizedHandler(() => {
  store.dispatch(logout());
});
