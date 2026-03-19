import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Grid, Card, CardHeader, CardContent, Typography,
    Chip, LinearProgress, Skeleton, Avatar, Divider, Table,
    TableHead, TableBody, TableRow, TableCell, Tooltip,
} from '@mui/material';
import VisibilityIcon       from '@mui/icons-material/Visibility';
import PeopleIcon           from '@mui/icons-material/People';
import TimerIcon            from '@mui/icons-material/Timer';
import TrendingDownIcon     from '@mui/icons-material/TrendingDown';
import TouchAppIcon         from '@mui/icons-material/TouchApp';
import PublicIcon           from '@mui/icons-material/Public';
import TopBar from '../layout/TopBar';
import StatCard from '../widgets/StatCard';
import {
    fetchGlobalStats, fetchGlobalTimeline, fetchGlobalCountries,
    fetchGlobalDevices, fetchGlobalTopPages, fetchGlobalPerSite,
} from '../../features/analytics/analyticsSlice';
import { fetchSites } from '../../features/sites/sitesSlice';

// ─── Couleurs palette ─────────────────────────────────────────────────────────
const PALETTE = [
    '#1a73e8','#00897b','#f57c00','#ea4335','#9c27b0',
    '#00bcd4','#8bc34a','#ff5722','#607d8b','#e91e63',
];
const DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

// ─── Hook Chart.js ────────────────────────────────────────────────────────────
function useChart(ref, config, deps) {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        // Détruire l'instance précédente
        if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
        if (!config) return;
        import('chart.js/auto').then(({ default: Chart }) => {
            if (!ref.current) return;
            chartRef.current = new Chart(ref.current, config);
        });
        return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
    }, deps); // eslint-disable-line
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
    if (!n) return '0';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `${(n/1000).toFixed(1)}k`;
    return String(n);
}
function fmtDur(s) {
    if (!s) return '0s';
    const m = Math.floor(s/60), sec = s%60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── Composants graphiques ────────────────────────────────────────────────────

function TimelineChart({ timeline, perSite, sites }) {
    const ref = useRef(null);

    const labels = [...new Set(timeline.map(r => r.period))].sort();

    // Datasets : visites globales + visiteurs uniques
    const visits  = labels.map(l => timeline.find(r => r.period === l)?.visits || 0);
    const uniques = labels.map(l => timeline.find(r => r.period === l)?.unique_visitors || 0);

    useChart(ref, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Pages vues',
                    data: visits,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26,115,232,0.08)',
                    borderWidth: 2.5,
                    pointRadius: labels.length > 30 ? 0 : 3,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Visiteurs uniques',
                    data: uniques,
                    borderColor: '#00897b',
                    backgroundColor: 'rgba(0,137,123,0.06)',
                    borderWidth: 2,
                    pointRadius: labels.length > 30 ? 0 : 3,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtNum(ctx.parsed.y)}` } },
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
                y: { grid: { color: '#f0f4f8' }, ticks: { font: { size: 11 }, callback: v => fmtNum(v) } },
            },
        },
    }, [timeline.length, perSite.length]);

    return (
        <Card>
            <CardHeader title={<Typography variant="h6">Trafic global — toutes sources</Typography>}
                        subheader={`${labels.length} périodes · ${fmtNum(visits.reduce((a,b)=>a+b,0))} pages vues au total`} />
            <CardContent>
                <Box sx={{ height: 300 }}><canvas ref={ref} /></Box>
            </CardContent>
        </Card>
    );
}

function PerSiteChart({ perSite, sites }) {
    const ref = useRef(null);

    // Construire datasets par site
    const allDates = [...new Set(perSite.map(r => r.period))].sort();
    const siteNames = [...new Set(perSite.map(r => r.site_name))];

    const datasets = siteNames.map((name, i) => ({
        label: name,
        data: allDates.map(d => perSite.find(r => r.period === d && r.site_name === name)?.visits || 0),
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: PALETTE[i % PALETTE.length] + '20',
        borderWidth: 2,
        pointRadius: allDates.length > 30 ? 0 : 3,
        tension: 0.4,
        fill: false,
    }));

    useChart(ref, {
        type: 'line',
        data: { labels: allDates, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
                y: { grid: { color: '#f0f4f8' }, ticks: { font: { size: 11 } } },
            },
        },
    }, [perSite.length]);

    return (
        <Card>
            <CardHeader title={<Typography variant="h6">Visites par site</Typography>}
                        subheader={`${siteNames.length} site(s) comparés`} />
            <CardContent>
                <Box sx={{ height: 280 }}><canvas ref={ref} /></Box>
            </CardContent>
        </Card>
    );
}

function DeviceDonut({ data, title, labelKey }) {
    const ref = useRef(null);
    const labels = data.map(d => d[labelKey] || 'Inconnu');
    const values = data.map(d => d.count);

    useChart(ref, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: PALETTE.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 6,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 }, padding: 8 } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
                            const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${fmtNum(ctx.parsed)} (${pct}%)`;
                        },
                    },
                },
            },
        },
    }, [data.length]);

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="h6">{title}</Typography>} />
            <CardContent>
                <Box sx={{ height: 200, position: 'relative' }}>
                    <canvas ref={ref} />
                </Box>
            </CardContent>
        </Card>
    );
}

