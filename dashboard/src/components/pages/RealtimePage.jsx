import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Card, CardHeader, CardContent, Typography, Chip } from '@mui/material';
import TopBar from '../../components/layout/TopBar';
import LiveFeed from '../../components/widgets/LiveFeed';
import ActiveVisitors from '../../components/widgets/ActiveVisitors';
import StatCard from '../../components/widgets/StatCard';
import { selectSelectedSite, selectAllSites, fetchSites } from '../../features/sites/sitesSlice';
import { selectActiveCount, selectSocketConnected } from '../../features/realtime/realtimeSlice';
import { useSiteSubscription, useAllSitesSubscription } from '../../hooks/useSocket';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StreamIcon from '@mui/icons-material/Stream';

export default function RealtimePage() {
  const dispatch = useDispatch();
  const sites = useSelector(selectAllSites);
  const selectedSite = useSelector(selectSelectedSite);
  const connected = useSelector(selectSocketConnected);
  const activeCount = useSelector(selectActiveCount(selectedSite?.id));

  useAllSitesSubscription(sites);

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);

  const totalActive = sites.reduce((sum, s) => {
    return sum + (useSelector ? 0 : 0); // computed per-site below
  }, 0);

  return (
    <Box>
      <TopBar title="Temps réel" showSiteSelector />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: connected ? 'success.main' : 'error.main',
            animation: connected ? 'pulse 2s infinite' : 'none',
          }} />
          <Typography variant="body2" color={connected ? 'success.main' : 'error.main'} fontWeight={600}>
            {connected ? 'Socket connecté — données en temps réel' : 'Socket déconnecté — reconnexion...'}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Visiteurs actifs"
              value={activeCount}
              subtitle={selectedSite ? `Sur ${selectedSite.name}` : 'Sélectionnez un site'}
              icon={<PeopleAltIcon />}
              color="#00897b"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Sites surveillés"
              value={sites.filter(s => s.is_active).length}
              subtitle={`${sites.length} sites enregistrés`}
              icon={<StreamIcon />}
              color="#1a73e8"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>Sites actifs</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {sites.map(s => (
                    <Chip
                      key={s.id}
                      label={s.name}
                      size="small"
                      color={s.is_active ? 'primary' : 'default'}
                      variant={s.is_active ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <LiveFeed maxHeight={560} />
          </Grid>

          <Grid item xs={12} md={4}>
            {selectedSite
              ? <ActiveVisitors site_id={selectedSite.id} />
              : (
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <Typography color="text.secondary" textAlign="center">
                    Sélectionnez un site pour voir les visiteurs actifs
                  </Typography>
                </Card>
              )
            }
          </Grid>
        </Grid>
      </Box>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}
