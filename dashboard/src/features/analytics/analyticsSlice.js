import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('analytics/dashboard', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/analytics/dashboard', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const fetchTimeline = createAsyncThunk('analytics/timeline', async ({ site_id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/analytics/${site_id}/timeline`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const fetchTopPages = createAsyncThunk('analytics/topPages', async ({ site_id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/analytics/${site_id}/top-pages`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const fetchCountries = createAsyncThunk('analytics/countries', async ({ site_id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/analytics/${site_id}/countries`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const fetchDevices = createAsyncThunk('analytics/devices', async ({ site_id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/analytics/${site_id}/devices`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const fetchRecentVisits = createAsyncThunk('analytics/recentVisits', async ({ site_id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/analytics/${site_id}/recent-visits`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboardStats: [],
    timeline: [],
    topPages: [],
    countries: [],
    devices: { browsers: [], devices: [], oses: [] },
    recentVisits: [],
    // Global
    globalStats:     {},
    globalTimeline:  [],
    globalCountries: [],
    globalDevices:   {},
    globalTopPages:  [],
    globalPerSite:   [],
    loading: {},
    error: null,
    dateRange: {
      from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
  },
  reducers: {
    setDateRange(state, action) { state.dateRange = action.payload; },
    clearAnalytics(state) {
      state.timeline = [];
      state.topPages = [];
      state.countries = [];
      state.devices = { browsers: [], devices: [], oses: [] };
      state.recentVisits = [];
    },
  },
  extraReducers: (builder) => {
    const pending = (key) => (s) => { s.loading[key] = true; };
    const done = (key) => (s) => { s.loading[key] = false; };

    builder
        .addCase(fetchDashboardStats.pending, pending('dashboard'))
        .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading.dashboard = false; s.dashboardStats = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchDashboardStats.rejected, done('dashboard'))

        .addCase(fetchTimeline.pending, pending('timeline'))
        .addCase(fetchTimeline.fulfilled, (s, a) => { s.loading.timeline = false; s.timeline = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchTimeline.rejected, done('timeline'))

        .addCase(fetchTopPages.pending, pending('topPages'))
        .addCase(fetchTopPages.fulfilled, (s, a) => { s.loading.topPages = false; s.topPages = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchTopPages.rejected, done('topPages'))

        .addCase(fetchCountries.pending, pending('countries'))
        .addCase(fetchCountries.fulfilled, (s, a) => { s.loading.countries = false; s.countries = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchCountries.rejected, done('countries'))

        .addCase(fetchDevices.pending, pending('devices'))
        .addCase(fetchDevices.fulfilled, (s, a) => {
          s.loading.devices = false;
          const p = a.payload;
          s.devices = {
            browsers: Array.isArray(p?.browsers) ? p.browsers : [],
            devices:  Array.isArray(p?.devices)  ? p.devices  : [],
            oses:     Array.isArray(p?.oses)     ? p.oses     : [],
          };
        })
        .addCase(fetchDevices.rejected, done('devices'))

        .addCase(fetchRecentVisits.pending, pending('recentVisits'))
        .addCase(fetchRecentVisits.fulfilled, (s, a) => { s.loading.recentVisits = false; s.recentVisits = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchRecentVisits.rejected, done('recentVisits'))
        // Global
        .addCase(fetchGlobalStats.pending, pending('globalStats'))
        .addCase(fetchGlobalStats.fulfilled, (s, a) => { s.loading.globalStats = false; s.globalStats = a.payload ?? {}; })
        .addCase(fetchGlobalStats.rejected, done('globalStats'))
        .addCase(fetchGlobalTimeline.pending, pending('globalTimeline'))
        .addCase(fetchGlobalTimeline.fulfilled, (s, a) => { s.loading.globalTimeline = false; s.globalTimeline = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchGlobalTimeline.rejected, done('globalTimeline'))
        .addCase(fetchGlobalCountries.pending, pending('globalCountries'))
        .addCase(fetchGlobalCountries.fulfilled, (s, a) => { s.loading.globalCountries = false; s.globalCountries = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchGlobalCountries.rejected, done('globalCountries'))
        .addCase(fetchGlobalDevices.pending, pending('globalDevices'))
        .addCase(fetchGlobalDevices.fulfilled, (s, a) => { s.loading.globalDevices = false; s.globalDevices = a.payload ?? {}; })
        .addCase(fetchGlobalDevices.rejected, done('globalDevices'))
        .addCase(fetchGlobalTopPages.pending, pending('globalTopPages'))
        .addCase(fetchGlobalTopPages.fulfilled, (s, a) => { s.loading.globalTopPages = false; s.globalTopPages = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchGlobalTopPages.rejected, done('globalTopPages'))
        .addCase(fetchGlobalPerSite.pending, pending('globalPerSite'))
        .addCase(fetchGlobalPerSite.fulfilled, (s, a) => { s.loading.globalPerSite = false; s.globalPerSite = Array.isArray(a.payload) ? a.payload : []; })
        .addCase(fetchGlobalPerSite.rejected, done('globalPerSite'));
  },
});

export const { setDateRange, clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;

// ─── Global stats thunks ──────────────────────────────────────────────────────
export const fetchGlobalStats = createAsyncThunk('analytics/globalStats', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/stats', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});

export const fetchGlobalTimeline = createAsyncThunk('analytics/globalTimeline', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/timeline', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});

export const fetchGlobalCountries = createAsyncThunk('analytics/globalCountries', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/countries', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});

export const fetchGlobalDevices = createAsyncThunk('analytics/globalDevices', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/devices', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});

export const fetchGlobalTopPages = createAsyncThunk('analytics/globalTopPages', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/top-pages', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});

export const fetchGlobalPerSite = createAsyncThunk('analytics/globalPerSite', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/global/per-site', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.error || err.message); }
});