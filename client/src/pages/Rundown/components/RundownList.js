import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Checkbox,
  FormControlLabel,
  Divider,
  Button,
  Switch,
  ListSubheader
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import RepeatIcon from '@mui/icons-material/Repeat';
import LinkIcon from '@mui/icons-material/Link'; // Icona per il template annidato
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SourceIcon from '@mui/icons-material/Source'; // Icona per elementi esplosi
import FilterListIcon from '@mui/icons-material/FilterList'; // Icona per filtro
import ArticleIcon from '@mui/icons-material/Article'; // Icona per elementi STORY
import ViewColumnIcon from '@mui/icons-material/ViewColumn'; // Icona per filtri colonne
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icona per colonne visibili
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'; // Icona per colonne nascoste
import { keyframes } from '@mui/system';
import { useRundown } from '../../../contexts/RundownContext';
import useRundownTimers from '../hooks/useRundownTimers';
import { format } from 'date-fns';
import StoryItemDialog from './StoryItemDialog';
import usePlaybackSync from '../../../hooks/usePlaybackSync';
import { broadcastComponents, broadcastColors, broadcastAnimations } from '../../../styles/broadcastTheme';


// Definizione dell'animazione di pulsazione per ON AIR
const pulseAnimationGreen = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

// MODIFICA/AGGIUNTA START: Animazione per NEXT UP (opzionale)
const pulseAnimationYellow = keyframes`
  0% { opacity: 0.7; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.7; transform: scale(0.98); }
`;
// MODIFICA/AGGIUNTA END

// MIGLIORAMENTO 1: Configurazione delle colonne per il sistema di filtri avanzati
const RUNDOWN_COLUMNS = [
  {
    id: 'index',
    label: '#',
    width: '40px',
    required: true, // Colonna sempre visibile
    textAlign: 'center'
  },
  {
    id: 'startTime',
    label: 'START',
    width: '80px',
    required: false,
    textAlign: 'left'
  },
  {
    id: 'duration',
    label: 'DURATION',
    width: '80px',
    required: false,
    textAlign: 'left'
  },
  {
    id: 'location',
    label: 'LOCATION',
    width: '230px',
    required: false,
    textAlign: 'left'
  },
  {
    id: 'fileTemplate',
    label: 'FILE / TEMPLATE',
    width: 'flexGrow',
    minWidth: '150px',
    required: true, // Colonna sempre visibile
    textAlign: 'left'
  },
  {
    id: 'notes',
    label: 'NOTE',
    width: '130px',
    required: false,
    textAlign: 'left'
  },
  {
    id: 'inPoint',
    label: 'IN',
    width: '80px',
    required: false,
    textAlign: 'center'
  },
  {
    id: 'outPoint',
    label: 'OUT',
    width: '80px',
    required: false,
    textAlign: 'center'
  },
  {
    id: 'countdown',
    label: 'COUNTDOWN',
    width: '100px',
    required: false,
    textAlign: 'center'
  },
  {
    id: 'status',
    label: 'STATO',
    width: '100px',
    required: false,
    textAlign: 'center'
  },
  {
    id: 'actions',
    label: 'AZIONI',
    width: '120px',
    required: true, // Colonna sempre visibile
    textAlign: 'center'
  }
];

// Colonne visibili di default
const DEFAULT_VISIBLE_COLUMNS = RUNDOWN_COLUMNS.filter(col => col.required).map(col => col.id)
  .concat(['startTime', 'duration', 'notes', 'status']); // Aggiungi alcune colonne utili di default

// Chiave per localStorage
const COLUMN_VISIBILITY_STORAGE_KEY = 'rundown_column_visibility';

// MIGLIORAMENTO 2: Funzioni helper per la visualizzazione dettagliata dei template
/**
 * Estrae il nome del file template senza il percorso completo
 * @param {string} templateFile - Percorso completo del template
 * @returns {string} - Nome del file senza percorso
 */
export const formatTemplateName = (templateFile) => {
  if (!templateFile) return 'Template';
  return templateFile.split('/').pop() || templateFile;
};

/**
 * Formatta la visualizzazione di un singolo template con layer e cgLayer
 * @param {Object} template - Oggetto template con templateFile e casparcgConfig
 * @returns {string} - Stringa formattata "nome.html (L:X, CG:Y)"
 */
export const formatTemplateDisplay = (template) => {
  if (!template) return 'Template';

  const name = formatTemplateName(template.templateFile);
  const layer = template.casparcgConfig?.layer || '?';
  const cgLayer = template.casparcgConfig?.cgLayer || '?';

  return `${name} (L:${layer}, CG:${cgLayer})`;
};

/**
 * Genera un tooltip dettagliato per tutti i template associati
 * @param {Array} templatesDetails - Array di oggetti template
 * @param {Object} templateDetails - Template singolo (legacy)
 * @returns {string} - Tooltip completo con tutte le informazioni
 */
export const generateTemplateTooltip = (templatesDetails, templateDetails) => {
  let templates = [];

  // Gestione template multipli
  if (templatesDetails && templatesDetails.length > 0) {
    templates = templatesDetails;
  }
  // Gestione template singolo (legacy)
  else if (templateDetails && templateDetails.templateFile) {
    templates = [templateDetails];
  }

  if (templates.length === 0) return 'Nessun template configurato';

  const tooltipLines = templates.map((template, index) => {
    const name = formatTemplateName(template.templateFile);
    const fullPath = template.templateFile;
    const channel = template.casparcgConfig?.channel || '?';
    const layer = template.casparcgConfig?.layer || '?';
    const cgLayer = template.casparcgConfig?.cgLayer || '?';
    const playOnLoad = template.casparcgConfig?.playOnLoad ? 'Sì' : 'No';
    const autoStart = template.timing?.autoStart !== false ? 'Sì' : 'No';
    const startDelay = template.timing?.startDelay || 0;

    let line = `${index + 1}. ${name}\n`;
    line += `   Percorso: ${fullPath}\n`;
    line += `   Canale: ${channel}, Layer: ${layer}, CG Layer: ${cgLayer}\n`;
    line += `   Play on Load: ${playOnLoad}, Auto Start: ${autoStart}`;
    if (startDelay > 0) {
      line += `, Ritardo: ${startDelay}s`;
    }

    // Aggiungi informazioni sui dati instance se presenti
    if (template.instanceData && Object.keys(template.instanceData).length > 0) {
      const dataKeys = Object.keys(template.instanceData);
      line += `\n   Dati: ${dataKeys.join(', ')}`;
    }

    return line;
  });

  const header = templates.length === 1 ? 'Template Associato:' : `${templates.length} Template Associati:`;
  return `${header}\n\n${tooltipLines.join('\n\n')}`;
};

