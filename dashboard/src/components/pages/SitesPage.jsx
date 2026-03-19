import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip,
  Tooltip, Snackbar, Alert, Switch, FormControlLabel, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import TopBar from '../../components/layout/TopBar';
import { fetchSites, createSite, deleteSite, updateSite, regenerateKey, selectAllSites } from '../../features/sites/sitesSlice';

const TRACK_SERVER = import.meta.env.VITE_SOCKET_URL || 'https://trackos.amarsyll.pro';

export default function SitesPage() {
  const dispatch = useDispatch();
  const sites = useSelector(selectAllSites);
  const loading = useSelector(s => s.sites.loading);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [form, setForm] = useState({ name: '', domain: '' });
  const [snippetSite, setSnippetSite] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);

  function openCreate() { setEditSite(null); setForm({ name: '', domain: '' }); setDialogOpen(true); }
  function openEdit(site) { setEditSite(site); setForm({ name: site.name, domain: site.domain, is_active: site.is_active }); setDialogOpen(true); }

  async function handleSubmit() {
    if (editSite) {
      await dispatch(updateSite({ id: editSite.id, ...form }));
      toast('Site mis à jour');
    } else {
      await dispatch(createSite(form));
      toast('Site créé avec succès');
    }
    setDialogOpen(false);
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce site et toutes ses données ?')) return;
    dispatch(deleteSite(id));
    toast('Site supprimé', 'info');
  }

  async function handleRegenKey(id) {
    if (!confirm('Régénérer la clé ? L\'ancien script de tracking ne fonctionnera plus.')) return;
    dispatch(regenerateKey(id));
    toast('Clé régénérée', 'warning');
  }

  function toast(msg, severity = 'success') {
    setSnack({ open: true, msg, severity });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast('Copié !');
  }

  function getSnippet(site) {
    return `<!-- TrackOS Tracking Script -->\n<script defer\n  src="${TRACK_SERVER}/track.js"\n  data-site-key="${site.site_key}"\n></script>`;
  }

  return (
    <Box>
      <TopBar title="Mes sites" onRefresh={() => dispatch(fetchSites())} />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Ajouter un site
          </Button>
        </Box>

        <Grid container spacing={2}>
          {sites.map((site) => (
            <Grid item xs={12} md={6} lg={4} key={site.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{site.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{site.domain}</Typography>
                    </Box>
                    <Chip
                      label={site.is_active ? 'Actif' : 'Inactif'}
                      color={site.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                      SITE KEY
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', flexGrow: 1 }}>
                        {site.site_key}
                      </Typography>
                      <Tooltip title="Copier la clé">
                        <IconButton size="small" onClick={() => copyToClipboard(site.site_key)}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Créé le {new Date(site.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, gap: 0.5, flexWrap: 'wrap' }}>
                  <Tooltip title="Voir le snippet HTML">
                    <Button size="small" variant="outlined" startIcon={<CodeIcon />} onClick={() => setSnippetSite(site)}>
                      Snippet
                    </Button>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => openEdit(site)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Régénérer la clé">
                    <IconButton size="small" color="warning" onClick={() => handleRegenKey(site.id)}><RefreshIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton size="small" color="error" onClick={() => handleDelete(site.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editSite ? 'Modifier le site' : 'Ajouter un site'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label="Nom du site" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth required />
          <TextField label="Domaine" placeholder="monsite.com" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} fullWidth required />
          {editSite && (
            <FormControlLabel
              control={<Switch checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} />}
              label="Site actif"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.name || !form.domain}>
            {editSite ? 'Sauvegarder' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog snippet */}
      <Dialog open={!!snippetSite} onClose={() => setSnippetSite(null)} maxWidth="md" fullWidth>
        <DialogTitle>Script de tracking — {snippetSite?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Collez ce snippet avant la fermeture de la balise <code>&lt;/body&gt;</code> de votre site :
          </Typography>
          <Box sx={{ bgcolor: '#1e293b', borderRadius: 2, p: 2, position: 'relative' }}>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8, color: '#94a3b8' }}
              onClick={() => copyToClipboard(getSnippet(snippetSite))}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', m: 0 }}>
              {snippetSite && getSnippet(snippetSite)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 Pour tracker des events custom : <code>window.trackos.event('click', 'btn-cta', {'{ page: "home" }'})</code>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnippetSite(null)}>Fermer</Button>
          <Button variant="contained" onClick={() => copyToClipboard(getSnippet(snippetSite))}>Copier</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
