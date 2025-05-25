/**
 * Componente demo per testare la Hybrid View (Fase 3)
 * Mostra entrambe le modalità: Compact e Detailed
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import ViewModeToggle, { useViewMode } from './ViewModeToggle';
import ScalettaCardView from './ScalettaCardView';
import ScalettaTable from './ScalettaTable';

/**
 * Dati di esempio per il test
 */
const generateSampleItems = (count = 20) => {
  const types = ['MEDIA', 'TEMPLATE', 'STORY'];
  const items = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const startHour = 10 + Math.floor(i / 4);
    const startMinute = (i % 4) * 15;

    const baseItem = {
      id: `demo-${i + 1}`,
      type,
      name: `Elemento ${i + 1}`,
      data: {
        customName: `${type === 'MEDIA' ? '🎬' : type === 'TEMPLATE' ? '🎨' : '📄'} ${
          type === 'MEDIA' ? 'Video' :
          type === 'TEMPLATE' ? 'Template' :
          'Storia'
        } ${i + 1}`,
        timing: {
          startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`,
          duration: `00:0${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
        },
        casparcgConfig: {
          channel: 3,
          layer: 10 + (i % 5)
        },
        notes: Math.random() > 0.7 ? `Note per elemento ${i + 1}` : undefined
      }
    };

    // Aggiungi dati specifici per tipo
    switch (type) {
      case 'MEDIA':
        baseItem.data.clip = `video_${i + 1}.mp4`;
        baseItem.data.mediaDetails = {
          clipPath: `/media/videos/video_${i + 1}.mp4`
        };
        break;

      case 'TEMPLATE':
        baseItem.data.template = `template_${i + 1}.ft`;
        baseItem.data.templateDetails = {
          templateFile: `/templates/template_${i + 1}.ft`
        };
        break;

      case 'STORY':
        baseItem.data.content = `Questa è la storia numero ${i + 1}. Contiene informazioni dettagliate sul contenuto che verrà trasmesso durante questo segmento del programma. Il contenuto può essere molto lungo e includere dettagli tecnici, note per la regia, e istruzioni specifiche per la messa in onda.

La storia può contenere anche informazioni sui ospiti, sui temi da trattare, e sui materiali di supporto necessari per la trasmissione.`;

        // Aggiungi media e template associati casualmente
        if (Math.random() > 0.5) {
          baseItem.data.mediaDetails = {
            clipPath: `/media/stories/story_${i + 1}.mp4`
          };
        }

        if (Math.random() > 0.3) {
          baseItem.data.templatesDetails = [
            { templateFile: `/templates/lower_third_${i + 1}.ft` },
            ...(Math.random() > 0.6 ? [{ templateFile: `/templates/ticker_${i + 1}.ft` }] : [])
          ];
        }
        break;
    }

    items.push(baseItem);
  }

  return items;
};

/**
 * Componente demo principale
 */
const HybridViewDemo = () => {
  const [tableViewMode, setTableViewMode] = useViewMode('compact', 'demo-table-view-mode');
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [itemCount, setItemCount] = useState(20);

  // Genera elementi di esempio
  const sampleItems = generateSampleItems(itemCount);

  // Simula editing status
  const editingStatusByItemId = {
    'demo-3': { userName: 'Mario Rossi' },
    'demo-7': { userName: 'Giulia Bianchi' }
  };

  // Handlers mock
  const handleEditItem = (item) => {
    alert(`Modifica elemento: ${item.data?.customName}`);
  };

  const handlePlayItem = (item) => {
    alert(`Riproduci elemento: ${item.data?.customName}`);
  };

  const handleRemoveItem = (itemId) => {
    alert(`Rimuovi elemento: ${itemId}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🎭 Demo Hybrid View System - Fase 3
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test completo del sistema di visualizzazione ibrida con modalità Compact e Detailed
      </Typography>

      {/* Controlli demo */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎛️ Controlli Demo
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ViewModeToggle
            value={tableViewMode}
            onChange={setTableViewMode}
            itemCount={itemCount}
            showLabels={true}
            showRecommendation={true}
            size="medium"
          />

          <Divider orientation="vertical" flexItem />

          <Typography variant="body2" color="text.secondary">
            Elementi:
          </Typography>
          {[10, 20, 50, 100].map(count => (
            <Button
              key={count}
              variant={itemCount === count ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setItemCount(count)}
            >
              {count}
            </Button>
          ))}

          <Divider orientation="vertical" flexItem />

          <Chip
            label={`Selezionato: ${selectedItemIndex >= 0 ? `#${selectedItemIndex + 1}` : 'Nessuno'}`}
            color={selectedItemIndex >= 0 ? 'primary' : 'default'}
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Alert informativo */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
            Modalità {tableViewMode === 'compact' ? 'Compatta' : 'Dettagliata'}:
          </Typography>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {tableViewMode === 'compact'
              ? 'Ottimizzata per scalette lunghe e editing rapido. Tabella densa con informazioni essenziali.'
              : 'Ottimizzata per review contenuti e presentazioni. Card ricche con tutte le informazioni visibili.'
            }
          </Typography>
        </Box>
      </Alert>

      {/* Vista principale */}
      <Paper sx={{ minHeight: 600 }}>
        {tableViewMode === 'compact' ? (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6">
                📊 Modalità Compatta
              </Typography>
              <Chip label="Tabella Densa" size="small" color="warning" />
            </Box>
            <ScalettaTable
              items={sampleItems}
              selectedItemIndex={selectedItemIndex}
              dragOverIndex={-1}
              onSelectItem={setSelectedItemIndex}
              onEditItem={handleEditItem}
              onPlayItem={handlePlayItem}
              onPauseItem={() => {}}
              onStopItem={() => {}}
              onRemoveItem={handleRemoveItem}
              onPlayTemplate={() => {}}
              onStopTemplate={() => {}}
              onRemoveTemplate={() => {}}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDragEnd={() => {}}
              onDrop={() => {}}
              onPlayStory={() => {}}
              onStopStory={() => {}}
              userRole="owner"
              editingStatusByItemId={editingStatusByItemId}
              visibleColumns={['index', 'startTime', 'duration', 'name', 'file', 'actions']}
            />
          </Box>
        ) : (
          <Box>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  🎨 Modalità Dettagliata
                </Typography>
                <Chip label="Card Ricche" size="small" color="secondary" />
              </Box>
            </Box>
            <ScalettaCardView
              items={sampleItems}
              selectedItemIndex={selectedItemIndex}
              onSelectItem={setSelectedItemIndex}
              onEditItem={handleEditItem}
              onPlayItem={handlePlayItem}
              onRemoveItem={handleRemoveItem}
              editingStatusByItemId={editingStatusByItemId}
              canEdit={true}
            />
          </Box>
        )}
      </Paper>

      {/* Statistiche */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Statistiche Demo
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`${sampleItems.length} elementi totali`} />
          <Chip label={`${sampleItems.filter(i => i.type === 'MEDIA').length} media`} color="primary" />
          <Chip label={`${sampleItems.filter(i => i.type === 'TEMPLATE').length} template`} color="success" />
          <Chip label={`${sampleItems.filter(i => i.type === 'STORY').length} storie`} color="warning" />
          <Chip label={`${Object.keys(editingStatusByItemId).length} in modifica`} color="info" />
        </Box>
      </Paper>
    </Box>
  );
};

export default HybridViewDemo;
