import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardContent, Box, Typography, Avatar, Chip, Divider, List, ListItem, LinearProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { selectActiveVisitors, selectActiveCount } from '../../features/realtime/realtimeSlice';

export default function ActiveVisitors({ site_id }) {
  const count = useSelector(selectActiveCount(site_id));
  const visitors = useSelector(selectActiveVisitors(site_id));

  const byCountry = visitors.reduce((acc, v) => {
    const key = v.country || 'Inconnu';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const countryList = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Card>
      <CardHeader
        avatar={<Box sx={{ bgcolor: 'success.main', borderRadius: '8px', p: 0.8, display: 'flex' }}><PeopleIcon sx={{ color: '#fff', fontSize: 20 }} /></Box>}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Visiteurs actifs</Typography>
            <Chip label={count} color="success" size="small" sx={{ fontWeight: 700 }} />
          </Box>
        }
        subheader="Sur les 5 dernières minutes"
      />
      <Divider />
      <CardContent>
        {visitors.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Aucun visiteur actif
          </Typography>
        ) : (
          <>
            {/* Par pays */}
            {countryList.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                  PAR PAYS
                </Typography>
                {countryList.map(([country, cnt]) => (
                  <Box key={country} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption">{country}</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={600}>{cnt}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(cnt / count) * 100} sx={{ height: 4, borderRadius: 2 }} />
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Liste visiteurs */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              ACTIFS MAINTENANT
            </Typography>
            <List disablePadding>
              {visitors.slice(0, 8).map((v) => (
                <ListItem key={v.session_id} disablePadding sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.65rem' }}>
                      {v.country_code || '??'}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="caption" fontWeight={600} noWrap display="block">
                        {v.page_title || v.page_url}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {v.city} · {v.browser} · {v.device_type}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
                  </Box>
                </ListItem>
              ))}
              {visitors.length > 8 && (
                <Typography variant="caption" color="text.secondary">
                  +{visitors.length - 8} autres...
                </Typography>
              )}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
}
