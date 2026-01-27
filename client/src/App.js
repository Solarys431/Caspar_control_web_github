import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MediaBrowser from './pages/MediaBrowser';
import PlayoutControl from './pages/PlayoutControl';
import GraphicsEditor from './pages/GraphicsEditor';
import MixerControl from './pages/MixerControl';
import Rundown from './pages/Rundown';
import ScaletteEditor from './pages/ScaletteEditor/index';
import ScaletteSelector from './pages/ScaletteSelector';
import Settings from './pages/Settings';
import CasparProfilesAdmin from './pages/CasparProfilesAdmin';
import Auth from './pages/Auth';
import ConnectionDialog from './components/dialogs/ConnectionDialog';
import { useCaspar } from './contexts/CasparContext';
import { RundownProvider } from './contexts/RundownContext';
import { AuthProvider } from './contexts/AuthContext';
import { CasparProfileProvider } from './contexts/CasparProfileContext';
import { CalendarProvider } from './contexts/CalendarContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { connected } = useCaspar();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(!connected);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseConnectionDialog = () => {
    setConnectionDialogOpen(false);
  };

  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <CssBaseline />

        <Routes>
          {/* Rotta pubblica per l'autenticazione */}
          <Route path="/auth" element={<Auth />} />

          {/* Rotte protette che richiedono autenticazione */}
          <Route path="/*" element={
            <ProtectedRoute>
              <CasparProfileProvider>
                <Header
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={toggleSidebar}
                  openConnectionDialog={() => setConnectionDialogOpen(true)}
                />

                <Sidebar open={sidebarOpen} />

                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    p: 2,
                    mt: 8,
                    overflow: 'auto',
                    backgroundColor: (theme) => theme.palette.background.default,
                  }}
                >
                  <RundownProvider>
                    <CalendarProvider>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/media" element={<MediaBrowser />} />
                        <Route path="/playout" element={<PlayoutControl />} />
                        <Route path="/graphics" element={<GraphicsEditor />} />
                        <Route path="/mixer" element={<MixerControl />} />
                        <Route path="/rundown" element={<Rundown />} />
                        <Route path="/scalette" element={<ScaletteSelector />} />
                        <Route path="/scalette/:id" element={<ScaletteEditor />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/caspar-profiles-admin" element={<CasparProfilesAdmin />} />
                      </Routes>
                    </CalendarProvider>
                  </RundownProvider>
                </Box>

                <ConnectionDialog
                  open={connectionDialogOpen}
                  onClose={handleCloseConnectionDialog}
                />
              </CasparProfileProvider>
            </ProtectedRoute>
          } />
        </Routes>
        </Box>
    </AuthProvider>
  );
}

export default App;