function HourlyHeatmap({ hourly, weekday }) {
    const refH = useRef(null);
    const refW = useRef(null);

    // Heures 0-23
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);
    const hourData   = hourLabels.map((_, i) => hourly.find(h => h.hour === i)?.visits || 0);
    const maxH = Math.max(...hourData, 1);

    useChart(refH, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Visites',
                data: hourData,
                backgroundColor: hourData.map(v => `rgba(26,115,232,${0.2 + (v/maxH)*0.8})`),
                borderRadius: 4,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#f0f4f8' }, ticks: { font: { size: 10 }, callback: v => fmtNum(v) } },
            },
        },
    }, [hourly.length]);

    // Jours 1=Dim … 7=Sam
    const wdData = DAYS.map((_, i) => weekday.find(w => w.dow === i+1)?.visits || 0);
    const maxW = Math.max(...wdData, 1);

    useChart(refW, {
        type: 'bar',
        data: {
            labels: DAYS,
            datasets: [{
                label: 'Visites',
                data: wdData,
                backgroundColor: wdData.map(v => `rgba(0,137,123,${0.2 + (v/maxW)*0.8})`),
                borderRadius: 6,
                borderSkipped: false,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#f0f4f8' }, ticks: { font: { size: 11 } } },
            },
        },
    }, [weekday.length]);

    return (
        <>
            <Card>
                <CardHeader title={<Typography variant="h6">Visites par heure</Typography>}
                            subheader="Distribution horaire" />
                <CardContent><Box sx={{ height: 180 }}><canvas ref={refH} /></Box></CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
                <CardHeader title={<Typography variant="h6">Visites par jour de la semaine</Typography>}
                            subheader="Distribution hebdomadaire" />
                <CardContent><Box sx={{ height: 180 }}><canvas ref={refW} /></Box></CardContent>
            </Card>
        </>
    );
}

