import { createSlice } from '@reduxjs/toolkit';

const MAX_FEED = 100; // max items dans le flux temps réel

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: {
    connected: false,
    activeVisitors: {},    // { [site_id]: { count, visitors: [] } }
    liveFeed: [],          // événements récents (toutes sites confondus)
    subscribedSites: [],
  },
  reducers: {
    setConnected(state, action) { state.connected = action.payload; },

    setActiveSnapshot(state, action) {
      const { site_id, visitors } = action.payload;
      state.activeVisitors[site_id] = { count: visitors.length, visitors };
    },

    setActiveCount(state, action) {
      const { site_id, count } = action.payload;
      if (!state.activeVisitors[site_id]) state.activeVisitors[site_id] = { count: 0, visitors: [] };
      state.activeVisitors[site_id].count = count;
    },

    addLiveFeedItem(state, action) {
      state.liveFeed.unshift({ ...action.payload, _id: Date.now() + Math.random() });
      if (state.liveFeed.length > MAX_FEED) state.liveFeed.length = MAX_FEED;
    },

    removeActiveVisitor(state, action) {
      const { site_id, session_id } = action.payload;
      if (state.activeVisitors[site_id]) {
        state.activeVisitors[site_id].visitors = state.activeVisitors[site_id].visitors.filter(
            v => v.session_id !== session_id
        );
        state.activeVisitors[site_id].count = state.activeVisitors[site_id].visitors.length;
      }
    },

    addSubscribedSite(state, action) {
      if (!state.subscribedSites.includes(action.payload)) state.subscribedSites.push(action.payload);
    },

    removeSubscribedSite(state, action) {
      state.subscribedSites = state.subscribedSites.filter(id => id !== action.payload);
    },

    clearFeed(state) { state.liveFeed = []; },
  },
});

export const {
  setConnected, setActiveSnapshot, setActiveCount,
  addLiveFeedItem, removeActiveVisitor,
  addSubscribedSite, removeSubscribedSite, clearFeed,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;

// Selectors
export const selectActiveCount    = (site_id) => (s) => s.realtime?.activeVisitors?.[site_id]?.count ?? 0;
export const selectActiveVisitors = (site_id) => (s) => s.realtime?.activeVisitors?.[site_id]?.visitors ?? [];
export const selectLiveFeed       = (s) => s.realtime?.liveFeed ?? [];
export const selectSocketConnected = (s) => s.realtime?.connected ?? false;