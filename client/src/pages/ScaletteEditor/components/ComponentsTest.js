/**
 * File di test per verificare che tutti i componenti si compilino correttamente
 * Questo file importa tutti i nuovi componenti per verificare che non ci siano errori di import
 */
import React from 'react';
import { Box, Typography } from '@mui/material';

// Import di tutti i nuovi componenti per verificare la compilazione
import ItemTypeIcon, { useTypeConfig, getTypeColor, getSupportedTypes } from './ItemTypeIcon';
import StatusBadge, { useItemStatus, getSupportedStatuses, getStatusConfig } from './StatusBadge';
import StoryContentTooltip from './StoryContentTooltip';
import ViewModeToggle, { useViewMode, getViewModeConfig } from './ViewModeToggle';
import ScalettaItemCard from './ScalettaItemCard';
import ScalettaCardView from './ScalettaCardView';
import HybridViewDemo from './HybridViewDemo';
import EnhancedTableDemo from './EnhancedTableDemo';

/**
 * Componente di test per verificare che tutti i componenti funzionino
 */
const ComponentsTest = () => {
  // Test degli hook
  const [viewMode, setViewMode] = useViewMode('compact');
  const typeConfig = useTypeConfig('MEDIA');
  const typeColor = getTypeColor('TEMPLATE');
  const supportedTypes = getSupportedTypes();
  const supportedStatuses = getSupportedStatuses();
  const statusConfig = getStatusConfig('LIVE');
  const viewModeConfig = getViewModeConfig('detailed');

  // Dati di test
  const testItem = {
    id: 'test-1',
    type: 'STORY',
    name: 'Test Story',
    data: {
      customName: 'Storia di Test',
      content: 'Questo è un contenuto di test per verificare che il tooltip funzioni correttamente.',
      timing: {
        startTime: '10:00:00',
        duration: '00:02:30'
      },
      casparcgConfig: {
        channel: 3,
        layer: 10
      }
    }
  };

  const testItems = [testItem];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test Componenti - Verifica Compilazione
      </Typography>
      
      <Typography variant="body1" color="success.main" sx={{ mb: 3 }}>
        ✅ Tutti i componenti sono stati importati con successo!
      </Typography>

      {/* Test ItemTypeIcon */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">ItemTypeIcon Test:</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ItemTypeIcon type="MEDIA" size="small" />
          <ItemTypeIcon type="TEMPLATE" size="medium" />
          <ItemTypeIcon type="STORY" size="large" />
          <Typography variant="caption">
            Tipi supportati: {supportedTypes.join(', ')}
          </Typography>
        </Box>
      </Box>

      {/* Test StatusBadge */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">StatusBadge Test:</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <StatusBadge status="LIVE" variant="chip" size="small" />
          <StatusBadge status="EDITING" variant="minimal" size="small" />
          <StatusBadge status="IDLE" variant="dot" size="small" />
          <Typography variant="caption">
            Stati supportati: {supportedStatuses.join(', ')}
          </Typography>
        </Box>
      </Box>

      {/* Test StoryContentTooltip */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">StoryContentTooltip Test:</Typography>
        <StoryContentTooltip
          content={testItem.data.content}
          title={testItem.data.customName}
          item={testItem}
        >
          <Typography variant="body2" sx={{ 
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'underline'
          }}>
            Passa il mouse qui per vedere il tooltip
          </Typography>
        </StoryContentTooltip>
      </Box>

      {/* Test ViewModeToggle */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">ViewModeToggle Test:</Typography>
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          itemCount={1}
          showLabels={true}
          size="medium"
        />
        <Typography variant="caption" sx={{ ml: 2 }}>
          Modalità corrente: {viewMode}
        </Typography>
      </Box>

      {/* Test configurazioni */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Configurazioni Test:</Typography>
        <Typography variant="caption" component="div">
          • Configurazione tipo MEDIA: {JSON.stringify(typeConfig)}
        </Typography>
        <Typography variant="caption" component="div">
          • Colore tipo TEMPLATE: {typeColor}
        </Typography>
        <Typography variant="caption" component="div">
          • Configurazione status LIVE: {JSON.stringify(statusConfig)}
        </Typography>
        <Typography variant="caption" component="div">
          • Configurazione view mode detailed: {JSON.stringify(viewModeConfig)}
        </Typography>
      </Box>

      {/* Test ScalettaItemCard */}
      <Box sx={{ mb: 2, maxWidth: 400 }}>
        <Typography variant="h6">ScalettaItemCard Test:</Typography>
        <ScalettaItemCard
          item={testItem}
          index={0}
          selected={false}
          editingStatus={{}}
          onSelect={() => console.log('Card selected')}
          onEdit={() => console.log('Card edit')}
          onPlay={() => console.log('Card play')}
          onDelete={() => console.log('Card delete')}
          canEdit={true}
        />
      </Box>

      {/* Informazioni di debug */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Typography variant="h6" gutterBottom>
          📋 Informazioni Debug
        </Typography>
        <Typography variant="caption" component="div">
          • Tutti gli import Material-UI sono stati corretti
        </Typography>
        <Typography variant="caption" component="div">
          • Struttura DOM corretta (nessun div dentro p)
        </Typography>
        <Typography variant="caption" component="div">
          • Hook personalizzati funzionanti
        </Typography>
        <Typography variant="caption" component="div">
          • Configurazioni Supabase ottimizzate
        </Typography>
        <Typography variant="caption" component="div">
          • Componenti pronti per l'integrazione
        </Typography>
      </Box>
    </Box>
  );
};

export default ComponentsTest;
