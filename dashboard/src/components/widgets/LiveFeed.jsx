import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Card, CardContent, CardHeader, Typography, Chip, Divider, IconButton, Tooltip, Avatar, List, ListItem } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DevicesIcon from '@mui/icons-material/Devices';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletIcon from '@mui/icons-material/Tablet';
import ComputerIcon from '@mui/icons-material/Computer';
import { selectLiveFeed, selectSocketConnected } from '../../features/realtime/realtimeSlice';
import { useDispatch } from 'react-redux';
import { clearFeed } from '../../features/realtime/realtimeSlice';

const DEVICE_ICONS = {
  mobile: <SmartphoneIcon sx={{ fontSize: 14 }} />,
  tablet: <TabletIcon sx={{ fontSize: 14 }} />,
  desktop: <ComputerIcon sx={{ fontSize: 14 }} />,
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  return `${Math.floor(diff / 3600000)}h`;
}

export default function LiveFeed({ maxHeight = 420 }) {
  const dispatch = useDispatch();
  const feed = useSelector(selectLiveFeed);
  const connected = useSelector(selectSocketConnected);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiberManualRecordIcon sx={{ fontSize: 12, color: connected ? 'success.main' : 'error.main', animation: connected ? 'pulse 2s infinite' : 'none' }} />
            <Typography variant="h6">Flux en direct</Typography>
            {feed.length > 0 && <Chip label={feed.length} size="small" color="primary" />}
          </Box>
        }
        action={
          <Tooltip title="Effacer">
            <IconButton size="small" onClick={() => dispatch(clearFeed())}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ p: 0, maxHeight, overflowY: 'auto' }}>
        {feed.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <DevicesIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">En attente de visiteurs...</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {feed.map((item, i) => (
              <React.Fragment key={item._id}>
                <ListItem sx={{ px: 2, py: 1.5, alignItems: 'flex-start', gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.7rem', flexShrink: 0, mt: 0.5 }}>
                    {item.geo?.country_code || '??'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                        {item.page_title || 'Page sans titre'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
                        {timeAgo(item.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mb: 0.5, maxWidth: '100%' }}>
                      {item.page_url}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.geo?.city && (
                        <Chip label={`${item.geo.city}, ${item.geo.country}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                      )}
                      {item.device?.browser && (
                        <Chip label={item.device.browser} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                      )}
                      {item.device?.device_type && (
                        <Chip
                          icon={DEVICE_ICONS[item.device.device_type]}
                          label={item.device.device_type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {i < feed.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Card>
  );
}
