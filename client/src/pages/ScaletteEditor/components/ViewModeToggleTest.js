/**
 * Componente di test per verificare il funzionamento del ViewModeToggle
 * Questo componente testa il toggle in isolamento per identificare problemi
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Divider,
  Chip
} from '@mui/material';
import ViewModeToggle, { useViewMode } from './ViewModeToggle';

/**
 * Test del ViewModeToggle in isolamento
 */
const ViewModeToggleTest = () => {
  // Test con stato locale
  const [localMode, setLocalMode] = useState('compact');
  
  // Test con hook personalizzato
  const [hookMode, setHookMode] = useViewMode('compact', 'test-view-mode');
  
  // Test con diversi item count
  const [itemCount, setItemCount] = useState(20);

  // Handler per debug
  const handleLocalChange = (newMode) => {
    console.log('🔄 Local mode change:', newMode);
    setLocalMode(newMode);
  };

  const handleHookChange = (newMode) => {
    console.log('🔄 Hook mode change:', newMode);
    setHookMode(newMode);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 ViewModeToggle Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test del componente ViewModeToggle per verificare il funzionamento del click
      </Typography>

      {/* Test 1: Toggle con stato locale */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 1: Stato Locale
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ViewModeToggle
            value={localMode}
            onChange={handleLocalChange}
            itemCount={itemCount}
            showLabels={false}
            showRecommendation={true}
            size="medium"
          />
          
          <Chip 
            label={`Modalità: ${localMode}`}
            color={localMode === 'compact' ? 'warning' : 'secondary'}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Stato corrente: {localMode}
        </Typography>
      </Paper>

      {/* Test 2: Toggle con hook personalizzato */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 2: Hook Personalizzato (con persistenza)
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ViewModeToggle
            value={hookMode}
            onChange={handleHookChange}
            itemCount={itemCount}
            showLabels={true}
            showRecommendation={true}
            size="medium"
          />
          
          <Chip 
            label={`Modalità: ${hookMode}`}
            color={hookMode === 'compact' ? 'warning' : 'secondary'}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Stato con persistenza: {hookMode}
        </Typography>
      </Paper>

      {/* Test 3: Controlli per item count */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 3: Raccomandazioni Automatiche
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Typography variant="body2">Numero elementi:</Typography>
          {[5, 20, 60, 100].map(count => (
            <Button
              key={count}
              variant={itemCount === count ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setItemCount(count)}
            >
              {count}
            </Button>
          ))}
        </Box>
        
        <ViewModeToggle
          value={localMode}
          onChange={handleLocalChange}
          itemCount={itemCount}
          showLabels={true}
          showRecommendation={true}
          size="large"
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Con {itemCount} elementi, la raccomandazione dovrebbe essere: {itemCount < 10 ? 'Detailed' : itemCount > 50 ? 'Compact' : 'Nessuna'}
        </Typography>
      </Paper>

      {/* Test 4: Varianti diverse */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 4: Varianti e Dimensioni
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Small:</Typography>
            <ViewModeToggle
              value={localMode}
              onChange={handleLocalChange}
              itemCount={itemCount}
              size="small"
              showLabels={false}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Medium:</Typography>
            <ViewModeToggle
              value={localMode}
              onChange={handleLocalChange}
              itemCount={itemCount}
              size="medium"
              showLabels={false}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Large:</Typography>
            <ViewModeToggle
              value={localMode}
              onChange={handleLocalChange}
              itemCount={itemCount}
              size="large"
              showLabels={true}
            />
          </Box>
        </Box>
      </Paper>

      {/* Debug Info */}
      <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          🔍 Debug Info
        </Typography>
        
        <Typography variant="caption" component="div">
          • Local State: {localMode}
        </Typography>
        <Typography variant="caption" component="div">
          • Hook State: {hookMode}
        </Typography>
        <Typography variant="caption" component="div">
          • Item Count: {itemCount}
        </Typography>
        <Typography variant="caption" component="div">
          • LocalStorage Key: test-view-mode
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Come testare:</strong>
            <br />
            1. Clicca sui toggle per cambiare modalità
            <br />
            2. Verifica che lo stato si aggiorni correttamente
            <br />
            3. Controlla la console per i log di debug
            <br />
            4. Ricarica la pagina per testare la persistenza
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default ViewModeToggleTest;
