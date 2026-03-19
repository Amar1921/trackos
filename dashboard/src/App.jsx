import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from './app/store';
import theme from './theme';
import ProtectedRoute from "./components/pages/ProtectedRoute.jsx";
import Sidebar from './components/layout/Sidebar';
import LoginPage       from './components/pages/LoginPage';
import OverviewPage    from './components/pages/OverviewPage';
import SitesPage       from './components/pages/SitesPage';
import RealtimePage    from './components/pages/RealtimePage';
import AnalyticsPage   from './components/pages/AnalyticsPage';
import VisitorsPage    from './components/pages/VisitorsPage';
import GlobalStatsPage from './components/pages/GlobalStatsPage';
import { useSocketInit } from './hooks/useSocket';

function AppContent() {
    useSocketInit();
    return (
        <Sidebar>
            <Routes>
                <Route path="/"         element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
                <Route path="/global"   element={<ProtectedRoute><GlobalStatsPage /></ProtectedRoute>} />
                <Route path="/sites"    element={<ProtectedRoute><SitesPage /></ProtectedRoute>} />
                <Route path="/realtime" element={<ProtectedRoute><RealtimePage /></ProtectedRoute>} />
                <Route path="/analytics"element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/visitors" element={<ProtectedRoute><VisitorsPage /></ProtectedRoute>} />
            </Routes>
        </Sidebar>
    );
}

export default function App() {
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/*"     element={<AppContent />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </Provider>
    );
}