import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MovieIcon from '@mui/icons-material/Movie';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BrushIcon from '@mui/icons-material/Brush';
import TuneIcon from '@mui/icons-material/Tune';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';

// Larghezza della sidebar
const drawerWidth = 240;

// Elementi della sidebar
const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    tooltip: 'Panoramica generale'
  },
  {
    text: 'Browser Media',
    icon: <MovieIcon />,
    path: '/media',
    tooltip: 'Sfoglia e gestisci i file multimediali'
  },
  {
    text: 'Controllo Playout',
    icon: <PlayArrowIcon />,
    path: '/playout',
    tooltip: 'Controlla la riproduzione dei media'
  },
  {
    text: 'Editor Grafica',
    icon: <BrushIcon />,
    path: '/graphics',
    tooltip: 'Crea e modifica template grafici'
  },
  {
    text: 'Controllo Mixer',
    icon: <TuneIcon />,
    path: '/mixer',
    tooltip: 'Regola posizione, scala, opacità, ecc.'
  },
  {
    text: 'Rundown',
    icon: <PlaylistPlayIcon />,
    path: '/rundown',
    tooltip: 'Crea e gestisci playlist'
  },
  {
    text: 'Editor Scalette',
    icon: <EditIcon />,
    path: '/scalette',
    tooltip: 'Crea e modifica scalette con anteprima'
  },
  {
    text: 'Impostazioni',
    icon: <SettingsIcon />,
    path: '/settings',
    tooltip: 'Configura l\'applicazione'
  }
];

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <Tooltip key={item.text} title={item.tooltip} placement="right">
              <ListItem
                button
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.16)',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.24)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  borderRadius: '4px',
                  mx: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary'
                  }}
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>
        <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        <List>
          <ListItem
            button
            component="a"
            href="https://github.com/CasparCG/server/wiki"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              borderRadius: '4px',
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText
              primary="Documentazione"
              primaryTypographyProps={{
                variant: 'body2',
                color: 'text.primary'
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
