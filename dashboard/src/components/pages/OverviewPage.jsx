import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid, Box, Typography, Card, CardHeader, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Skeleton, LinearProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TopBar from '../layout/TopBar';
import StatCard from '../widgets/StatCard';
import LiveFeed from '../widgets/LiveFeed';
import ActiveVisitors from '../widgets/ActiveVisitors';
import { fetchDashboardStats } from '../../features/analytics/analyticsSlice';
import { selectAllSites, selectSelectedSite, fetchSites } from '../../features/sites/sitesSlice';
import { useAllSitesSubscription } from '../../hooks/useSocket';

function fmtDuration(s) {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function SiteStatsTable({ stats, loading }) {
  return (
    <Card>
      <CardHeader title={<Typography variant="h6">Performance par site</Typography>} />
      <CardContent sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Site</TableCell>
              <TableCell align="right">Pages vues</TableCell>
              <TableCell align="right">Visiteurs uniques</TableCell>
              <TableCell align="right">Sessions</TableCell>
              <TableCell align="right">Durée moy.</TableCell>
              <TableCell align="right">Scroll moy.</TableCell>
              <TableCell align="right">Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton animation="wave" /></TableCell>
                  ))}
                </TableRow>
              ))
              : stats.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.domain}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{fmtNum(s.total_visits)}</Typography>
                  </TableCell>
                  <TableCell align="right">{fmtNum(s.unique_visitors)}</TableCell>
                  <TableCell align="right">{fmtNum(s.sessions)}</TableCell>
                  <TableCell align="right">{s.avg_duration ? fmtDuration(Math.round(s.avg_duration)) : '—'}</TableCell>
                  <TableCell align="right">
                    {s.avg_scroll ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                        <Typography variant="body2">{s.avg_scroll}%</Typography>
                        <LinearProgress variant="determinate" value={parseFloat(s.avg_scroll)} sx={{ width: 40 }} />
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={s.is_active ? 'Actif' : 'Inactif'} color={s.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            }
            {!loading && stats.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Aucun site enregistré</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const dispatch = useDispatch();
  const stats = useSelector(s => s.analytics.dashboardStats);
  const loading = useSelector(s => !!s.analytics.loading.dashboard);
  const dateRange = useSelector(s => s.analytics.dateRange);
  const selectedSite = useSelector(selectSelectedSite);
  const sites = useSelector(selectAllSites);

  useAllSitesSubscription(sites);

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);
  useEffect(() => { dispatch(fetchDashboardStats(dateRange)); }, [dispatch, dateRange]);

  const totals = stats.reduce(
    (acc, s) => ({
      visits:   acc.visits   + (Number(s.total_visits)    || 0),
      unique:   acc.unique   + (Number(s.unique_visitors) || 0),
      sessions: acc.sessions + (Number(s.sessions)        || 0),
      bounces:  acc.bounces  + (Number(s.bounces)         || 0),
      avgDur:   acc.avgDur   + (Number(s.avg_duration)    || 0),
    }),
    { visits: 0, unique: 0, sessions: 0, bounces: 0, avgDur: 0 }
  );

  const bounceRate = totals.visits > 0 ? Math.round((totals.bounces / totals.visits) * 100) : 0;
  const avgDuration = stats.length > 0 ? Math.round(totals.avgDur / stats.length) : 0;

  return (
    <Box>
      <TopBar title="Vue d'ensemble" showDatePicker onRefresh={() => dispatch(fetchDashboardStats(dateRange))} />
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pages vues" value={fmtNum(totals.visits)}
              subtitle={`${sites.length} site(s) surveillé(s)`} icon={<VisibilityIcon />} color="#1a73e8" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Visiteurs uniques" value={fmtNum(totals.unique)}
              subtitle="Empreintes distinctes" icon={<PeopleIcon />} color="#00897b" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Durée moyenne" value={fmtDuration(avgDuration)}
              subtitle="Temps moyen sur page" icon={<TimerIcon />} color="#f57c00" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Taux de rebond" value={`${bounceRate}%`}
              subtitle="Visites d'une seule page" icon={<TrendingDownIcon />} color="#ea4335" loading={loading} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}><LiveFeed maxHeight={500} /></Grid>
          <Grid item xs={12} md={4}>
            {selectedSite
              ? <ActiveVisitors site_id={selectedSite.id} />
              : <Card sx={{ p: 4, display:'flex', alignItems:'center', justifyContent:'center' }}><Typography color="text.secondary">Aucun site configuré</Typography></Card>
            }
          </Grid>
          <Grid item xs={12}>
            <SiteStatsTable stats={stats} loading={loading} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
