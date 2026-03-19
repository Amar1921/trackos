import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, AppBar, Toolbar, Typography, TextField, MenuItem, Chip, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { selectAllSites, selectSite } from '../../features/sites/sitesSlice';
import { setDateRange } from '../../features/analytics/analyticsSlice';

const DATE_PRESETS = [
  { label: "Aujourd'hui", days: 0 },
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
];

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

export default function TopBar({ title, onRefresh, showSiteSelector = false, showDatePicker = false }) {
  const dispatch = useDispatch();
  const sites = useSelector(selectAllSites);
  const selectedId = useSelector(s => s.sites.selectedId);
  const dateRange = useSelector(s => s.analytics.dateRange);

  return (
    <AppBar position="sticky" elevation={0} sx={{
      bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary',
    }}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', minHeight: '60px !important', py: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>{title}</Typography>

        {showSiteSelector && sites.length > 0 && (
          <TextField select size="small" value={selectedId || ''} onChange={e => dispatch(selectSite(Number(e.target.value)))} sx={{ minWidth: 180 }} label="Site">
            {sites.map(s => (
              <MenuItem key={s.id} value={s.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.is_active ? 'success.main' : 'error.main' }} />
                  {s.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        )}

        {showDatePicker && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {DATE_PRESETS.map(p => {
              const from = daysAgo(p.days);
              const to = daysAgo(0);
              const active = dateRange.from === from && dateRange.to === to;
              return (
                <Chip key={p.label} label={p.label} size="small" clickable
                  color={active ? 'primary' : 'default'}
                  onClick={() => dispatch(setDateRange({ from, to }))} />
              );
            })}
          </Box>
        )}

        {onRefresh && (
          <Tooltip title="Actualiser"><IconButton size="small" onClick={onRefresh}><RefreshIcon /></IconButton></Tooltip>
        )}
        <Tooltip title="Notifications"><IconButton size="small"><NotificationsNoneIcon /></IconButton></Tooltip>
      </Toolbar>
    </AppBar>
  );
}
