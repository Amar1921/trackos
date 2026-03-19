import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1a73e8', light: '#4a9ef8', dark: '#0d47a1', contrastText: '#fff' },
    secondary: { main: '#00897b', light: '#4db6ac', dark: '#00574b' },
    success: { main: '#34a853', light: '#81c784', dark: '#1b5e20' },
    warning: { main: '#fbbc04', light: '#fff176', dark: '#f57f17' },
    error: { main: '#ea4335', light: '#ef9a9a', dark: '#b71c1c' },
    info: { main: '#4285f4' },
    background: { default: '#f0f4f9', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#6b7280' },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#6b7280' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)',
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.04)',
    ...Array(21).fill('none'),
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 12 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#f8fafc', color: '#374151' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4, height: 6 } },
    },
  },
});

export default theme;
