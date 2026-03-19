import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardHeader, CardContent, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Avatar, TextField, InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletIcon from '@mui/icons-material/Tablet';
import TopBar from '../../components/layout/TopBar';
import { fetchRecentVisits } from '../../features/analytics/analyticsSlice';
import { selectSelectedSite, fetchSites } from '../../features/sites/sitesSlice';

const DEVICE_ICONS = {
  desktop: <ComputerIcon sx={{ fontSize: 16 }} />,
  mobile: <SmartphoneIcon sx={{ fontSize: 16 }} />,
  tablet: <TabletIcon sx={{ fontSize: 16 }} />,
};

const DEVICE_COLORS = { desktop: 'info', mobile: 'success', tablet: 'warning', bot: 'default' };

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return `il y a ${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return new Date(ts).toLocaleDateString('fr-FR');
}

export default function VisitorsPage() {
  const dispatch = useDispatch();
  const selectedSite = useSelector(selectSelectedSite);
  const visits = useSelector(s => s.analytics.recentVisits);
  const loading = useSelector(s => s.analytics.loading.recentVisits);
  const dateRange = useSelector(s => s.analytics.dateRange);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);

  useEffect(() => {
    if (!selectedSite) return;
    dispatch(fetchRecentVisits({ site_id: selectedSite.id, limit: 100 }));
  }, [dispatch, selectedSite, dateRange]);

  const filtered = visits.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.page_url?.toLowerCase().includes(q) ||
      v.page_title?.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.browser?.toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      <TopBar title="Visiteurs" showSiteSelector showDatePicker
        onRefresh={() => selectedSite && dispatch(fetchRecentVisits({ site_id: selectedSite.id, limit: 100 }))} />

      <Box sx={{ p: 3 }}>
        <Card>
          <CardHeader
            title={<Typography variant="h6">Visites récentes</Typography>}
            subheader={selectedSite ? `${filtered.length} visites sur ${selectedSite.name}` : 'Sélectionnez un site'}
            action={
              <TextField
                size="small"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
                sx={{ width: 220 }}
              />
            }
          />
          <CardContent sx={{ p: 0, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Visiteur</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Localisation</TableCell>
                  <TableCell>Navigateur / OS</TableCell>
                  <TableCell>Appareil</TableCell>
                  <TableCell align="right">Durée</TableCell>
                  <TableCell align="right">Scroll</TableCell>
                  <TableCell align="right">Rebond</TableCell>
                  <TableCell align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} hover>
                    {/* Visiteur */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.6rem' }}>
                          {v.country_code || '??'}
                        </Avatar>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {v.visitor_id?.slice(0, 8) || '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Page */}
                    <TableCell>
                      <Tooltip title={v.page_url}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                            {v.page_title || 'Sans titre'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 200 }}>
                            {v.page_url}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* Localisation */}
                    <TableCell>
                      <Typography variant="body2">{v.country || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.city || ''}</Typography>
                    </TableCell>

                    {/* Browser/OS */}
                    <TableCell>
                      <Typography variant="body2">{v.browser || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.os || ''}</Typography>
                    </TableCell>

                    {/* Device */}
                    <TableCell>
                      <Chip
                        icon={DEVICE_ICONS[v.device_type] || DEVICE_ICONS.desktop}
                        label={v.device_type || 'desktop'}
                        size="small"
                        color={DEVICE_COLORS[v.device_type] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>

                    {/* Durée */}
                    <TableCell align="right">
                      <Typography variant="body2">{v.duration_seconds ? `${v.duration_seconds}s` : '—'}</Typography>
                    </TableCell>

                    {/* Scroll */}
                    <TableCell align="right">
                      <Typography variant="body2">{v.scroll_depth_pct != null ? `${v.scroll_depth_pct}%` : '—'}</Typography>
                    </TableCell>

                    {/* Rebond */}
                    <TableCell align="right">
                      <Chip
                        label={v.is_bounce ? 'Oui' : 'Non'}
                        size="small"
                        color={v.is_bounce ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {timeAgo(v.visited_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {selectedSite ? 'Aucune visite trouvée' : 'Sélectionnez un site'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
