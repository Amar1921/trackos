import { configureStore } from '@reduxjs/toolkit';
import sitesReducer from '../features/sites/sitesSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import realtimeReducer from '../features/realtime/realtimeSlice';

const store = configureStore({
  reducer: {
    sites: sitesReducer,
    analytics: analyticsReducer,
    realtime: realtimeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
