import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Card, CardHeader, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress, Chip } from '@mui/material';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import TopBar from '../../components/layout/TopBar';
import { fetchTimeline, fetchTopPages, fetchCountries, fetchDevices } from '../../features/analytics/analyticsSlice';
import { selectSelectedSite, fetchSites } from '../../features/sites/sitesSlice';

const COLORS = ['#1a73e8', '#00897b', '#f57c00', '#ea4335', '#9c27b0', '#00bcd4', '#8bc34a', '#ff5722'];

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const selectedSite = useSelector(selectSelectedSite);
  const dateRange = useSelector(s => s.analytics.dateRange);
  const timeline = useSelector(s => s.analytics.timeline);
  const topPages = useSelector(s => s.analytics.topPages);
  const countries = useSelector(s => s.analytics.countries);
  const devices = useSelector(s => s.analytics.devices);
  const loading = useSelector(s => s.analytics.loading);

  useEffect(() => {
    dispatch(fetchSites());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedSite) return;
    const p = { site_id: selectedSite.id, ...dateRange };
    dispatch(fetchTimeline(p));
    dispatch(fetchTopPages(p));
    dispatch(fetchCountries(p));
    dispatch(fetchDevices(p));
  }, [dispatch, selectedSite, dateRange]);

  const refresh = () => {
    if (!selectedSite) return;
    const p = { site_id: selectedSite.id, ...dateRange };
    dispatch(fetchTimeline(p));
    dispatch(fetchTopPages(p));
    dispatch(fetchCountries(p));
    dispatch(fetchDevices(p));
  };

  const maxViews = Math.max(...(topPages.map(p => p.views) || [1]));

  return (
    <Box>
      <TopBar title="Analytics" showSiteSelector showDatePicker onRefresh={refresh} />

      <Box sx={{ p: 3 }}>
        {!selectedSite ? (
          <Typography color="text.secondary">Sélectionnez un site pour voir les analytics</Typography>
        ) : (
          <Grid container spacing={2}>
            {/* Timeline */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title={<Typography variant="h6">Trafic sur la période</Typography>} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gUnique" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00897b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#00897b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="visits" name="Pages vues" stroke="#1a73e8" strokeWidth={2} fill="url(#gVisits)" />
                      <Area type="monotone" dataKey="unique_visitors" name="Visiteurs uniques" stroke="#00897b" strokeWidth={2} fill="url(#gUnique)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top pages */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title={<Typography variant="h6">Top pages</Typography>} />
                <CardContent sx={{ p: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Page</TableCell>
                        <TableCell align="right">Vues</TableCell>
                        <TableCell align="right">Durée moy.</TableCell>
                        <TableCell align="right">Scroll moy.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topPages.map((p, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>
                              {p.page_title || p.page_url}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 280 }}>
                              {p.page_url}
                            </Typography>
                            <LinearProgress variant="determinate" value={(p.views / maxViews) * 100} sx={{ mt: 0.5, height: 3 }} />
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={700}>{p.views}</Typography></TableCell>
                          <TableCell align="right">{p.avg_duration ? `${p.avg_duration}s` : '—'}</TableCell>
                          <TableCell align="right">{p.avg_scroll ? `${p.avg_scroll}%` : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Pays */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title={<Typography variant="h6">Pays</Typography>} />
                <CardContent>
                  {countries.slice(0, 10).map((c, i) => (
                    <Box key={i} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{c.country || 'Inconnu'}</Typography>
                        <Typography variant="body2" fontWeight={700}>{c.visits}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(c.visits / (countries[0]?.visits || 1)) * 100}
                        sx={{ height: 5 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Navigateurs */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={<Typography variant="h6">Navigateurs</Typography>} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={devices.browsers} dataKey="count" nameKey="browser" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {devices.browsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Appareils */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={<Typography variant="h6">Types d'appareils</Typography>} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={devices.devices} dataKey="count" nameKey="device_type" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {devices.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* OS */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={<Typography variant="h6">Systèmes d'exploitation</Typography>} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={devices.oses} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="os" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip />
                      <Bar dataKey="count" name="Visites" radius={[0, 4, 4, 0]}>
                        {devices.oses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
