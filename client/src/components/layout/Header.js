import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Chip,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useCaspar } from '../../contexts/CasparContext';
import { useAuth } from '../../contexts/AuthContext';
import ProfileSelector from './ProfileSelector';

const Header = ({ sidebarOpen, toggleSidebar, openConnectionDialog }) => {
  const navigate = useNavigate();
  const { connected, host, port, disconnect } = useCaspar();
  const { user, signOut } = useAuth();

  // Stato per il menu utente
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Ottieni il nome visualizzato dell'utente
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Utente';

  // Ottieni l'iniziale per l'avatar
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleDisconnect = async () => {
    await disconnect();
    openConnectionDialog();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Gestione del menu utente
  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  // Gestione del logout
  const handleLogout = async () => {
    handleCloseUserMenu();
    await signOut();
    navigate('/auth');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1a1a1a',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="CasparCG Control Web"
            sx={{
              height: 32,
              mr: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          />
          CasparCG Control Web
        </Typography>

        {/* Selettore di profili */}
        <ProfileSelector />

        {connected ? (
          <Chip
            label={`Connesso a ${host}:${port}`}
            color="success"
            size="small"
            sx={{ mr: 2 }}
          />
        ) : (
          <Chip
            label="Non connesso"
            color="error"
            size="small"
            sx={{ mr: 2 }}
          />
        )}

        {connected ? (
          <Tooltip title="Disconnetti">
            <IconButton
              color="inherit"
              onClick={handleDisconnect}
              sx={{ mr: 1 }}
            >
              <PowerSettingsNewIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={openConnectionDialog}
            sx={{ mr: 1 }}
          >
            Connetti
          </Button>
        )}

        <Tooltip title="Impostazioni">
          <IconButton
            color="inherit"
            onClick={handleSettings}
            sx={{ mr: 1 }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* Menu utente */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Profilo utente">
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {userInitial}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseUserMenu}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem>
              <Avatar sx={{ bgcolor: 'primary.main' }}>{userInitial}</Avatar>
              <Typography variant="body1">{displayName}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSettings}>
              <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
              Impostazioni
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
