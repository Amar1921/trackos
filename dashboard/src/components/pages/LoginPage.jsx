import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StreamIcon from '@mui/icons-material/Stream';

const SYMFONY_LOGIN_URL = import.meta.env.VITE_SYMFONY_LOGIN_URL || 'http://127.0.0.1:8000/login_verify';

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm]       = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(SYMFONY_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data?.message || data?.error || 'Identifiants incorrects');
            }

            const token = data.token;
            if (!token) throw new Error('Token absent dans la réponse Symfony');

            // Stocker AVANT la navigation (useNavigate = pas de reload)
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('trackos_user', JSON.stringify({
                id:       data.user.id,
                fullname: data.user.fullname,
                email:    data.user.email,
                roles:    data.user.roles,
            }));

            // useNavigate au lieu de window.location.href
            // → évite un reload complet qui peut provoquer une race condition
            navigate('/', { replace: true });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
        }}>
            <Card sx={{ width: '100%', maxWidth: 400 }}>
                <CardContent sx={{ p: 4 }}>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1a73e8, #4a9ef8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <StreamIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="primary.main" lineHeight={1}>TrackOS</Typography>
                            <Typography variant="caption" color="text.secondary">Analytics Dashboard</Typography>
                        </Box>
                    </Box>

                    <Typography variant="h5" fontWeight={700} gutterBottom>Connexion</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Accès réservé aux administrateurs
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email" type="email" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            fullWidth required autoFocus autoComplete="email"
                        />
                        <TextField
                            label="Mot de passe" type={showPwd ? 'text' : 'password'} value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            fullWidth required autoComplete="current-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end">
                                            {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button type="submit" variant="contained" size="large" fullWidth
                                disabled={loading || !form.email || !form.password} sx={{ mt: 1 }}>
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}