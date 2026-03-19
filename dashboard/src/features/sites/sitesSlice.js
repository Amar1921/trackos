import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSites = createAsyncThunk('sites/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/sites');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const createSite = createAsyncThunk('sites/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/sites', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const updateSite = createAsyncThunk('sites/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    await api.put(`/sites/${id}`, payload);
    return { id, ...payload };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const deleteSite = createAsyncThunk('sites/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/sites/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

export const regenerateKey = createAsyncThunk('sites/regenerateKey', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/sites/${id}/regenerate-key`);
    return { id, site_key: data.site_key };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || err.message);
  }
});

const sitesSlice = createSlice({
  name: 'sites',
  initialState: {
    items: [],
    loading: false,
    error: null,
    selectedId: null,
  },
  reducers: {
    selectSite(state, action) { state.selectedId = action.payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
        // fetchSites
        .addCase(fetchSites.pending, (s) => { s.loading = true; s.error = null; })
        .addCase(fetchSites.fulfilled, (s, a) => {
          s.loading = false;
          // Garantir que payload est bien un tableau (guard contre réponse API inattendue)
          const items = Array.isArray(a.payload) ? a.payload : [];
          s.items = items;
          if (!s.selectedId && items.length > 0) s.selectedId = items[0].id;
        })
        .addCase(fetchSites.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
        // createSite
        .addCase(createSite.fulfilled, (s, a) => { s.items.unshift(a.payload); })
        // updateSite
        .addCase(updateSite.fulfilled, (s, a) => {
          const idx = s.items.findIndex(x => x.id === a.payload.id);
          if (idx !== -1) s.items[idx] = { ...s.items[idx], ...a.payload };
        })
        // deleteSite
        .addCase(deleteSite.fulfilled, (s, a) => {
          s.items = s.items.filter(x => x.id !== a.payload);
          if (s.selectedId === a.payload) s.selectedId = null;
        })
        // regenerateKey
        .addCase(regenerateKey.fulfilled, (s, a) => {
          const idx = s.items.findIndex(x => x.id === a.payload.id);
          if (idx !== -1) s.items[idx].site_key = a.payload.site_key;
        });
  },
});

export const { selectSite, clearError } = sitesSlice.actions;
export default sitesSlice.reducer;

// Selectors — défensifs (guard si state pas encore hydraté)
export const selectAllSites     = (s) => s.sites?.items ?? [];
export const selectSitesLoading = (s) => s.sites?.loading ?? false;
export const selectSelectedSite = (s) => {
  const items = s.sites?.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.find(x => x.id === s.sites.selectedId) ?? items[0] ?? null;
};