/**
 * Genera il testo di visualizzazione principale per i template
 * @param {Array} templatesDetails - Array di oggetti template
 * @param {Object} templateDetails - Template singolo (legacy)
 * @param {number} maxVisible - Numero massimo di template da mostrare
 * @returns {string} - Testo ottimizzato per la visualizzazione principale
 */
export const getTemplateDisplayText = (templatesDetails, templateDetails, maxVisible = 2) => {
  let templates = [];

  // Gestione template multipli
  if (templatesDetails && templatesDetails.length > 0) {
    templates = templatesDetails;
  }
  // Gestione template singolo (legacy)
  else if (templateDetails && templateDetails.templateFile) {
    templates = [templateDetails];
  }

  if (templates.length === 0) return 'Nessun template';

  if (templates.length === 1) {
    return formatTemplateDisplay(templates[0]);
  }

  // Per template multipli, mostra i primi maxVisible + conteggio rimanenti
  const visibleTemplates = templates.slice(0, maxVisible);
  const remainingCount = templates.length - maxVisible;

  let displayText = visibleTemplates.map(formatTemplateDisplay).join(', ');

  if (remainingCount > 0) {
    displayText += `, +${remainingCount} altri`;
  }

  return displayText;
};

/**
 * Rileva potenziali conflitti nei layer dei template
 * @param {Array} templatesDetails - Array di oggetti template
 * @returns {Array} - Array di conflitti rilevati
 */
export const detectTemplateConflicts = (templatesDetails) => {
  if (!templatesDetails || templatesDetails.length <= 1) return [];

  const conflicts = [];
  const layerMap = new Map();
  const cgLayerMap = new Map();

  templatesDetails.forEach((template, index) => {
    const layer = template.casparcgConfig?.layer;
    const cgLayer = template.casparcgConfig?.cgLayer;
    const channel = template.casparcgConfig?.channel;

    // Controlla conflitti layer
    if (layer !== undefined) {
      const layerKey = `${channel}-${layer}`;
      if (layerMap.has(layerKey)) {
        conflicts.push({
          type: 'layer',
          message: `Layer ${layer} su canale ${channel} usato da più template`,
          templates: [layerMap.get(layerKey), index]
        });
      } else {
        layerMap.set(layerKey, index);
      }
    }

    // Controlla conflitti cgLayer
    if (cgLayer !== undefined) {
      const cgLayerKey = `${channel}-${layer}-${cgLayer}`;
      if (cgLayerMap.has(cgLayerKey)) {
        conflicts.push({
          type: 'cgLayer',
          message: `CG Layer ${cgLayer} su layer ${layer} usato da più template`,
          templates: [cgLayerMap.get(cgLayerKey), index]
        });
      } else {
        cgLayerMap.set(cgLayerKey, index);
      }
    }
  });

  return conflicts;
};

/**
 * Componente per la visualizzazione della lista degli elementi del rundown.
 */