function CountriesChart({ countries }) {
    const ref  = useRef(null);
    const top8 = countries.slice(0, 8);

    useChart(ref, {
        type: 'bar',
        data: {
            labels: top8.map(c => c.country || 'Inconnu'),
            datasets: [
                {
                    label: 'Pages vues',
                    data: top8.map(c => c.visits),
                    backgroundColor: PALETTE[0] + 'cc',
                    borderRadius: 6,
                },
                {
                    label: 'Visiteurs uniques',
                    data: top8.map(c => c.unique_visitors),
                    backgroundColor: PALETTE[1] + 'cc',
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#f0f4f8' }, ticks: { font: { size: 11 }, callback: v => fmtNum(v) } },
            },
        },
    }, [countries.length]);

    return (
        <Card>
            <CardHeader title={<Typography variant="h6">Top pays</Typography>}
                        subheader={`${countries.length} pays détectés`} />
            <CardContent>
                <Box sx={{ height: 260 }}><canvas ref={ref} /></Box>
            </CardContent>
        </Card>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function GlobalStatsPage() {
    const dispatch   = useDispatch();
    const dateRange  = useSelector(s => s.analytics.dateRange);
    const sites      = useSelector(s => s.sites.items ?? []);

    const kpis       = useSelector(s => s.analytics.globalStats      ?? {});
    const timeline   = useSelector(s => s.analytics.globalTimeline   ?? []);
    const countries  = useSelector(s => s.analytics.globalCountries  ?? []);
    const devicesRaw = useSelector(s => s.analytics.globalDevices    ?? {});
    const topPages   = useSelector(s => s.analytics.globalTopPages   ?? []);
    const perSite    = useSelector(s => s.analytics.globalPerSite    ?? []);
    const loading    = useSelector(s => !!s.analytics.loading.globalStats);

    const { browsers = [], devices = [], oses = [], hourly = [], weekday = [] } = devicesRaw;

    const load = useCallback(() => {
        dispatch(fetchSites());
        dispatch(fetchGlobalStats(dateRange));
        dispatch(fetchGlobalTimeline(dateRange));
        dispatch(fetchGlobalCountries(dateRange));
        dispatch(fetchGlobalDevices(dateRange));
        dispatch(fetchGlobalTopPages({ ...dateRange, limit: 10 }));
        dispatch(fetchGlobalPerSite(dateRange));
    }, [dispatch, dateRange]);

    useEffect(() => { load(); }, [load]);

    const bounceRate = kpis.total_visits > 0
        ? Math.round((kpis.bounces / kpis.total_visits) * 100) : 0;

    return (
        <Box>
            <TopBar title="Statistiques globales" showDatePicker onRefresh={load} />

            <Box sx={{ p: 3 }}>

                {/* ── KPIs ─────────────────────────────────────────────────────── */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { title: 'Pages vues',       value: fmtNum(kpis.total_visits),    sub: 'Toutes sources',          icon: <VisibilityIcon />,   color: '#1a73e8' },
                        { title: 'Visiteurs uniques', value: fmtNum(kpis.unique_visitors), sub: 'Empreintes distinctes',   icon: <PeopleIcon />,       color: '#00897b' },
                        { title: 'Sessions',         value: fmtNum(kpis.sessions),        sub: 'Visites comptabilisées',   icon: <TouchAppIcon />,     color: '#9c27b0' },
                        { title: 'Durée moyenne',    value: fmtDur(kpis.avg_duration),    sub: 'Temps sur page',          icon: <TimerIcon />,        color: '#f57c00' },
                        { title: 'Scroll moyen',     value: `${kpis.avg_scroll ?? 0}%`,   sub: 'Profondeur de lecture',   icon: <PublicIcon />,       color: '#00bcd4' },
                        { title: 'Taux de rebond',   value: `${bounceRate}%`,             sub: '1 page visitée',          icon: <TrendingDownIcon />, color: '#ea4335' },
                    ].map((s, i) => (
                        <Grid item xs={6} sm={4} md={2} key={i}>
                            <StatCard {...s} loading={loading} subtitle={s.sub} />
                        </Grid>
                    ))}
                </Grid>

                {/* ── Timeline globale + par site ───────────────────────────────── */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                        {timeline.length > 0
                            ? <TimelineChart timeline={timeline} perSite={perSite} sites={sites} />
                            : <Card><CardContent sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">Aucune donnée sur la période</Typography></CardContent></Card>
                        }
                    </Grid>
                    {perSite.length > 0 && sites.length > 1 && (
                        <Grid item xs={12}>
                            <PerSiteChart perSite={perSite} sites={sites} />
                        </Grid>
                    )}
                </Grid>

                {/* ── Devices + Browsers + OS ───────────────────────────────────── */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                        <DeviceDonut data={devices}  title="Types d'appareils" labelKey="device_type" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DeviceDonut data={browsers} title="Navigateurs"        labelKey="browser" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DeviceDonut data={oses}     title="Systèmes d'exploitation" labelKey="os" />
                    </Grid>
                </Grid>

                {/* ── Pays + Horaires ──────────────────────────────────────────── */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={7}>
                        <CountriesChart countries={countries} />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <HourlyHeatmap hourly={hourly} weekday={weekday} />
                    </Grid>
                </Grid>

                {/* ── Top pages globales ────────────────────────────────────────── */}
                <Card>
                    <CardHeader
                        title={<Typography variant="h6">Top pages — toutes sources</Typography>}
                        subheader={`${topPages.length} pages les plus visitées`}
                    />
                    <CardContent sx={{ p: 0 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Site</TableCell>
                                    <TableCell>Page</TableCell>
                                    <TableCell align="right">Vues</TableCell>
                                    <TableCell align="right">Visiteurs</TableCell>
                                    <TableCell align="right">Durée moy.</TableCell>
                                    <TableCell>Popularité</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {topPages.map((p, i) => {
                                    const maxViews = topPages[0]?.views || 1;
                                    return (
                                        <TableRow key={i} hover>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                    {i + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={p.site_name} size="small" variant="outlined"
                                                      sx={{ fontSize: '0.65rem', height: 20 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={p.page_url}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
                                                            {p.page_title || 'Sans titre'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 260 }}>
                                                            {p.page_url}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={700}>{fmtNum(p.views)}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{fmtNum(p.unique_visitors)}</TableCell>
                                            <TableCell align="right">{p.avg_duration ? `${p.avg_duration}s` : '—'}</TableCell>
                                            <TableCell sx={{ width: 120 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(p.views / maxViews) * 100}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {topPages.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">Aucune page visitée sur la période</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* ── Pays liste complète ───────────────────────────────────────── */}
                {countries.length > 0 && (
                    <Card sx={{ mt: 2 }}>
                        <CardHeader title={<Typography variant="h6">Répartition géographique complète</Typography>} />
                        <CardContent sx={{ p: 0 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>Pays</TableCell>
                                        <TableCell align="right">Visites</TableCell>
                                        <TableCell align="right">Visiteurs uniques</TableCell>
                                        <TableCell>Part</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {countries.map((c, i) => {
                                        const total = countries.reduce((a, b) => a + b.visits, 0);
                                        const pct   = total > 0 ? ((c.visits / total) * 100).toFixed(1) : 0;
                                        return (
                                            <TableRow key={i} hover>
                                                <TableCell><Typography variant="caption" color="text.secondary" fontWeight={700}>{i+1}</Typography></TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: PALETTE[i % PALETTE.length] }}>
                                                            {c.country_code || '??'}
                                                        </Avatar>
                                                        <Typography variant="body2">{c.country || 'Inconnu'}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmtNum(c.visits)}</Typography></TableCell>
                                                <TableCell align="right">{fmtNum(c.unique_visitors)}</TableCell>
                                                <TableCell sx={{ width: 140 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinearProgress variant="determinate" value={parseFloat(pct)}
                                                                        sx={{ flexGrow: 1, height: 5, borderRadius: 3 }} />
                                                        <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

            </Box>
        </Box>
    );
}