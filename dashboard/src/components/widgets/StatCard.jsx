import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function StatCard({ title, value, subtitle, icon, color = 'primary.main', loading, trend, trendLabel }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            bgcolor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </Box>
        </Box>

        {loading ? (
          <>
            <Skeleton width="60%" height={40} />
            <Skeleton width="40%" height={20} />
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              {value ?? '—'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {trend != null && (
                trend >= 0
                  ? <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  : <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography variant="caption" color="text.secondary">
                {trendLabel || subtitle}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
