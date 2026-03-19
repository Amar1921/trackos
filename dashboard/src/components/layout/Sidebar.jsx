import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, Divider, Avatar, Tooltip, IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language';
import StreamIcon from '@mui/icons-material/Stream';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import LogoutIcon from '@mui/icons-material/Logout';
import { selectSocketConnected } from '../../features/realtime/realtimeSlice';

const DRAWER_FULL = 240;
const DRAWER_MINI = 64;

const NAV_ITEMS = [
    { label: "Vue d'ensemble",    icon: <DashboardIcon />,        path: '/' },
    { label: 'Stats globales',     icon: <BarChartOutlinedIcon />, path: '/global' },
    { label: 'Mes sites',          icon: <LanguageIcon />,         path: '/sites' },
    { label: 'Temps réel',     icon: <StreamIcon />,    path: '/realtime' },
    { label: 'Analytics',      icon: <BarChartIcon />,  path: '/analytics' },
    { label: 'Visiteurs',      icon: <PeopleIcon />,    path: '/visitors' },
];

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('trackos_user') || 'null');
    } catch {
        return null;
    }
}

function getInitials(fullname) {
    if (!fullname) return '?';
    return fullname.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function handleLogout(navigate) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('trackos_user');
    navigate('/login');
}

export default function Sidebar({ children }) {
    const navigate   = useNavigate();
    const location   = useLocation();
    const connected  = useSelector(selectSocketConnected);
    const [collapsed, setCollapsed] = useState(false);
    const width = collapsed ? DRAWER_MINI : DRAWER_FULL;
    const user  = getStoredUser();

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width,
                    flexShrink: 0,
                    transition: 'width 0.2s ease',
                    '& .MuiDrawer-paper': {
                        width,
                        overflowX: 'hidden',
                        transition: 'width 0.2s ease',
                        boxSizing: 'border-box',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                {/* Logo */}
                <Toolbar sx={{ px: 2, minHeight: '64px !important', justifyContent: collapsed ? 'center' : 'space-between' }}>
                    {!collapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '8px',
                                background: 'linear-gradient(135deg, #1a73e8, #4a9ef8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <StreamIcon sx={{ fontSize: 18, color: '#fff' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1rem' }}>
                                TrackOS
                            </Typography>
                        </Box>
                    )}
                    <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ ml: collapsed ? 0 : 'auto' }}>
                        {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                    </IconButton>
                </Toolbar>

                <Divider />

                {/* Navigation */}
                <List sx={{ px: 1, py: 1, flexGrow: 1 }}>
                    {NAV_ITEMS.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                <Tooltip title={collapsed ? item.label : ''} placement="right">
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            borderRadius: 2,
                                            minHeight: 44,
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            px: collapsed ? 1 : 2,
                                            bgcolor: active ? 'primary.main' : 'transparent',
                                            color: active ? '#fff' : 'text.primary',
                                            '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: collapsed ? 0 : 36,
                                            color: active ? '#fff' : 'text.secondary',
                                            justifyContent: 'center',
                                        }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        {!collapsed && (
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                                            />
                                        )}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        );
                    })}
                </List>

                <Divider />

                {/* Statut socket */}
                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: collapsed ? 'center' : 'flex-start' }}>
                    {connected
                        ? <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        : <WifiOffIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                    {!collapsed && (
                        <Typography variant="caption" color={connected ? 'success.main' : 'error.main'} fontWeight={600}>
                            {connected ? 'Connecté' : 'Déconnecté'}
                        </Typography>
                    )}
                </Box>

                <Divider />

                {/* User info + logout */}
                <Box sx={{
                    px: collapsed ? 1 : 2, py: 1.5,
                    display: 'flex', alignItems: 'center',
                    gap: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem', flexShrink: 0 }}>
                        {getInitials(user?.fullname)}
                    </Avatar>

                    {!collapsed && (
                        <>
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                <Typography variant="caption" fontWeight={600} noWrap display="block">
                                    {user?.fullname || 'Utilisateur'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.65rem' }}>
                                    {user?.email || ''}
                                </Typography>
                            </Box>
                            <Tooltip title="Se déconnecter">
                                <IconButton size="small" onClick={() => handleLogout(navigate)} color="default">
                                    <LogoutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    {collapsed && (
                        <Tooltip title="Se déconnecter" placement="right">
                            <IconButton size="small" onClick={() => handleLogout(navigate)}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Drawer>

            {/* Main content */}
            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, overflow: 'auto' }}>
                {children}
            </Box>
        </Box>
    );
}