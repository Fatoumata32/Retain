import { useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/expenses', label: 'Expenses' },
  { to: '/admin', label: 'Insights', end: true, adminOnly: true },
  { to: '/admin/categories', label: 'Categories', adminOnly: true },
];

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 800, letterSpacing: 0.5, mr: 2 }}
          >
            Retain
          </Typography>

          <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {items.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.end}
                color="inherit"
                sx={{ opacity: 0.85, '&.active': { opacity: 1, bgcolor: 'rgba(255,255,255,0.18)' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.name}
            {isAdmin ? ' (admin)' : ''}
          </Typography>
          <Button color="inherit" onClick={handleSignOut} startIcon={<LogoutIcon />} aria-label="Sign out">
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Sign out
            </Box>
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Typography variant="h6" sx={{ p: 2, color: 'primary.main', fontWeight: 800 }}>
            Retain
          </Typography>
          <Divider />
          <List>
            {items.map((item) => (
              <ListItemButton key={item.to} component={NavLink} to={item.to} end={item.end}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