const RundownList = ({
  items,
  // playingItems, // playingItems non è più passato come prop, si usa item.isPlaying
  // currentTime, // Non direttamente usato qui, ma tramite useRundownTimers se necessario
  scheduledPlayback, // Usato per la visualizzazione della timeline delle ore
  connected,
  showNotification,
  dialogsState,
  // removeItem, // Prese da useRundown
  // updateItem // Prese da useRundown
}) => {
  const {
    playItem,
    stopItem,
    removeItem,
    updateItem // CORREZIONE BUG: Importiamo updateItem dal contesto
  } = useRundown();

  const {
    formatPlayingTime,
    calculateCountdown
  } = useRundownTimers();

  const {
    handleContextMenu,
    handleItemMenuOpen,
    handleEditItemDialogOpen,
    // handleLinkTemplateDialogOpen // Assicurati che sia definito in dialogsState se usato nel menu
  } = dialogsState;

   // MODIFICA/AGGIUNTA START: Logica per identificare l'elemento "NEXT"
  const playingItemIndex = items.findIndex(item => item.isPlaying);
  let nextItemId = null;
  if (playingItemIndex !== -1 && playingItemIndex < items.length - 1) {
    nextItemId = items[playingItemIndex + 1].id;
  }
  // MODIFICA/AGGIUNTA END

  // Stati per il filtro degli elementi esplosi
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    showExplodedItems: true,
    showRegularItems: true,
    filterByScaletta: null
  });

  // MIGLIORAMENTO 1: Stati per il sistema di filtri delle colonne
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Carica le preferenze da localStorage o usa i default
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Assicurati che le colonne obbligatorie siano sempre incluse
        const requiredColumns = RUNDOWN_COLUMNS.filter(col => col.required).map(col => col.id);
        return [...new Set([...requiredColumns, ...parsed])];
      }
    } catch (error) {
      console.warn('Errore nel caricamento delle preferenze colonne:', error);
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // Salva le preferenze delle colonne in localStorage quando cambiano
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(visibleColumns));
      console.log('🔧 Preferenze colonne salvate:', visibleColumns);
    } catch (error) {
      console.warn('Errore nel salvataggio delle preferenze colonne:', error);
    }
  }, [visibleColumns]);

  // Funzione per toggle della visibilità di una colonna
  const toggleColumnVisibility = (columnId) => {
    const column = RUNDOWN_COLUMNS.find(col => col.id === columnId);
    if (column?.required) {
      console.warn(`Colonna ${columnId} è obbligatoria e non può essere nascosta`);
      return;
    }

    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  // Funzione per resettare le colonne ai default
  const resetColumnsToDefault = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  // Calcola le colonne visibili con le loro configurazioni
  const visibleColumnConfigs = useMemo(() => {
    return RUNDOWN_COLUMNS.filter(col => visibleColumns.includes(col.id));
  }, [visibleColumns]);

  // MIGLIORAMENTO 3: Stati per il dialog dettagliato degli elementi STORY
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedStoryItem, setSelectedStoryItem] = useState(null);

  // RICHIESTA 1: Hook per sincronizzazione stato riproduzione
  const playbackSync = usePlaybackSync();

  // Estrai le scalette uniche dagli elementi esplosi
  const uniqueScalette = React.useMemo(() => {
    const scalette = new Set();
    items.forEach(item => {
      if (item.data && item.data.sourceInfo && item.data.sourceInfo.sourceScalettaName) {
        scalette.add(item.data.sourceInfo.sourceScalettaName);
      }
    });
    return Array.from(scalette);
  }, [items]);

  // Riproduzione di un item
  const handlePlayItem = async (item) => {
    if (!connected) {
        showNotification('Non connesso a CasparCG.', 'warning');
        return;
    }
    try {
      await playItem(item);

      // RICHIESTA 1: Sincronizza stato di riproduzione
      playbackSync.updatePlaybackStatus(item.id, {
        status: 'PLAYING',
        channel: item.data?.casparcgConfig?.channel || 1,
        layer: item.data?.casparcgConfig?.layer || 1,
        startTime: Date.now(),
        source: 'rundown'
      });

      showNotification(`Riproduzione avviata: ${item.data.customName || item.name}`, 'success');
    } catch (error) {
      showNotification(`Errore nella riproduzione: ${error.message}`, 'error');
    }
  };

  // Arresto di un item
  const handleStopItem = async (item) => {
    if (!connected) {
        showNotification('Non connesso a CasparCG.', 'warning');
        return;
    }
    try {
      await stopItem(item);

      // RICHIESTA 1: Sincronizza stato di arresto
      playbackSync.updatePlaybackStatus(item.id, {
        status: 'STOPPED',
        channel: item.data?.casparcgConfig?.channel || 1,
        layer: item.data?.casparcgConfig?.layer || 1,
        startTime: null,
        source: 'rundown'
      });

      showNotification(`Riproduzione fermata: ${item.data.customName || item.name}`, 'success');
    } catch (error) {
      showNotification(`Errore nell'arresto: ${error.message}`, 'error');
    }
  };

  // Apertura del menu di filtro
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  // Chiusura del menu di filtro
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  // Gestione del cambio di filtro
  const handleFilterChange = (filterType, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: value
    }));
    handleFilterMenuClose();
  };

  // Gestione del filtro per scaletta
  const handleFilterByScaletta = (scalettaName) => {
    setFilterOptions(prev => ({
      ...prev,
      filterByScaletta: prev.filterByScaletta === scalettaName ? null : scalettaName
    }));
    handleFilterMenuClose();
  };

  // MIGLIORAMENTO 3: Gestione del dialog dettagliato per elementi STORY
  const handleStoryDialogOpen = (item) => {
    // Verifica che sia un elemento STORY complesso
    if (item.type === 'STORY' && (
      (item.data?.mediaDetails?.clipPath) ||
      (item.data?.templateDetails?.templateFile) ||
      (item.data?.templatesDetails?.length > 0)
    )) {
      setSelectedStoryItem(item);
      setStoryDialogOpen(true);
    }
  };

  const handleStoryDialogClose = () => {
    setStoryDialogOpen(false);
    setSelectedStoryItem(null);
  };

  const handleStoryItemSave = (updatedItem) => {
    try {
      // CORREZIONE BUG: Utilizziamo updateItem dal contesto per persistere le modifiche
      console.log('🔄 Aggiornamento elemento STORY:', updatedItem);

      // Aggiorna l'elemento nel rundown utilizzando updateItem dal contesto
      updateItem(updatedItem.id, updatedItem);

      console.log('✅ Elemento STORY aggiornato con successo nel rundown');
      showNotification('Elemento STORY aggiornato con successo', 'success');
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento elemento STORY:', error);
      showNotification(`Errore nell'aggiornamento: ${error.message}`, 'error');
    }
  };

  const handleStoryItemDelete = (itemId) => {
    try {
      removeItem(itemId);
      showNotification('Elemento STORY eliminato con successo', 'success');
    } catch (error) {
      showNotification(`Errore nell'eliminazione: ${error.message}`, 'error');
    }
  };

  // Filtra gli elementi in base alle opzioni di filtro
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Verifica se l'elemento è esploso (ha sourceInfo)
      const isExploded = item.data && item.data.sourceInfo;

      // Filtra in base alle opzioni showExplodedItems e showRegularItems
      if (isExploded && !filterOptions.showExplodedItems) {
        return false;
      }

      if (!isExploded && !filterOptions.showRegularItems) {
        return false;
      }

      // Filtra in base alla scaletta selezionata
      if (filterOptions.filterByScaletta && isExploded) {
        return item.data.sourceInfo.sourceScalettaName === filterOptions.filterByScaletta;
      }

      return true;
    });
  }, [items, filterOptions]);

  // MIGLIORAMENTO 1: Funzione helper per renderizzare il contenuto di ogni colonna
  const renderColumnContent = (columnId, item, index, itemProps) => {
    const { isPlaying, isNext, isExploded, isMediaWithLinkedTemplate, isComplexStory, hasMedia, hasTemplates, hasMultipleTemplates } = itemProps;

    switch (columnId) {
      case 'index':
        return (
          <Box sx={{ width: '40px', textAlign: 'center', fontWeight: 'bold', flexShrink: 0 }}>
            {index + 1}
          </Box>
        );

      case 'startTime':
        return (
          <Box sx={{
            width: '80px',
            fontFamily: 'monospace',
            color: scheduledPlayback ? '#4caf50' : 'inherit',
            fontWeight: scheduledPlayback ? 'bold' : 'normal',
            flexShrink: 0
          }}>
            {item.data.startTime || '00:00:00'}
          </Box>
        );

      case 'duration':
        return (
          <Box sx={{ width: '80px', fontFamily: 'monospace', flexShrink: 0 }}>
            {item.data.duration || (item.type === 'MEDIA' ? '00:05:00' : '00:01:00')}
          </Box>
        );

      case 'location':
        return (
          <Tooltip title={item.data.location || (item.type === 'MEDIA' ? item.data.clip : item.data.template)}>
            <Box sx={{
                width: '230px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
                opacity: 0.8,
                flexShrink: 0,
                pr:1
            }}>
                {item.data.location || (item.type === 'MEDIA' ? item.data.clip : item.data.template)}
            </Box>
          </Tooltip>
        );

      case 'fileTemplate':
        return (
          <Box sx={{
            flexGrow: 1,
            minWidth: '150px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: isPlaying || isNext ? 'bold' : 'normal',
            color: item.isPlaying
              ? (item.type === 'MEDIA' ? '#4caf50' : '#2196f3')
              : 'inherit',
            overflow: 'hidden',
          }}>
            {/* Indicatore di riproduzione */}
            {item.isPlaying && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                  mr: 1,
                  animation: `${pulseAnimationGreen} 1.5s infinite ease-in-out`,
                  flexShrink: 0,
                }}
              >
                <PlayArrowIcon fontSize="small" color={item.type === 'MEDIA' ? 'success' : 'primary'} />
              </Box>
            )}

            {/* Indicatore per NEXT */}
            {isNext && (
              <Tooltip title="Prossimo in play">
                <FiberManualRecordIcon fontSize="small" sx={{ color: '#FFC107', mr: 0.5, animation: `${pulseAnimationYellow} 1.8s infinite ease-in-out alternate` }} />
              </Tooltip>
            )}

            {/* Icone del tipo di elemento */}
            {item.type === 'MEDIA' ? (
              <MovieIcon
                fontSize="small"
                sx={{
                  mr: 0.5,
                  color: item.isPlaying ? '#4caf50' : (isMediaWithLinkedTemplate ? '#FFC107' : 'inherit'),
                  opacity: item.isPlaying ? 1 : 0.7,
                  flexShrink: 0,
                }}
              />
            ) : item.type === 'STORY' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, flexShrink: 0 }}>
                <ArticleIcon
                  fontSize="small"
                  sx={{
                    color: item.isPlaying ? '#9c27b0' : (isComplexStory ? '#ff9800' : 'inherit'),
                    opacity: item.isPlaying ? 1 : 0.7,
                    mr: hasMedia || hasTemplates ? 0.25 : 0,
                  }}
                />
                {hasMedia && (
                  <MovieIcon
                    fontSize="small"
                    sx={{
                      color: '#4caf50',
                      opacity: 0.6,
                      fontSize: '12px',
                      mr: 0.25,
                    }}
                  />
                )}
                {hasTemplates && (
                  <BrushIcon
                    fontSize="small"
                    sx={{
                      color: '#2196f3',
                      opacity: 0.6,
                      fontSize: '12px',
                      mr: hasMultipleTemplates ? 0.25 : 0,
                    }}
                  />
                )}
                {hasMultipleTemplates && (
                  <Tooltip title={generateTemplateTooltip(item.data.templatesDetails, item.data.templateDetails)}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#2196f3',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        opacity: 0.8,
                        cursor: 'help'
                      }}
                    >
                      {item.data.templatesDetails.length}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
            ) : (
              <BrushIcon
                fontSize="small"
                sx={{
                  mr: 0.5,
                  color: item.isPlaying ? '#2196f3' : 'inherit',
                  opacity: item.isPlaying ? 1 : 0.7,
                  flexShrink: 0,
                }}
              />
            )}

            {/* Icona per template annidato */}
            {isMediaWithLinkedTemplate && (
                <Tooltip title={`Template Annidato: ${item.data.linkedTemplate.name || 'Non specificato'}`}>
                    <LinkIcon
                        fontSize="small"
                        sx={{
                            color: item.isPlaying ? '#4caf50' : '#FFC107',
                            ml: 0.5,
                            mr: 0.5,
                            flexShrink: 0,
                        }}
                    />
                </Tooltip>
            )}

            {/* Nome dell'elemento e dettagli */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexGrow: 1,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: item.isPlaying ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mr: 1
                  }}
                  title={item.data.customName || item.name}
                >
                  {item.data.customName || item.name}
                </Typography>

                {/* Etichetta per elementi esplosi */}
                {isExploded && (
                  <Tooltip
                    title={`Elemento esploso dalla scaletta "${item.data.sourceInfo.sourceScalettaName}" del ${format(new Date(item.data.sourceInfo.sourceDay), 'dd/MM/yyyy')}`}
                    arrow
                  >
                    <Chip
                      icon={<SourceIcon fontSize="small" />}
                      label={item.data.sourceInfo.sourceScalettaName}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{
                        height: '20px',
                        '& .MuiChip-label': {
                          px: 1,
                          fontSize: '0.7rem',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        },
                        '& .MuiChip-icon': {
                          fontSize: '0.8rem',
                          ml: 0.5
                        }
                      }}
                    />
                  </Tooltip>
                )}
              </Box>

              {/* Dettagli template annidato */}
              {isMediaWithLinkedTemplate && (
                <Typography variant="caption" sx={{ color: '#FFC107', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={item.data.linkedTemplate.name}
                >
                    + {item.data.linkedTemplate.name || 'Template Ann.'} (L: {item.data.linkedTemplate.layer}, CG: {item.data.linkedTemplate.cgLayer})
                </Typography>
              )}

              {/* MIGLIORAMENTO 2: Dettagli migliorati per elementi STORY complessi */}
              {isComplexStory && (
                <Box sx={{ mt: 0.5 }}>
                  {hasMedia && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4caf50',
                        fontSize: '0.7rem',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`Media: ${item.data.mediaDetails.clipPath}`}
                    >
                      📹 {item.data.mediaDetails.clipPath?.split('/').pop() || 'Media'}
                    </Typography>
                  )}
                  {hasTemplates && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#2196f3',
                        fontSize: '0.7rem',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={generateTemplateTooltip(item.data.templatesDetails, item.data.templateDetails)}
                    >
                      🎨 {getTemplateDisplayText(item.data.templatesDetails, item.data.templateDetails, 2)}
                    </Typography>
                  )}
                  {/* MIGLIORAMENTO 2: Indicatore di conflitti template se presenti */}
                  {hasMultipleTemplates && detectTemplateConflicts(item.data.templatesDetails).length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ff5722',
                        fontSize: '0.6rem',
                        display: 'block',
                        fontWeight: 'bold'
                      }}
                      title={`Conflitti rilevati: ${detectTemplateConflicts(item.data.templatesDetails).map(c => c.message).join(', ')}`}
                    >
                      ⚠️ Conflitti layer rilevati
                    </Typography>
                  )}
                </Box>
              )}

              {/* Tempo di riproduzione */}
              {item.isPlaying && item.playingStartTime && (
                <Typography
                  variant="caption"
                  sx={{
                    color: item.type === 'MEDIA' ? '#4caf50' : '#2196f3',
                    fontSize: '0.7rem'
                  }}
                >
                  In onda: {formatPlayingTime(item.playingStartTime)}
                </Typography>
              )}
            </Box>

            {/* Indicatori aggiuntivi (Loop) */}
            <Box sx={{ display: 'flex', ml: 'auto', flexShrink: 0, alignItems: 'center' }}>
              {item.data.loop && (
                <Tooltip title="Loop">
                  <RepeatIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                </Tooltip>
              )}
            </Box>
          </Box>
        );

      case 'notes':
        return (
          <Tooltip title={item.data.notes || item.data.note || ''}>
            <Box sx={{
                width: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
                opacity: 0.8,
                flexShrink: 0,
                pr: 1,
            }}>
                {item.data.notes || item.data.note || ''}
            </Box>
          </Tooltip>
        );

      case 'inPoint':
        return (
          <Box sx={{
            width: '80px',
            textAlign: 'center',
            fontFamily: '"Roboto Mono", "Consolas", "Monaco", monospace',
            color: broadcastColors.text.timecode,
            fontSize: '0.85rem',
            fontWeight: 'medium',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            {item.data.inPoint || '00:00:00'}
          </Box>
        );

      case 'outPoint':
        return (
          <Box sx={{
            width: '80px',
            textAlign: 'center',
            fontFamily: '"Roboto Mono", "Consolas", "Monaco", monospace',
            color: broadcastColors.text.timecode,
            fontSize: '0.85rem',
            fontWeight: 'medium',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            {item.data.outPoint || ''}
          </Box>
        );

      case 'countdown':
        return (
          <Box sx={{
            width: '100px',
            textAlign: 'center',
            fontFamily: '"Roboto Mono", "Consolas", "Monaco", monospace',
            color: isPlaying ? broadcastColors.status.onAir : (isNext ? broadcastColors.status.next : broadcastColors.text.timecode),
            fontWeight: item.isPlaying ? 'bold' : 'medium',
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            {item.isPlaying && item.data.outPoint ? (
              <Box sx={{
                display: 'inline-block',
                background: `linear-gradient(135deg, ${broadcastColors.status.onAir}20 0%, ${broadcastColors.status.onAir}40 100%)`,
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                border: `1px solid ${broadcastColors.status.onAir}60`,
                boxShadow: `0 0 4px ${broadcastColors.status.onAir}40`
              }}>
                {calculateCountdown(item)}
              </Box>
            ) : (
              item.data.outPoint && item.data.inPoint ? (
                <Box sx={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  opacity: 0.8,
                  backgroundColor: `${broadcastColors.background.elevated}40`,
                  border: `1px solid ${broadcastColors.border.primary}`
                }}>
                  {calculateCountdown(item)}
                </Box>
              ) : null
            )}
          </Box>
        );

      case 'status':
        return (
          <Box sx={{
            width: '100px',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0
          }}>
            {item.isPlaying ? (
              <Box sx={{
                background: broadcastColors.gradients.onAir,
                color: broadcastColors.text.primary,
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: `0 0 8px ${broadcastColors.status.onAir}60`,
                animation: `${pulseAnimationYellow} 1.5s infinite ease-in-out`,
                minWidth: '80px',
                justifyContent: 'center',
                border: `1px solid ${broadcastColors.status.onAir}`
              }}>
                <PlayArrowIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                ON AIR
              </Box>
            ) : isNext ? (
                <Box sx={{
                  background: `linear-gradient(135deg, ${broadcastColors.status.next} 0%, #e6a100 100%)`,
                  color: broadcastColors.background.primary,
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '60px',
                  justifyContent: 'center',
                  border: `1px solid ${broadcastColors.status.next}`,
                  boxShadow: `0 0 6px ${broadcastColors.status.next}40`
                }}>
                  NEXT
                </Box>
            ) : isExploded ? (
                <Tooltip title={`Elemento esploso dalla scaletta "${item.data.sourceInfo.sourceScalettaName}"`}>
                  <Chip
                    icon={<SourceIcon fontSize="small" />}
                    label="ESPLOSO"
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#2196f3',
                      color:'#2196f3',
                      fontWeight:'bold',
                      backgroundColor: 'rgba(33, 150, 243, 0.1)'
                    }}
                  />
                </Tooltip>
            ) : null}
          </Box>
        );

      case 'actions':
        return (
          <Box sx={{ width: '120px', display: 'flex', justifyContent: 'center', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Riproduci">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayItem(item);
                }}
                disabled={!connected}
                sx={{
                  background: item.isPlaying
                    ? broadcastColors.gradients.onAir
                    : `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #388e3c 100%)`,
                  color: broadcastColors.text.primary,
                  border: `1px solid ${item.isPlaying ? broadcastColors.status.onAir : broadcastColors.status.ready}`,
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                  '&:hover': {
                    background: item.isPlaying
                      ? `linear-gradient(135deg, ${broadcastColors.status.onAir} 0%, #c62828 100%)`
                      : `linear-gradient(135deg, ${broadcastColors.status.ready} 0%, #2e7d32 100%)`,
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 8px ${item.isPlaying ? broadcastColors.status.onAir : broadcastColors.status.ready}60`
                  },
                  '&:disabled': {
                    background: broadcastColors.background.secondary,
                    color: broadcastColors.text.disabled,
                    border: `1px solid ${broadcastColors.border.primary}`
                  }
                }}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ferma">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopItem(item);
                }}
                disabled={!connected || !item.isPlaying}
                sx={{
                  background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #c62828 100%)`,
                  color: broadcastColors.text.primary,
                  border: `1px solid ${broadcastColors.status.error}`,
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${broadcastColors.status.error} 0%, #b71c1c 100%)`,
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 8px ${broadcastColors.status.error}60`
                  },
                  '&:disabled': {
                    background: broadcastColors.background.secondary,
                    color: broadcastColors.text.disabled,
                    border: `1px solid ${broadcastColors.border.primary}`
                  }
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Menu">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemMenuOpen(e, item.id);
                }}
                sx={{
                  background: `linear-gradient(135deg, ${broadcastColors.background.elevated} 0%, ${broadcastColors.background.secondary} 100%)`,
                  color: broadcastColors.text.secondary,
                  border: `1px solid ${broadcastColors.border.primary}`,
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${broadcastColors.primary.main} 0%, ${broadcastColors.primary.dark} 100%)`,
                    color: broadcastColors.text.primary,
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 8px ${broadcastColors.primary.main}40`
                  }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Menu contestuale */}
      <Menu
        open={Boolean(dialogsState.contextMenu)}
        onClose={dialogsState.handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          dialogsState.contextMenu
            ? { top: dialogsState.contextMenu.mouseY, left: dialogsState.contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            handlePlayItem(dialogsState.contextMenu.item);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Riproduci" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            handleStopItem(dialogsState.contextMenu.item);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><StopIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Ferma" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            dialogsState.handleEditItemDialogOpen(dialogsState.contextMenu.item.id);
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Modifica" />
        </MenuItem>
        {/* Opzione "Collega Template" nel menu contestuale (se l'item è MEDIA) */}
        {dialogsState.contextMenu && dialogsState.contextMenu.item && dialogsState.contextMenu.item.type === 'MEDIA' && (
          <MenuItem onClick={() => {
            if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
              // Assicurati che handleLinkTemplateDialogOpen sia disponibile e chiamato correttamente
              if (dialogsState.handleLinkTemplateDialogOpen) {
                dialogsState.handleLinkTemplateDialogOpen(dialogsState.contextMenu.item.id);
              } else {
                console.warn("handleLinkTemplateDialogOpen non è definito in dialogsState");
                showNotification("Funzione collega template non disponibile.", "warning");
              }
            }
            dialogsState.handleContextMenuClose();
          }}>
            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Collega/Modifica Template Annidato" />
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (dialogsState.contextMenu && dialogsState.contextMenu.item) {
            removeItem(dialogsState.contextMenu.item.id); // Usa la funzione dal context
            showNotification('Elemento rimosso dal rundown', 'success');
          }
          dialogsState.handleContextMenuClose();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Rimuovi" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Menu dell'elemento (pulsante con 3 puntini) */}
      <Menu
        anchorEl={dialogsState.itemMenuAnchorEl}
        open={Boolean(dialogsState.itemMenuAnchorEl)}
        onClose={dialogsState.handleItemMenuClose}
      >
        <MenuItem onClick={() => {
          const item = items.find(it => it.id === dialogsState.selectedItemId);
          if (item) handlePlayItem(item);
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Riproduci" />
        </MenuItem>
        <MenuItem onClick={() => {
          const item = items.find(it => it.id === dialogsState.selectedItemId);
          if (item) handleStopItem(item);
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><StopIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Ferma" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogsState.selectedItemId) {
            dialogsState.handleEditItemDialogOpen(dialogsState.selectedItemId);
          }
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Modifica" />
        </MenuItem>
        {/* Opzione "Collega Template" nel menu dell'item (se l'item è MEDIA) */}
        {dialogsState.selectedItemId && items.find(it => it.id === dialogsState.selectedItemId)?.type === 'MEDIA' && (
          <MenuItem onClick={() => {
            if (dialogsState.selectedItemId) {
               if (dialogsState.handleLinkTemplateDialogOpen) {
                dialogsState.handleLinkTemplateDialogOpen(dialogsState.selectedItemId);
              } else {
                console.warn("handleLinkTemplateDialogOpen non è definito in dialogsState per il menu item");
                showNotification("Funzione collega template non disponibile.", "warning");
              }
            }
            dialogsState.handleItemMenuClose();
          }}>
            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Collega/Modifica Template Annidato" />
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (dialogsState.selectedItemId) {
            removeItem(dialogsState.selectedItemId); // Usa la funzione dal context
            showNotification('Elemento rimosso dal rundown', 'success');
          }
          dialogsState.handleItemMenuClose();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Rimuovi" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* RICHIESTA 2: Intestazione broadcast professionale */}
      <Box sx={{
        display: 'flex',
        background: broadcastColors.gradients.header,
        borderBottom: `2px solid ${broadcastColors.border.accent}`,
        p: 2,
        fontWeight: 'bold',
        fontSize: '0.85rem',
        fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        position: 'sticky',
        top: 0,
        zIndex: 7,
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: broadcastColors.elevation?.medium || '0 2px 6px rgba(0, 0, 0, 0.4)',
        color: broadcastColors.text.primary
      }}>
        {/* MIGLIORAMENTO 1: Intestazione dinamica basata su colonne visibili */}
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {visibleColumnConfigs.map((column, index) => {
            // Gestione speciale per lo spazio tra IN e OUT
            const showSpaceBefore = column.id === 'outPoint' && visibleColumns.includes('inPoint');

            return (
              <React.Fragment key={column.id}>
                {showSpaceBefore && (
                  <Box sx={{ width: '20px', flexShrink: 0 }}></Box>
                )}
                <Box
                  sx={{
                    width: column.width === 'flexGrow' ? undefined : column.width,
                    flexGrow: column.width === 'flexGrow' ? 1 : 0,
                    minWidth: column.minWidth || undefined,
                    textAlign: column.textAlign,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.label}
                </Box>
              </React.Fragment>
            );
          })}
        </Box>

        {/* Bottone di filtro */}
        <Box>
          <Tooltip title="Filtra elementi">
            <IconButton
              size="small"
              onClick={handleFilterMenuOpen}
              color={filterOptions.filterByScaletta || !filterOptions.showExplodedItems || !filterOptions.showRegularItems ? "primary" : "default"}
              sx={{ ml: 1 }}
            >
              <Badge
                badgeContent={uniqueScalette.length}
                color="secondary"
                invisible={uniqueScalette.length === 0}
              >
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menu di filtro */}
          <Menu
            anchorEl={filterMenuAnchorEl}
            open={Boolean(filterMenuAnchorEl)}
            onClose={handleFilterMenuClose}
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterOptions.showRegularItems}
                    onChange={(e) => handleFilterChange('showRegularItems', e.target.checked)}
                  />
                }
                label="Mostra elementi normali"
              />
            </MenuItem>
            <MenuItem>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterOptions.showExplodedItems}
                    onChange={(e) => handleFilterChange('showExplodedItems', e.target.checked)}
                  />
                }
                label="Mostra elementi esplosi"
              />
            </MenuItem>

            {uniqueScalette.length > 0 && (
              <>
                <Divider />
                <MenuItem disabled>
                  <Typography variant="caption">Filtra per scaletta</Typography>
                </MenuItem>
                {uniqueScalette.map(scaletta => (
                  <MenuItem
                    key={scaletta}
                    onClick={() => handleFilterByScaletta(scaletta)}
                    selected={filterOptions.filterByScaletta === scaletta}
                  >
                    <ListItemIcon>
                      <SourceIcon fontSize="small" color={filterOptions.filterByScaletta === scaletta ? "primary" : "inherit"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={scaletta}
                      primaryTypographyProps={{
                        noWrap: true,
                        style: { maxWidth: '200px' }
                      }}
                    />
                  </MenuItem>
                ))}
              </>
            )}

            {/* MIGLIORAMENTO 1: Sezione filtri colonne */}
            <Divider />
            <ListSubheader sx={{ bgcolor: 'transparent', color: 'text.primary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewColumnIcon fontSize="small" />
                <Typography variant="caption">Colonne visibili</Typography>
              </Box>
            </ListSubheader>

            {RUNDOWN_COLUMNS.map(column => (
              <MenuItem
                key={column.id}
                onClick={() => toggleColumnVisibility(column.id)}
                disabled={column.required}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>
                  {visibleColumns.includes(column.id) ? (
                    <VisibilityIcon fontSize="small" color="primary" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={column.label}
                  secondary={column.required ? 'Obbligatoria' : undefined}
                  primaryTypographyProps={{
                    style: {
                      fontWeight: column.required ? 'bold' : 'normal',
                      color: column.required ? 'inherit' : (visibleColumns.includes(column.id) ? 'inherit' : 'text.disabled')
                    }
                  }}
                />
                <Switch
                  checked={visibleColumns.includes(column.id)}
                  disabled={column.required}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleColumnVisibility(column.id)}
                />
              </MenuItem>
            ))}

            <Divider />
            <MenuItem onClick={resetColumnsToDefault} sx={{ pl: 3 }}>
              <ListItemIcon>
                <ViewColumnIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Ripristina default" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Visualizzazione delle ore nel rundown (non modificata in questo task) */}
      {/* ... */}

      <Box sx={{
        // height: 'calc(100vh - 350px)', // L'altezza potrebbe necessitare aggiustamenti
        overflowY: 'auto', // Scroll verticale per la lista
        flexGrow: 1
      }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            // MODIFICA/AGGIUNTA START: Determinare se l'item è ON AIR o NEXT
            const isPlaying = item.isPlaying;
            const isNext = item.id === nextItemId;
            // MODIFICA/AGGIUNTA END

            // Verifica se l'elemento è esploso (ha sourceInfo)
            const isExploded = item.data && item.data.sourceInfo;
            const isMediaWithLinkedTemplate = item.type === 'MEDIA' && item.data.linkedTemplate && item.data.linkedTemplate.template;

            // CORREZIONE CRITICA: Riconoscimento elementi STORY complessi
            const isComplexStory = item.type === 'STORY' && (
              (item.data.mediaDetails && item.data.mediaDetails.clipPath) ||
              (item.data.templateDetails && item.data.templateDetails.templateFile) ||
              (item.data.templatesDetails && item.data.templatesDetails.length > 0)
            );

            const hasMedia = item.type === 'STORY' && item.data.mediaDetails && item.data.mediaDetails.clipPath;
            const hasTemplates = item.type === 'STORY' && (
              (item.data.templateDetails && item.data.templateDetails.templateFile) ||
              (item.data.templatesDetails && item.data.templatesDetails.length > 0)
            );
            const hasMultipleTemplates = item.type === 'STORY' && item.data.templatesDetails && item.data.templatesDetails.length > 1;

            // MIGLIORAMENTO 1: Oggetto con le proprietà dell'item per la funzione helper
            const itemProps = {
              isPlaying,
              isNext,
              isExploded,
              isMediaWithLinkedTemplate,
              isComplexStory,
              hasMedia,
              hasTemplates,
              hasMultipleTemplates
            };
            // MODIFICA/AGGIUNTA START: Logica per itemBackgroundColor e leftBorderStyle
            let itemBackgroundColor = 'transparent';
            // Applica lo sfondo alternato solo se l'item non è né ON AIR né NEXT
            if (index % 2 === 0 && !isPlaying && !isNext) {
                itemBackgroundColor = 'rgba(255, 255, 255, 0.03)';
            }

            let itemStyles = {}; // Per stili aggiuntivi come animazioni o boxShadow
            // leftBorderStyle non utilizzato, ma manteniamo la logica per riferimenti futuri

            if (isPlaying) {
              itemBackgroundColor = item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(33, 150, 243, 0.25)';
              // Bordo gestito direttamente nel Box sx
              itemStyles.boxShadow = '0 0 8px rgba(76, 175, 80, 0.3)'; // Ombra verde per ON AIR
              // itemStyles.animation = `${pulseAnimationGreen} 1.5s infinite ease-in-out`; // Descommenta per animazione ON AIR
            } else if (isNext) {
              itemBackgroundColor = 'rgba(255, 193, 7, 0.25)'; // Sfondo giallo ambrato per NEXT UP (Preview)
              // Bordo gestito direttamente nel Box sx
              itemStyles.boxShadow = '0 0 8px rgba(255, 193, 7, 0.3)'; // Ombra gialla per NEXT
              // itemStyles.animation = `${pulseAnimationYellow} 2s infinite ease-in-out alternate`; // Descommenta per animazione NEXT
            } else if (isMediaWithLinkedTemplate) {
                // Applica uno sfondo e bordo distintivo per media con template annidati che non sono ON AIR o NEXT
                if (itemBackgroundColor === 'transparent') itemBackgroundColor = 'rgba(161, 136, 127, 0.08)'; // Sfondo leggermente marroncino/grigio
                // Bordo gestito direttamente nel Box sx
            }
            // MODIFICA/AGGIUNTA END

            // Colore di sfondo distintivo per media con template annidato
            if (isMediaWithLinkedTemplate && !item.isPlaying) {
                itemBackgroundColor = 'rgba(100, 100, 0, 0.1)'; // Esempio: giallo scuro trasparente
            } else if (isMediaWithLinkedTemplate && item.isPlaying) {
                itemBackgroundColor = 'rgba(100, 100, 0, 0.25)'; // Più scuro quando in play
            }


            return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: '12px 20px',
                borderBottom: `1px solid ${broadcastColors.border.primary}`,
                backgroundColor: item.isPlaying
                  ? `${broadcastColors.status.onAir}20`
                  : isNext
                    ? `${broadcastColors.status.next}20`
                    : itemBackgroundColor,
                borderLeft: item.isPlaying
                  ? `4px solid ${broadcastColors.status.onAir}`
                  : isNext
                    ? `4px solid ${broadcastColors.status.next}`
                    : (isMediaWithLinkedTemplate ? `4px solid ${broadcastColors.status.warning}` :
                       isComplexStory ? `4px solid ${broadcastColors.status.warning}` : 'none'),
                pl: item.isPlaying || isNext || isMediaWithLinkedTemplate || isComplexStory ? 1 : 2,
                position: 'relative',
                transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
                boxShadow: item.isPlaying ? `0 0 12px ${broadcastColors.status.onAir}40` : 'none',
                cursor: 'pointer',
                fontFamily: broadcastColors.text?.fontFamily || 'inherit',
                '&:hover': {
                  backgroundColor: item.isPlaying
                    ? `${broadcastColors.status.onAir}30`
                    : isNext
                      ? `${broadcastColors.status.next}30`
                      : broadcastColors.background.elevated,
                  transform: 'translateY(-1px)',
                  boxShadow: item.isPlaying
                    ? `0 0 16px ${broadcastColors.status.onAir}60`
                    : '0 2px 8px rgba(0, 0, 0, 0.4)'
                },
                // RICHIESTA 2: Animazione per elementi ON AIR
                ...(item.isPlaying && {
                  '@keyframes onAirGlow': {
                    '0%': { boxShadow: `0 0 8px ${broadcastColors.status.onAir}40` },
                    '50%': { boxShadow: `0 0 20px ${broadcastColors.status.onAir}80` },
                    '100%': { boxShadow: `0 0 8px ${broadcastColors.status.onAir}40` }
                  },
                  animation: 'onAirGlow 2s infinite'
                })
              }}
              onClick={() => {
                // MIGLIORAMENTO 3: Apri dialog specifico per elementi STORY complessi
                if (item.type === 'STORY' && (isComplexStory || isExploded)) {
                  handleStoryDialogOpen(item);
                } else {
                  handleEditItemDialogOpen(item.id);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, item)}
              onDoubleClick={() => handlePlayItem(item)}
            >
              {/* MIGLIORAMENTO 1: Rendering dinamico delle colonne */}
              {visibleColumnConfigs.map((column, columnIndex) => {
                // Gestione speciale per lo spazio tra IN e OUT
                const showSpaceBefore = column.id === 'outPoint' && visibleColumns.includes('inPoint');

                return (
                  <React.Fragment key={column.id}>
                    {showSpaceBefore && (
                      <Box sx={{ width: '20px', flexShrink: 0 }}></Box>
                    )}
                    {renderColumnContent(column.id, item, index, itemProps)}
                  </React.Fragment>
                );
              })}
            </Box>

          )})
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {items.length === 0 ? (
              <>
                <Typography variant="body1">
                  Nessun elemento nel rundown
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Clicca su 'Aggiungi' per aggiungere elementi
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1">
                  Nessun elemento corrisponde ai filtri selezionati
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Modifica i filtri per visualizzare gli elementi
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFilterOptions({
                    showExplodedItems: true,
                    showRegularItems: true,
                    filterByScaletta: null
                  })}
                  sx={{ mt: 2 }}
                >
                  Reimposta filtri
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* MIGLIORAMENTO 3: Dialog dettagliato per elementi STORY */}
      <StoryItemDialog
        open={storyDialogOpen}
        onClose={handleStoryDialogClose}
        item={selectedStoryItem}
        onSave={handleStoryItemSave}
        onDelete={handleStoryItemDelete}
        connected={connected}
      />
    </>
  );
};

export default RundownList;
