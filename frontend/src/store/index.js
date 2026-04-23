import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uploadReducer from './uploadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    upload: uploadReducer,
  },
});
