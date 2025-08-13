import { useContext, useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { v4 as uuidv4 } from 'uuid';
import CasparContext from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { timecodeToFrames } from './utils/timecodeUtils';
import * as casparCommands from './utils/casparCommands';
import { isCurrentUserDesignatedPlayoutOperator, canUserSendToRundown } from '../../utils/permissionsChecker';
import supabase from '../../supabaseClient';

// Hooks personalizzati
import useScalettaItems from './hooks/useScalettaItems';
import usePreviewPlayer from './hooks/usePreviewPlayer';
import useDialogs from './hooks/useDialogs';
import useOscData from './hooks/useOscData';
import useMultiSelection from './hooks/useMultiSelection';
import usePlaybackSync from '../../hooks/usePlaybackSync';

// Componenti
import PreviewSection from './components/PreviewSection';
import ScalettaTable from './components/ScalettaTable';
import ScalettaCardView from './components/ScalettaCardView';
import MediaDialog from './components/MediaDialog';
import TemplateDialog from './components/TemplateDialog';
import CollaboratorsDialog from './components/CollaboratorsDialog';
import StoryDialog from './components/StoryDialog';
import ScalettaGlobalInfoBar from './components/ScalettaGlobalInfoBar';
import ScalettaTableToolbar from './components/ScalettaTableToolbar';
import ItemEditPanel from './components/ItemEditPanel';
// import PlaybackControls from './components/PlaybackControls';
import ItemContextControls from './components/ItemContextControls';
import ExtendedControls from './components/ExtendedControls';
import ProfessionalTimeline from './components/ProfessionalTimeline';
import WeekDaySelectDialog from './components/WeekDaySelectDialog';
import SendToRundownDialog from './components/SendToRundownDialog';
import RundownSelectorDialog from './components/RundownSelectorDialog';

// Stili CSS
import './ScaletteEditor.css';

// RICHIESTA 2: Tema broadcast professionale
import { broadcastComponents, broadcastColors, broadcastAnimations } from '../../styles/broadcastTheme';

/**
 * Componente principale per l'editor di scalette
 *
 * @returns {JSX.Element} - Componente React
 */
const ScaletteEditor = () => {
  // Accesso al contesto CasparCG
  const { connected, getAllMedia, getTemplateList, cgAdd, sendCommand } = useContext(CasparContext); // 🔥 USANDO getAllMedia per assets + CasparCG

  // Accesso al contesto Rundown
  const rundownContext = useRundown();

  // Ottieni l'utente corrente
  const { currentUserId } = useAuth();

  // Stato per i permessi di playout
  const [isPlayoutOperator, setIsPlayoutOperator] = useState(false);

  // Stato per i dialoghi
  const [collaboratorsDialogOpen, setCollaboratorsDialogOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [weekDaySelectDialogOpen, setWeekDaySelectDialogOpen] = useState(false);
  const [sendToRundownDialogOpen, setSendToRundownDialogOpen] = useState(false);
  const [sendToRundownLoading, setSendToRundownLoading] = useState(false);
  const [rundownSelectorDialogOpen, setRundownSelectorDialogOpen] = useState(false);
  const [selectedTargetRundown, setSelectedTargetRundown] = useState(null);

  // Stato per il pannello di modifica
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  // Stato per il menu delle impostazioni
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);

  // Stato per l'altezza dell'area superiore
  const [topAreaHeight, setTopAreaHeight] = useState(300);

  // Stato per la modalità di transizione (rimosso perché non utilizzato)
  // const [transitionType, setTransitionType] = useState('CUT');

  // Stato per la modalità auto (rimosso perché non utilizzato)
  // const [autoMode, setAutoMode] = useState(false);

  // Stato per la modalità di visualizzazione (tabella o timeline)
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'

  // Stato per la modalità di visualizzazione della tabella (compact o detailed)
  const [tableViewMode, setTableViewMode] = useState('compact'); // 'compact' | 'detailed'

  // Stato per i log di sistema
  const [systemLogs, setSystemLogs] = useState([]);

  // Stato per le colonne visibili nella tabella
  const [visibleColumns, setVisibleColumns] = useState([
    'index', 'startTime', 'duration', 'location', 'name', 'file', 'notes', 'actions'
  ]);

  // Stato per la ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  // Riferimento per il trascinamento dell'area superiore
  const resizeHandleRef = useRef(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Tema e media query
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Hooks personalizzati
  const previewChannel = 3; // Canale 3 per la preview come richiesto
  const previewPlayer = usePreviewPlayer(previewChannel);
  const scalettaItems = useScalettaItems();
  const dialogs = useDialogs();
  const calendar = useCalendar();
  const oscData = useOscData(previewChannel, 1); // Dati OSC per il playhead

  // Hook per la selezione multipla
  const multiSelection = useMultiSelection(scalettaItems.scalettaItems, {
    onSelectionChange: (selectedItems, selectedIds) => {
      console.log('🔄 Selezione cambiata:', { selectedItems, selectedIds });
    }
  });

  // RICHIESTA 1: Hook per sincronizzazione stato riproduzione
  const playbackSync = usePlaybackSync();

  // CORREZIONE CRITICA: Sincronizzazione automatica con elementi del rundown in riproduzione
  useEffect(() => {
    if (rundownContext?.items) {
      rundownContext.items.forEach(item => {
        if (item.isPlaying) {
          console.log(`🔄 [SCALETTE SYNC] Sincronizzazione elemento in riproduzione dal rundown: ${item.id}`);
          playbackSync.updatePlaybackStatus(item.id, {
            status: 'PLAYING',
            channel: item.data?.casparcgConfig?.channel || 1,
            layer: item.data?.casparcgConfig?.layer || 1,
            startTime: item.playingStartTime || Date.now(),
            source: 'rundown'
          });
        }
      });
    }
  }, [rundownContext?.items, playbackSync]);

  // Verifica se l'utente è un operatore di playout
  useEffect(() => {
    if (!currentUserId) return;

    const checkPlayoutPermissions = async () => {
      const isOperator = await isCurrentUserDesignatedPlayoutOperator(currentUserId);
      setIsPlayoutOperator(isOperator);
    };

    checkPlayoutPermissions();

    // Sottoscrizione ai cambiamenti nella tabella playout_assignments
    const today = new Date().toISOString().split('T')[0];
    const channel = supabase
      .channel('playout-assignments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playout_assignments',
        filter: `assignment_date=eq.${today} AND user_id=eq.${currentUserId}`
      }, () => {
        // Aggiorna lo stato quando ci sono cambiamenti
        checkPlayoutPermissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Effetto per gestire il ridimensionamento dell'area superiore
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;

      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(100, Math.min(window.innerHeight * 0.7, startHeightRef.current + deltaY));

      setTopAreaHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;

      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e) => {
      isResizingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = topAreaHeight;
      document.body.style.cursor = 'row-resize';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeHandle = resizeHandleRef.current;
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [topAreaHeight]);

  // Effetto per filtrare gli elementi in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Se non c'è un termine di ricerca, mostra tutti gli elementi
      setFilteredItems(scalettaItems.scalettaItems);
      return;
    }

    // Filtra gli elementi in base al termine di ricerca
    const filtered = scalettaItems.scalettaItems.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();

      // Cerca nel nome
      if (item.name && item.name.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Cerca nei dati
      if (item.data) {
        // Cerca nel nome personalizzato
        if (item.data.customName && item.data.customName.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Cerca nel file
        if (item.type === 'MEDIA' && item.data.clip && item.data.clip.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        if (item.type === 'TEMPLATE' && item.data.template && item.data.template.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Cerca nelle note
        if (item.data.notes && item.data.notes.toLowerCase().includes(searchTermLower)) {
          return true;
        }
      }

      return false;
    });

    setFilteredItems(filtered);
  }, [searchTerm, scalettaItems.scalettaItems]);

  // Effetto per caricare le liste di media e template all'avvio
  useEffect(() => {
    // 🔥 CARICA SEMPRE assets locali, CasparCG se connesso
    if (typeof getAllMedia === 'function') getAllMedia();
    if (connected && typeof getTemplateList === 'function') getTemplateList();
  }, [connected, getAllMedia, getTemplateList]);

  // Funzione per gestire la selezione di un template
  const handleSelectTemplate = async (template) => {
    // Crea un oggetto template con le proprietà necessarie se è una stringa
    const templateObj = typeof template === 'string'
      ? {
          path: template,
          name: template.split('/').pop() // Estrae il nome del file dal path
        }
      : template;

    // Imposta il template selezionato
    previewPlayer.setPreviewTemplate(templateObj);

    // Per compatibilità con il codice esistente
    const templatePath = typeof template === 'string' ? template : template.path;
    let defaultData = {};
    const name = templatePath.toLowerCase();
    if (name.includes('ticker')) defaultData = { text: 'Ticker' };
    else if (name.includes('lower') && name.includes('third')) defaultData = { title: 'Titolo', subtitle: 'Sottotitolo' };
    else if (name.includes('logo')) defaultData = { position: 'topright' };
    else defaultData = { text: 'Testo' };

    try {
      if (typeof cgAdd === 'function') {
        await cgAdd(previewChannel, 2, 1, template, true, defaultData);
      } else {
        console.error("La funzione 'cgAdd' non è disponibile nel CasparContext.");
        dialogs.setErrorMessage("Errore: la funzione di aggiunta template non è disponibile.");
      }
    } catch (e) {
      dialogs.setErrorMessage(`Errore aggiunta template: ${e.message}`);
    }
  };

  // Funzione per gestire il toggle dell'area superiore
  // const handleToggleTopArea = () => {
  //   setIsTopAreaCollapsed(!isTopAreaCollapsed);
  // };

  // Funzioni rimosse perché non utilizzate:
  // - handleTransitionChange: gestione cambio transizione
  // - handleToggleAutoMode: toggle modalità automatica

  // Funzione per gestire il cambio di modalità di visualizzazione
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    addSystemLog(`Vista cambiata a: ${newViewMode === 'table' ? 'Tabella' : 'Timeline'}`, 'info');
  };

  // Funzione per gestire il cambio di modalità di visualizzazione della tabella
  const handleTableViewModeChange = (newTableViewMode) => {
    console.log('🔄 ScaletteEditor handleTableViewModeChange:', {
      currentMode: tableViewMode,
      newMode: newTableViewMode
    });

    setTableViewMode(newTableViewMode);
    addSystemLog(`Modalità tabella cambiata a: ${newTableViewMode === 'compact' ? 'Compatta' : 'Dettagliata'}`, 'info');

    console.log('✅ Table view mode updated to:', newTableViewMode);
  };

  // Funzione per gestire la selezione di un elemento dalla timeline
  const handleTimelineItemSelect = (item) => {
    if (item) {
      scalettaItems.setSelectedItemIndex(scalettaItems.scalettaItems.findIndex(i => i.id === item.id));
    }
  };

  // Funzione per gestire l'aggiornamento di un elemento dalla timeline
  const handleTimelineItemUpdate = (updateData) => {
    if (updateData && updateData.itemId && scalettaItems && scalettaItems.scalettaItems) {
      // Trova l'elemento da aggiornare
      const itemIndex = scalettaItems.scalettaItems.findIndex(i => i.id === updateData.itemId);
      if (itemIndex !== -1) {
        // Applica gli aggiornamenti
        scalettaItems.updateItem(updateData.itemId, updateData.updates);
        addSystemLog(`Elemento aggiornato dalla timeline: ${updateData.itemId}`, 'info');
      } else {
        console.warn('Elemento non trovato per aggiornamento timeline:', updateData.itemId);
      }
    } else {
      console.warn('Dati di aggiornamento timeline non validi:', updateData);
    }
  };

  /**
   * Funzione per gestire la riproduzione di un elemento media dalla timeline
   * Utilizza la stessa logica di handlePlayItem ma specifica per elementi MEDIA
   */
  const handlePlayMedia = (item) => {
    try {
      if (!item || !item.data) {
        console.error("Impossibile riprodurre il media: item o item.data non definito");
        return;
      }

      // Verifica che sia effettivamente un elemento MEDIA
      if (item.type !== 'MEDIA') {
        console.error("Impossibile riprodurre: l'elemento non è di tipo MEDIA");
        return;
      }

      // Utilizza la logica esistente di handlePlayItem
      handlePlayItem(item);
      addSystemLog(`Riproduzione media dalla timeline: ${item.name}`, 'info');
    } catch (e) {
      console.error(`Errore riproduzione media dalla timeline:`, e);
      dialogs.setErrorMessage(`Errore riproduzione media: ${e.message}`);
    }
  };

  /**
   * Funzione per gestire lo stop di un elemento media dalla timeline
   * Utilizza la stessa logica di handleStopItem ma specifica per elementi MEDIA
   */
  const handleStopMedia = (item) => {
    try {
      if (!item || !item.data) {
        console.error("Impossibile fermare il media: item o item.data non definito");
        return;
      }

      // Verifica che sia effettivamente un elemento MEDIA
      if (item.type !== 'MEDIA') {
        console.error("Impossibile fermare: l'elemento non è di tipo MEDIA");
        return;
      }

      // Utilizza la logica esistente di handleStopItem
      handleStopItem();
      addSystemLog(`Media fermato dalla timeline: ${item.name}`, 'info');
    } catch (e) {
      console.error(`Errore stop media dalla timeline:`, e);
      dialogs.setErrorMessage(`Errore stop media: ${e.message}`);
    }
  };

  // Funzione per gestire la riproduzione di un elemento dalla timeline
  const handleTimelineItemPlay = (item) => {
    if (item) {
      if (item.type === 'MEDIA') {
        handlePlayMedia(item);
      } else if (item.type === 'TEMPLATE') {
        handlePlayTemplate(item);
      } else if (item.type === 'STORY') {
        handlePlayStory(item);
      }
    }
  };

  // Funzione per gestire lo stop di un elemento dalla timeline
  const handleTimelineItemStop = (item) => {
    if (item) {
      if (item.type === 'MEDIA') {
        handleStopMedia(item);
      } else if (item.type === 'TEMPLATE') {
        handleStopTemplate(item);
      } else if (item.type === 'STORY') {
        handleStopStory(item);
      }
    }
  };

  // Funzione per eseguire il take
  // const handleTake = () => {
  //   if (scalettaItems.selectedItemIndex !== -1) {
  //     const selectedItem = scalettaItems.scalettaItems[scalettaItems.selectedItemIndex];
  //     // Esegui il play dell'item selezionato
  //     if (selectedItem.type === 'MEDIA') {
  //       handlePlayItem(selectedItem);
  //     } else if (selectedItem.type === 'TEMPLATE') {
  //       handlePlayTemplate(selectedItem);
  //     }
  //     // Aggiungi un log di sistema
  //     addSystemLog(`TAKE eseguito per: ${selectedItem.name}`, 'info');
  //   }
  // };

  // Funzione per aggiungere un log di sistema
  const addSystemLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prevLogs => [
      { message, type, timestamp },
      ...prevLogs.slice(0, 99) // Mantieni solo gli ultimi 100 log
    ]);
  };

  // Funzione per aggiungere un media alla scaletta
  const handleAddMedia = () => {
    if (!previewPlayer.previewMedia) return;

    // Ottieni il path del media
    const mediaPath = typeof previewPlayer.previewMedia === 'string'
      ? previewPlayer.previewMedia
      : previewPlayer.previewMedia.path;

    // Ottieni i valori dai campi di input per IN e OUT
    const inPointField = document.getElementById('inPointField');
    const outPointField = document.getElementById('outPointField');

    const inPoint = inPointField ? inPointField.value : '00:00:00:00';
    const outPoint = outPointField ? outPointField.value : '';

    // 🎯 DURATA REALE dal CLS o dalla media info
    let realDuration = null;
    if (previewPlayer.previewMedia && typeof previewPlayer.previewMedia === 'object') {
      if (previewPlayer.previewMedia.duration) {
        // Se duration è in millisecondi, convertilo in HH:MM:SS
        const ms = previewPlayer.previewMedia.duration;
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;
        realDuration = `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        
        console.log(`📊 SCALETTA DURATION: "${mediaPath}" = ${realDuration} (${ms}ms)`);
      }
    }

    const mediaData = {
      clip: mediaPath,
      channel: previewChannel,
      layer: 1,
      customName: typeof previewPlayer.previewMedia === 'string'
        ? previewPlayer.previewMedia.split('/').pop()
        : previewPlayer.previewMedia.name,
      startTime: '00:00:00',
      duration: realDuration || outPoint, // USA DURATA REALE, outPoint solo se manuale
      inPoint: inPoint,
      outPoint: outPoint || realDuration, // Se non c'è outPoint, usa la durata
      location: `CH${previewChannel}-L1`,
      notes: ''
    };

    scalettaItems.addMediaItem(mediaData);
  };

  // Funzione per aggiungere un template alla scaletta
  const handleAddTemplate = () => {
    if (!previewPlayer.previewTemplate) return;

    // Ottieni il path del template
    const templatePath = typeof previewPlayer.previewTemplate === 'string'
      ? previewPlayer.previewTemplate
      : previewPlayer.previewTemplate.path;

    // Prepara i dati del template in base al tipo
    let templateData = {};

    // Determina il tipo di template in base al nome
    if (templatePath.toLowerCase().includes('lower')) {
      // Lower third
      templateData = {
        text: 'Titolo',
        subtitle: 'Sottotitolo'
      };
    } else if (templatePath.toLowerCase().includes('ticker')) {
      // Ticker
      templateData = {
        text: 'Testo scorrevole'
      };
    } else if (templatePath.toLowerCase().includes('logo')) {
      // Logo
      templateData = {
        url: 'logo.png'
      };
    } else {
      // Template generico
      templateData = {
        text: 'Testo template'
      };
    }

    const template = {
      template: templatePath,
      channel: previewChannel,
      layer: 20,
      cgLayer: 1,
      playOnLoad: true,
      data: templateData,
      customName: typeof previewPlayer.previewTemplate === 'string'
        ? previewPlayer.previewTemplate.split('/').pop()
        : previewPlayer.previewTemplate.name,
      startTime: '00:00:00',
      duration: '', // Nessuna durata di default per template
      location: `CH${previewChannel}-L20`,
      notes: '',
      autoRemove: false
    };

    scalettaItems.addTemplateItem(template);
  };

  // Funzione per riprodurre un template grafico (ora asincrona)
  const handlePlayTemplate = async (template) => {
    try {
      if (!template || !template.data) {
        console.error("Impossibile riprodurre il template: template o template.data non definito");
        throw new Error("Template o template.data non definito");
      }

      // Estrai i dati dal campo data JSONB
      // Struttura attesa: template.data.templateDetails e template.data.casparcgConfig
      const templateDetails = template.data.templateDetails;
      const casparcgConfig = template.data.casparcgConfig;

      // Verifica che templateDetails e casparcgConfig siano definiti
      if (!templateDetails) {
        console.error("Impossibile riprodurre il template: templateDetails non definito");
        dialogs.setErrorMessage("Errore: dettagli del template non definiti");
        throw new Error("templateDetails non definito");
      }

      if (!casparcgConfig) {
        console.error("Impossibile riprodurre il template: casparcgConfig non definito");
        dialogs.setErrorMessage("Errore: configurazione CasparCG non definita");
        throw new Error("casparcgConfig non definito");
      }

      // Assicurati di usare il canale di preview
      const channel = previewChannel;

      // Verifica che tutti i parametri necessari siano definiti
      const layer = templateDetails.casparcgConfig?.layer || casparcgConfig.layer;
      const cgLayer = templateDetails.casparcgConfig?.cgLayer || 1;
      const templateName = templateDetails.templateFile;
      const data = templateDetails.instanceData;
      const playOnLoad = templateDetails.casparcgConfig?.playOnLoad !== undefined ?
                         templateDetails.casparcgConfig.playOnLoad : true;

      // Debug: log dei layer utilizzati
      console.log(`[DEBUG] Template layer configuration:`, {
        templateDetailsLayer: templateDetails.casparcgConfig?.layer,
        casparcgConfigLayer: casparcgConfig.layer,
        finalLayer: layer,
        cgLayer: cgLayer,
        templateName: templateName
      });

      if (typeof layer === 'undefined' || layer === null) {
        console.error("Impossibile riprodurre il template: layer non definito");
        dialogs.setErrorMessage("Errore: layer del template non definito");
        throw new Error("layer non definito");
      }

      if (typeof cgLayer === 'undefined' || cgLayer === null) {
        console.error("Impossibile riprodurre il template: cgLayer non definito");
        dialogs.setErrorMessage("Errore: cgLayer del template non definito");
        throw new Error("cgLayer non definito");
      }

      if (!templateName || typeof templateName !== 'string' || templateName.trim() === '') {
        console.error("Impossibile riprodurre il template: nome del template non definito o non valido");
        dialogs.setErrorMessage("Errore: nome del template non definito o non valido");
        throw new Error("nome del template non valido");
      }

      if (!data || typeof data !== 'object') {
        console.error("Impossibile riprodurre il template: dati del template non definiti o non validi");
        dialogs.setErrorMessage("Errore: dati del template non definiti o non validi");
        throw new Error("dati del template non validi");
      }

      console.log(`Riproducendo template ${templateName} sul canale ${channel}, layer ${layer}, cgLayer ${cgLayer}`);

      // Prepara i dati per il template
      // Nota: i dati JSON vengono gestiti direttamente dalla funzione generateCgAddCommand

      // Aggiungi il template
      if (typeof sendCommand === 'function') {
        // Prima aggiungi il template
        const command = casparCommands.generateCgAddCommand(channel, layer, cgLayer, templateName, playOnLoad, data);
        console.log(`Invio comando: ${command}`);

        await sendCommand(command);

        // Se playOnLoad è false, riproduci manualmente il template
        if (!playOnLoad) {
          // Aspetta un po' prima di inviare il comando PLAY
          await new Promise(resolve => setTimeout(resolve, 100));

          const playCommand = casparCommands.generateCgPlayCommand(channel, layer, cgLayer);
          console.log(`Invio comando: ${playCommand}`);
          await sendCommand(playCommand);
        }
      } else {
        throw new Error("sendCommand non disponibile");
      }
    } catch (e) {
      console.error(`Errore riproduzione template:`, e);
      dialogs.setErrorMessage(`Errore riproduzione template: ${e.message}`);
      throw e; // Rilancia l'errore per permettere la gestione asincrona
    }
  };

  // Funzione per fermare un template grafico
  const handleStopTemplate = (template) => {
    try {
      if (!template || !template.data) {
        console.error("Impossibile fermare il template: template o template.data non definito");
        return;
      }

      // Estrai i dati dal campo data JSONB
      // Struttura attesa: template.data.templateDetails e template.data.casparcgConfig
      const templateDetails = template.data.templateDetails;
      const casparcgConfig = template.data.casparcgConfig;

      // Verifica che templateDetails e casparcgConfig siano definiti
      if (!templateDetails) {
        console.error("Impossibile fermare il template: templateDetails non definito");
        dialogs.setErrorMessage("Errore: dettagli del template non definiti");
        return;
      }

      if (!casparcgConfig) {
        console.error("Impossibile fermare il template: casparcgConfig non definito");
        dialogs.setErrorMessage("Errore: configurazione CasparCG non definita");
        return;
      }

      // Assicurati di usare il canale di preview
      const channel = previewChannel;

      // Verifica che layer e cgLayer siano definiti
      const layer = templateDetails.casparcgConfig?.layer || casparcgConfig.layer;
      const cgLayer = templateDetails.casparcgConfig?.cgLayer || 1;

      if (typeof layer === 'undefined' || layer === null) {
        console.error("Impossibile fermare il template: layer non definito");
        dialogs.setErrorMessage("Errore: layer del template non definito");
        return;
      }

      if (typeof cgLayer === 'undefined' || cgLayer === null) {
        console.error("Impossibile fermare il template: cgLayer non definito");
        dialogs.setErrorMessage("Errore: cgLayer del template non definito");
        return;
      }

      console.log(`Fermando template sul canale ${channel}, layer ${layer}, cgLayer ${cgLayer}`);

      // Ferma il template
      if (typeof sendCommand === 'function') {
        const command = casparCommands.generateCgStopCommand(channel, layer, cgLayer);
        console.log(`Invio comando: ${command}`);
        sendCommand(command)
          .catch(error => {
            console.error(`Errore durante l'arresto del template: ${error.message || JSON.stringify(error)}`);
            dialogs.setErrorMessage(`Errore arresto template: ${error.message}`);
          });
      }
    } catch (e) {
      console.error(`Errore arresto template:`, e);
      dialogs.setErrorMessage(`Errore arresto template: ${e.message}`);
    }
  };

  // Funzione per rimuovere un template grafico
  const handleRemoveTemplate = (template) => {
    try {
      if (!template || !template.data) {
        console.error("Impossibile rimuovere il template: template o template.data non definito");
        return;
      }

      // Prima rimuovi l'elemento dalla scaletta
      if (template.id) {
        console.log(`Rimuovendo template con ID ${template.id} dalla scaletta`);
        scalettaItems.removeItem(template.id);
      }

      // Estrai i dati dal campo data JSONB
      // Struttura attesa: template.data.templateDetails e template.data.casparcgConfig
      const templateDetails = template.data.templateDetails;
      const casparcgConfig = template.data.casparcgConfig;

      // Verifica che templateDetails e casparcgConfig siano definiti
      if (!templateDetails) {
        console.error("Impossibile rimuovere il template: templateDetails non definito");
        dialogs.setErrorMessage("Errore: dettagli del template non definiti");
        return;
      }

      if (!casparcgConfig) {
        console.error("Impossibile rimuovere il template: casparcgConfig non definito");
        dialogs.setErrorMessage("Errore: configurazione CasparCG non definita");
        return;
      }

      // Assicurati di usare il canale di preview
      const channel = casparcgConfig.channel || previewChannel;

      // Verifica che layer e cgLayer siano definiti
      const layer = templateDetails.casparcgConfig?.layer || casparcgConfig.layer;
      const cgLayer = templateDetails.casparcgConfig?.cgLayer || 1;

      if (typeof layer === 'undefined' || layer === null) {
        console.error("Impossibile rimuovere il template: layer non definito");
        dialogs.setErrorMessage("Errore: layer del template non definito");
        return;
      }

      if (typeof cgLayer === 'undefined' || cgLayer === null) {
        console.error("Impossibile rimuovere il template: cgLayer non definito");
        dialogs.setErrorMessage("Errore: cgLayer del template non definito");
        return;
      }

      console.log(`Rimuovendo template sul canale ${channel}, layer ${layer}, cgLayer ${cgLayer}`);

      // Rimuovi il template da CasparCG
      if (typeof sendCommand === 'function') {
        const command = casparCommands.generateCgRemoveCommand(channel, layer, cgLayer);
        console.log(`Invio comando: ${command}`);
        sendCommand(command)
          .then(() => {
            console.log(`Template rimosso con successo dal canale ${channel}-${layer}, cgLayer ${cgLayer}`);
          })
          .catch(error => {
            console.error(`Errore durante la rimozione del template da CasparCG:`, error);
            dialogs.setErrorMessage(`Errore rimozione template da CasparCG: ${error.message}`);
            // L'elemento è già stato rimosso dalla scaletta, quindi non è necessario fare altro qui
          });
      }
    } catch (e) {
      console.error(`Errore rimozione template:`, e);
      dialogs.setErrorMessage(`Errore rimozione template: ${e.message}`);
    }
  };

  // Funzione per aprire il dialogo di invio al rundown
  const handleSendToRundown = async () => {
    console.group('🎯 DEBUG: Apertura Dialogo Invio Rundown');

    // Verifica i permessi dell'utente per la scaletta
    const canSend = canUserSendToRundown(scalettaItems.userRoleForScaletta, isPlayoutOperator);

    if (!canSend) {
      console.log('❌ Permessi insufficienti per la scaletta');
      console.groupEnd();
      dialogs.setErrorMessage("Non hai i permessi per inviare la scaletta al rundown. Devi essere il proprietario, un operatore di playout designato, o avere il ruolo 'playout_operator'.");
      return;
    }

    // CORREZIONE CRITICA: Verifica permessi sul rundown di destinazione
    if (rundownContext?.useSupabaseSync && rundownContext?.activeRundownId) {
      try {
        console.log('🔍 Verifica permessi rundown di destinazione:', rundownContext.activeRundownId);

        // CORREZIONE: Percorso corretto per l'import del permissionsChecker
        const { getUserRoleForRundown, canUserEditRundown } = await import('../../utils/permissionsChecker');

        // CORREZIONE: Import del debugger permessi per analisi dettagliata
        const { getPermissionsDebugMessage } = await import('../../utils/rundownPermissionsDebugger');

        // Verifica il ruolo dell'utente sul rundown di destinazione
        const userRoleForRundown = await getUserRoleForRundown(currentUserId, rundownContext.activeRundownId);
        console.log('👤 Ruolo utente sul rundown:', userRoleForRundown);

        if (!canUserEditRundown(userRoleForRundown)) {
          console.log('❌ Permessi insufficienti sul rundown di destinazione');

          // CORREZIONE: Analisi dettagliata dei permessi per debugging
          try {
            const debugMessage = await getPermissionsDebugMessage(rundownContext.activeRundownId);
            console.log('🔍 Debug permessi dettagliato:\n', debugMessage);
          } catch (debugError) {
            console.error('Errore debug permessi:', debugError);
          }

          console.groupEnd();
          dialogs.setErrorMessage("Non hai i permessi per modificare il rundown di destinazione. Devi essere proprietario, editor o playout_operator del rundown.");
          return;
        }

        console.log('✅ Permessi verificati sul rundown di destinazione');
      } catch (error) {
        console.error('❌ Errore nella verifica dei permessi del rundown:', error);
        console.groupEnd();
        dialogs.setErrorMessage(`Errore nella verifica dei permessi: ${error.message}`);
        return;
      }
    }

    if (!rundownContext || typeof rundownContext.addMedia !== 'function' || typeof rundownContext.addTemplate !== 'function') {
      console.error("❌ Le funzioni addMedia o addTemplate non sono disponibili da useRundown.");
      console.groupEnd();
      dialogs.setErrorMessage("Errore: le funzioni per inviare al rundown non sono disponibili.");
      return;
    }

    // CORREZIONE CRITICA: Verifica che ci sia un rundown attivo o apri il selettore
    if (rundownContext?.useSupabaseSync && !rundownContext?.activeRundownId) {
      console.log('❌ Nessun rundown attivo, apertura selettore rundown');
      console.groupEnd();

      // Apri il dialogo di selezione rundown invece di mostrare errore
      setRundownSelectorDialogOpen(true);
      return;
    }

    // Determina quali elementi inviare
    const itemsToSend = multiSelection.hasSelection
      ? multiSelection.getSelectedItems()
      : scalettaItems.scalettaItems;

    console.log('📋 Stato selezione:', {
      hasSelection: multiSelection.hasSelection,
      selectedCount: multiSelection.selectedCount,
      totalItems: scalettaItems.scalettaItems.length,
      itemsToSend: itemsToSend.length
    });

    console.log('📝 Elementi da inviare:', itemsToSend.map(item => ({
      id: item.id,
      type: item.type,
      name: item.data?.customName || item.name
    })));

    if (itemsToSend.length === 0) {
      console.log('❌ Nessun elemento da inviare');
      console.groupEnd();
      dialogs.setErrorMessage("Nessun elemento da inviare al rundown.");
      return;
    }

    console.log('✅ Apertura dialogo di conferma');
    console.groupEnd();

    // Apri il dialogo di conferma
    setSendToRundownDialogOpen(true);
  };

  /**
   * Gestisce la selezione di un rundown di destinazione
   */
  const handleRundownSelection = async (selectedRundown) => {
    try {
      console.log('🎯 [SCALETTE EDITOR] Rundown selezionato:', selectedRundown);

      // Salva il rundown selezionato
      setSelectedTargetRundown(selectedRundown);

      // Chiudi il dialogo di selezione
      setRundownSelectorDialogOpen(false);

      // CORREZIONE CRITICA: Imposta il rundown attivo e verifica che sia stato caricato
      if (rundownContext?.useSupabaseSync && rundownContext?.setActiveRundownId) {
        console.log('🔄 [SCALETTE EDITOR] Impostazione rundown attivo:', selectedRundown.id);

        try {
          await rundownContext.setActiveRundownId(selectedRundown.id);

          // Verifica che il rundown sia stato effettivamente caricato
          const maxRetries = 5;
          let retries = 0;

          while (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Attendi 200ms

            if (rundownContext.activeRundownId === selectedRundown.id) {
              console.log('✅ [SCALETTE EDITOR] Rundown attivo verificato:', selectedRundown.id);
              break;
            }

            retries++;
            console.log(`🔄 [SCALETTE EDITOR] Tentativo ${retries}/${maxRetries} - Verifica rundown attivo...`);
          }

          if (retries >= maxRetries) {
            throw new Error('Timeout: Rundown attivo non impostato correttamente');
          }

        } catch (setActiveError) {
          console.error('❌ [SCALETTE EDITOR] Errore impostazione rundown attivo:', setActiveError);
          dialogs.setErrorMessage(`Errore nell'impostazione del rundown attivo: ${setActiveError.message}`);
          return;
        }
      }

      // Procedi con l'apertura del dialogo di invio solo dopo verifica successo
      setTimeout(() => {
        handleSendToRundown();
      }, 100);

    } catch (error) {
      console.error('❌ [SCALETTE EDITOR] Errore nella selezione del rundown:', error);
      dialogs.setErrorMessage(`Errore nella selezione del rundown: ${error.message}`);
    }
  };

  // Funzione per confermare l'invio al rundown
  const handleConfirmSendToRundown = async (confirmData) => {
    const { items, options, conflicts } = confirmData;

    // CORREZIONE: Import dinamico del monitor di sincronizzazione
    const {
      monitorRundownState,
      validateRundownState,
      createRundownLogger
    } = await import('../../utils/rundownSyncMonitor');

    const logger = createRundownLogger('SEND_TO_RUNDOWN');

    logger.group('Invio al Rundown con Gestione Conflitti');
    logger.info('Elementi ricevuti:', items.length);
    logger.info('Opzioni:', options);
    logger.info('Conflitti rilevati:', conflicts?.length || 0);
    logger.debug('Lista elementi:', items.map(item => ({ id: item.id, type: item.type, name: item.data?.customName || item.name })));

    // CORREZIONE CRITICA: Monitoraggio stato rundown all'inizio del processo
    monitorRundownState(rundownContext, 'Inizio Invio');
    const initialValidation = validateRundownState(rundownContext, 'Pre-Invio');

    if (!initialValidation.valid) {
      logger.error('Stato rundown non valido per l\'invio:', initialValidation.issues);
      logger.groupEnd();
      dialogs.setErrorMessage(`Impossibile procedere con l'invio: ${initialValidation.issues.join(', ')}`);
      return;
    }

    setSendToRundownLoading(true);

    try {
      // CORREZIONE CRITICA: Verifica e ripristina rundown attivo se necessario
      if (!rundownContext?.activeRundownId && selectedTargetRundown?.id) {
        console.warn('⚠️ [SYNC DEBUG] Rundown attivo perso, tentativo di ripristino...');

        try {
          if (rundownContext?.setActiveRundownId) {
            await rundownContext.setActiveRundownId(selectedTargetRundown.id);
            console.log('✅ [SYNC DEBUG] Rundown attivo ripristinato:', selectedTargetRundown.id);

            // Attendi un momento per assicurarsi che lo stato sia aggiornato
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verifica che il ripristino sia avvenuto
            if (!rundownContext.activeRundownId) {
              throw new Error('Impossibile ripristinare rundown attivo');
            }
          } else {
            throw new Error('Funzione setActiveRundownId non disponibile');
          }
        } catch (restoreError) {
          console.error('❌ [SYNC DEBUG] Errore ripristino rundown attivo:', restoreError);
          console.groupEnd();
          dialogs.setErrorMessage(`Errore: rundown di destinazione non disponibile. ${restoreError.message}`);
          return;
        }
      }

      // Verifica finale che il rundown sia attivo
      if (!rundownContext?.activeRundownId) {
        console.error('❌ [SYNC DEBUG] Nessun rundown attivo dopo verifica/ripristino');
        console.groupEnd();
        dialogs.setErrorMessage('Errore: nessun rundown di destinazione attivo. Riprova la selezione del rundown.');
        return;
      }

      console.log('✅ [SYNC DEBUG] Rundown attivo confermato:', rundownContext.activeRundownId);

      // Verifica unicità degli elementi per evitare duplicazioni
      const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(i => i.id === item.id)
      );

      if (uniqueItems.length !== items.length) {
        console.warn(`⚠️ DUPLICAZIONE RILEVATA: ${items.length} elementi ricevuti, ${uniqueItems.length} unici`);
      }

      // Crea una mappa dei conflitti per accesso rapido
      const conflictMap = new Map();
      if (conflicts && conflicts.length > 0) {
        conflicts.forEach(conflict => {
          conflictMap.set(conflict.item.id, conflict.existingItem);
        });
        console.log('🗺️ Mappa conflitti creata:', conflictMap.size, 'elementi');
      }

      // Contatori per statistiche
      let successCount = 0;
      let skippedCount = 0;
      let overwrittenCount = 0;

      // Converti gli elementi al canale 1 se richiesto
      const itemsToProcess = options.convertChannels
        ? convertItemsToPlayoutChannel(uniqueItems, 1)
        : uniqueItems;

      console.log(`🔄 Elementi da processare: ${itemsToProcess.length}`);
      console.log(`📋 Gestione conflitti: overwriteAll=${options.overwriteAll}, skipConflicts=${options.skipConflicts}`);

      // Invia ogni elemento al rundown con gestione errori
      for (let index = 0; index < itemsToProcess.length; index++) {
        const item = itemsToProcess[index];

        try {
          console.log(`\n📦 Processando elemento ${index + 1}/${itemsToProcess.length}:`, {
            id: item.id,
            type: item.type,
            name: item.data?.customName || item.name
          });

          // CORREZIONE: Verifica periodica che il rundown sia ancora attivo
          if (!rundownContext?.activeRundownId) {
            console.error(`❌ [SYNC DEBUG] Rundown attivo perso durante processamento elemento ${index + 1}`);

            // Tentativo di ripristino
            if (selectedTargetRundown?.id && rundownContext?.setActiveRundownId) {
              console.warn('⚠️ [SYNC DEBUG] Tentativo ripristino rundown durante processamento...');
              await rundownContext.setActiveRundownId(selectedTargetRundown.id);
              await new Promise(resolve => setTimeout(resolve, 200));

              if (!rundownContext.activeRundownId) {
                throw new Error(`Rundown attivo perso durante processamento elemento ${index + 1}. Operazione interrotta.`);
              }
              console.log('✅ [SYNC DEBUG] Rundown ripristinato durante processamento');
            } else {
              throw new Error(`Rundown attivo non disponibile per elemento ${index + 1}. Operazione interrotta.`);
            }
          }

          // Verifica se l'elemento è in conflitto
          const existingItem = conflictMap.get(item.id);
          const hasConflict = !!existingItem;

          console.log(`🔍 Conflitto rilevato: ${hasConflict ? 'SÌ' : 'NO'}`);

          // Gestione conflitti
          if (hasConflict) {
            if (options.skipConflicts && !options.overwriteAll) {
              console.log(`⏭️ SALTATO: Elemento in conflitto saltato per opzione utente`);
              skippedCount++;
              continue; // Salta questo elemento
            } else if (options.overwriteAll) {
              console.log(`🔄 SOVRASCRITTURA: Elemento esistente verrà sovrascritto`);
              // Procedi con la sovrascrittura (gestita sotto)
            }
          }
        if (item.type === 'MEDIA') {
          // Estrai i dati dal campo data JSONB
          const { customName, originalName, timing, casparcgConfig, mediaDetails } = item.data;

          // Assicurati che tutti i campi necessari siano presenti
          const mediaData = {
            clip: mediaDetails.clipPath,
            channel: casparcgConfig.channel || 1,
            layer: casparcgConfig.layer || 10,
            customName: customName || originalName,
            startTime: timing.startTime || '00:00:00',
            duration: timing.duration || '00:00:00',
            inPoint: timing.inPoint || '00:00:00:00',
            outPoint: timing.outPoint || '00:00:00:00',
            location: `CH${casparcgConfig.channel}-L${casparcgConfig.layer}`,
            notes: item.data.notes || '',
            loop: mediaDetails.loop || false,
            autoNext: mediaDetails.autoNext || false
          };

          // Gestione sovrascrittura per elementi MEDIA
          if (hasConflict && options.overwriteAll) {
            console.log("🔄 SOVRASCRITTURA MEDIA: Aggiornamento elemento esistente");
            // Aggiorna l'elemento esistente invece di aggiungerne uno nuovo
            const updatedMediaData = {
              ...mediaData,
              id: existingItem.id // Mantieni l'ID dell'elemento esistente
            };
            rundownContext.updateItem(existingItem.id, updatedMediaData);
            overwrittenCount++;
            console.log("✅ Media sovrascritto con successo:", updatedMediaData);
          } else {
            console.log("➕ AGGIUNTA MEDIA: Nuovo elemento");
            const addResult = await rundownContext.addMedia(mediaData);

            // CORREZIONE: Verifica che l'elemento sia stato aggiunto con successo
            if (!addResult) {
              throw new Error('Elemento media non aggiunto correttamente al rundown');
            }
          }
          successCount++;
        } else if (item.type === 'TEMPLATE') {
          // Estrai i dati dal campo data JSONB
          const { customName, originalName, timing, casparcgConfig, templateDetails } = item.data;

          // Assicurati che tutti i campi necessari siano presenti
          const templateData = {
            template: templateDetails.templateFile,
            channel: casparcgConfig.channel || 1,
            layer: casparcgConfig.layer || 20,
            cgLayer: templateDetails.casparcgConfig.cgLayer || 1,
            playOnLoad: templateDetails.casparcgConfig.playOnLoad !== undefined ? templateDetails.casparcgConfig.playOnLoad : true,
            data: templateDetails.instanceData || {},
            customName: customName || originalName,
            startTime: timing.startTime || '00:00:00',
            duration: timing.duration || '00:00:10',
            location: `CH${casparcgConfig.channel}-L${casparcgConfig.layer}`,
            notes: item.data.notes || '',
            autoRemove: templateDetails.autoRemove || false
          };

          // Gestione sovrascrittura per elementi TEMPLATE
          if (hasConflict && options.overwriteAll) {
            console.log("🔄 SOVRASCRITTURA TEMPLATE: Aggiornamento elemento esistente");
            // Aggiorna l'elemento esistente invece di aggiungerne uno nuovo
            const updatedTemplateData = {
              ...templateData,
              id: existingItem.id // Mantieni l'ID dell'elemento esistente
            };
            rundownContext.updateTemplate(existingItem.id, updatedTemplateData);
            overwrittenCount++;
            console.log("✅ Template sovrascritto con successo:", updatedTemplateData);
          } else {
            console.log("➕ AGGIUNTA TEMPLATE: Nuovo elemento");
            const addResult = await rundownContext.addTemplate(templateData);

            // CORREZIONE: Verifica che l'elemento sia stato aggiunto con successo
            if (!addResult) {
              throw new Error('Elemento template non aggiunto correttamente al rundown');
            }
          }
          successCount++;
        } else if (item.type === 'STORY') {
          console.log('📖 Processando elemento STORY:', item.data?.customName || item.name);

          // CORREZIONE CRITICA: Inviamo l'elemento STORY completo invece di separare i componenti
          // Questo mantiene la struttura originale e evita lo scorporamento

          // Verifica se la storia ha contenuti da inviare
          const { customName, originalName, timing, casparcgConfig, mediaDetails, templateDetails, templatesDetails } = item.data;
          const hasMedia = mediaDetails && mediaDetails.clipPath;
          const hasTemplates = (templatesDetails && templatesDetails.length > 0) || (templateDetails && templateDetails.templateFile);

          if (hasMedia || hasTemplates) {
            // Verifica se il rundown supporta elementi STORY completi
            if (typeof rundownContext.addStory === 'function') {
              // METODO PREFERITO: Invia come elemento STORY completo
              const storyData = {
                type: 'STORY',
                customName: customName || originalName,
                startTime: timing.startTime || '00:00:00',
                duration: timing.duration || '00:00:10',
                channel: casparcgConfig.channel || 1,
                layer: casparcgConfig.layer || 10,
                location: `CH${casparcgConfig.channel || 1}-L${casparcgConfig.layer || 10}`,
                notes: item.data.notes || '',
                content: item.data.content || '',
                // Mantieni tutti i dettagli originali
                mediaDetails: mediaDetails,
                templateDetails: templateDetails,
                templatesDetails: templatesDetails,
                // Dati completi per compatibilità
                data: { ...item.data }
              };

              // Gestione sovrascrittura per elementi STORY
              if (hasConflict && options.overwriteAll) {
                console.log("🔄 SOVRASCRITTURA STORY: Aggiornamento elemento esistente");
                // Aggiorna l'elemento esistente invece di aggiungerne uno nuovo
                const updatedStoryData = {
                  ...storyData,
                  id: existingItem.id // Mantieni l'ID dell'elemento esistente
                };
                rundownContext.updateItem(existingItem.id, updatedStoryData);
                overwrittenCount++;
                console.log("✅ STORY sovrascritta con successo:", updatedStoryData);
              } else {
                console.log("➕ AGGIUNTA STORY: Nuovo elemento");
                const addResult = await rundownContext.addStory(storyData);

                // CORREZIONE: Verifica che l'elemento sia stato aggiunto con successo
                if (!addResult) {
                  throw new Error('Elemento story non aggiunto correttamente al rundown');
                }
              }
              successCount++;
            } else {
              // FALLBACK: Se il rundown non supporta STORY, invia i componenti separatamente
              // ma con logging per indicare che è un fallback
              console.warn('⚠️ FALLBACK: rundown non supporta addStory, invio componenti separatamente');

              // Invia il media se presente
              if (hasMedia) {
                const mediaData = {
                  clip: mediaDetails.clipPath,
                  channel: casparcgConfig.channel || 1,
                  layer: casparcgConfig.layer || 10,
                  customName: `${customName || originalName} (Media)`,
                  startTime: timing.startTime || '00:00:00',
                  duration: timing.duration || '00:00:00',
                  inPoint: timing.inPoint || '00:00:00:00',
                  outPoint: timing.outPoint || '00:00:00:00',
                  location: `CH${casparcgConfig.channel}-L${casparcgConfig.layer}`,
                  notes: `${item.data.notes || ''} [Da STORY: ${customName || originalName}]`,
                  loop: mediaDetails.loop || false,
                  autoNext: mediaDetails.autoNext || false
                };

                console.log('📹 Invio media della storia (fallback):', mediaData);
                rundownContext.addMedia(mediaData);
                successCount++;
              }

              // Invia i template come gruppo unico se possibile
              if (templatesDetails && templatesDetails.length > 0) {
                // Crea un singolo elemento template che rappresenta il gruppo
                const groupTemplateData = {
                  template: 'STORY_TEMPLATE_GROUP', // Identificatore speciale
                  channel: casparcgConfig.channel || 1,
                  layer: casparcgConfig.layer || 20,
                  cgLayer: 1,
                  playOnLoad: true,
                  data: {
                    storyName: customName || originalName,
                    templates: templatesDetails,
                    originalStoryId: item.id
                  },
                  customName: `${customName || originalName} (Templates)`,
                  startTime: timing.startTime || '00:00:00',
                  duration: timing.duration || '00:00:10',
                  location: `CH${casparcgConfig.channel || 1}-L${casparcgConfig.layer || 20}`,
                  notes: `${item.data.notes || ''} [Template Group da STORY: ${customName || originalName}]`,
                  autoRemove: false
                };

                console.log('🎨 Invio gruppo template della storia (fallback):', groupTemplateData);
                rundownContext.addTemplate(groupTemplateData);
                successCount++;
              } else if (templateDetails && templateDetails.templateFile) {
                // Template singolo (vecchio formato)
                const templateData = {
                  template: templateDetails.templateFile,
                  channel: casparcgConfig.channel || 1,
                  layer: casparcgConfig.layer || 20,
                  cgLayer: templateDetails.casparcgConfig?.cgLayer || 1,
                  playOnLoad: templateDetails.casparcgConfig?.playOnLoad !== undefined ? templateDetails.casparcgConfig.playOnLoad : true,
                  data: templateDetails.instanceData || {},
                  customName: `${customName || originalName} (Template)`,
                  startTime: timing.startTime || '00:00:00',
                  duration: timing.duration || '00:00:10',
                  location: `CH${casparcgConfig.channel}-L${casparcgConfig.layer}`,
                  notes: `${item.data.notes || ''} [Da STORY: ${customName || originalName}]`,
                  autoRemove: templateDetails.autoRemove || false
                };

                console.log('🎨 Invio template della storia (fallback):', templateData);
                rundownContext.addTemplate(templateData);
                successCount++;
              }
            }
          } else {
            console.log('⚠️ Storia senza media o template associati, saltata');
          }
        }
        } catch (itemError) {
          console.error(`❌ Errore nel processamento dell'elemento ${item.id}:`, itemError);
          // Continua con il prossimo elemento
        }
      }

      console.log(`\n📊 RIEPILOGO INVIO CON GESTIONE CONFLITTI:`);
      console.log(`   - Elementi ricevuti: ${items.length}`);
      console.log(`   - Elementi unici: ${uniqueItems.length}`);
      console.log(`   - Elementi processati: ${itemsToProcess.length}`);
      console.log(`   - Elementi inviati con successo: ${successCount}`);
      console.log(`   - Elementi saltati (conflitti): ${skippedCount}`);
      console.log(`   - Elementi sovrascritti: ${overwrittenCount}`);
      console.log(`   - Conflitti gestiti: ${skippedCount + overwrittenCount}`);

      // CORREZIONE: Verifica sincronizzazione Supabase con monitor avanzato
      if (rundownContext?.useSupabaseSync && successCount > 0) {
        logger.info('Verifica sincronizzazione Supabase...');

        try {
          // Import della funzione di verifica sincronizzazione
          const { verifySyncAfterSend } = await import('../../utils/rundownSyncMonitor');

          // Verifica sincronizzazione con retry automatico
          const syncResult = await verifySyncAfterSend(rundownContext, successCount, 10000);

          if (syncResult.success) {
            logger.success(`Sincronizzazione verificata: ${syncResult.actualCount}/${syncResult.expectedCount} elementi in ${syncResult.duration}ms`);

            if (syncResult.actualCount < syncResult.expectedCount) {
              logger.warn(`Sincronizzazione parziale: ${syncResult.actualCount}/${syncResult.expectedCount} elementi`);
            }
          } else {
            logger.error('Problema di sincronizzazione rilevato:', {
              actualCount: syncResult.actualCount,
              databaseCount: syncResult.databaseCount,
              expectedCount: syncResult.expectedCount,
              timeout: syncResult.timeout,
              duration: syncResult.duration
            });

            // CORREZIONE: Tentativo di refresh forzato se c'è discrepanza
            if (syncResult.databaseCount > syncResult.actualCount) {
              logger.warn('Database ha più elementi dello stato locale - tentativo refresh forzato...');

              try {
                const { forceRefreshRundownState } = await import('../../utils/rundownSyncMonitor');
                const refreshResult = await forceRefreshRundownState(rundownContext);

                if (refreshResult.success) {
                  logger.success(`Refresh forzato completato - trovati ${refreshResult.itemCount} elementi`);

                  // Verifica nuovamente dopo il refresh
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const finalCount = rundownContext.items?.length || 0;

                  if (finalCount >= successCount) {
                    logger.success(`Sincronizzazione ripristinata dopo refresh: ${finalCount}/${successCount} elementi`);
                  } else {
                    logger.warn(`Refresh parzialmente riuscito: ${finalCount}/${successCount} elementi`);
                  }
                } else {
                  logger.error('Refresh forzato fallito:', refreshResult.error);
                }
              } catch (refreshError) {
                logger.error('Errore durante refresh forzato:', refreshError);
              }
            }

            // Diagnostica finale dello stato del rundown
            const { diagnoseRundownState } = await import('../../utils/rundownSyncMonitor');
            diagnoseRundownState(rundownContext, {
              operation: 'Post-Invio Verifica',
              successCount,
              syncResult
            });
          }
        } catch (syncError) {
          logger.error('Errore verifica sincronizzazione:', syncError);
        }
      }

      logger.groupEnd();

      // Mostra un messaggio di successo
      if (successCount > 0) {
        let message = multiSelection.hasSelection
          ? `${successCount} elementi selezionati inviati al rundown con successo!`
          : `${successCount} elementi inviati al rundown con successo!`;

        // Aggiungi informazioni sui conflitti gestiti
        if (overwrittenCount > 0) {
          message += ` (${overwrittenCount} elementi sovrascritti)`;
        }
        if (skippedCount > 0) {
          message += ` (${skippedCount} elementi saltati per conflitti)`;
        }

        alert(message);

        // Pulisci la selezione dopo l'invio se c'era una selezione
        if (multiSelection.hasSelection) {
          multiSelection.clearSelection();
        }

        // Chiudi il dialogo
        setSendToRundownDialogOpen(false);
      } else {
        dialogs.setErrorMessage("Nessun elemento valido da inviare al rundown.");
      }
    } catch (error) {
      console.error("❌ Errore durante l'invio al rundown:", error);
      console.groupEnd();
      dialogs.setErrorMessage(`Errore durante l'invio al rundown: ${error.message}`);
    } finally {
      setSendToRundownLoading(false);
    }
  };

  // Funzione per inviare la scaletta al calendario settimanale
  const handleSendToCalendar = () => {
    try {
      // Verifica se l'utente può modificare la scaletta
      if (scalettaItems.userRoleForScaletta !== 'owner' && scalettaItems.userRoleForScaletta !== 'editor') {
        dialogs.setErrorMessage("Non hai i permessi per inviare al calendario. Solo i proprietari e gli editor possono farlo.");
        addSystemLog("Tentativo di invio al calendario fallito: permessi insufficienti", 'error');
        return;
      }

      // Verifica se la scaletta ha un nome
      if (!scalettaItems.scalettaName) {
        dialogs.setErrorMessage("La scaletta deve avere un nome prima di essere inviata al calendario");
        addSystemLog("Tentativo di invio al calendario fallito: scaletta senza nome", 'error');
        return;
      }

      // Verifica se ci sono elementi nella scaletta
      if (scalettaItems.scalettaItems.length === 0) {
        dialogs.setErrorMessage("La scaletta è vuota. Aggiungi almeno un elemento prima di inviarla al calendario");
        addSystemLog("Tentativo di invio al calendario fallito: scaletta vuota", 'error');
        return;
      }

      // Apri il dialogo per selezionare il giorno della settimana
      setWeekDaySelectDialogOpen(true);

    } catch (error) {
      console.error("Errore nell'invio al calendario:", error);
      dialogs.setErrorMessage(`Errore nell'invio al calendario: ${error.message}`);
      addSystemLog(`Errore nell'invio al calendario: ${error.message}`, 'error');
    }
  };



  /**
   * Converte tutti gli item della scaletta per l'invio al calendario
   * Questa funzione:
   * 1. Clona profondamente ogni item per evitare modifiche alla configurazione locale
   * 2. Converte tutti i canali CasparCG al canale di playout specificato
   * 3. Mappa i campi timing dalla struttura JSONB al formato flat atteso dal calendario
   *
   * @param {Array} items - Array degli item della scaletta
   * @param {number} targetChannel - Canale CasparCG di destinazione (default: 1 per playout)
   * @returns {Array} - Array degli item modificati per il calendario
   */
  const convertItemsToPlayoutChannel = (items, targetChannel = 1) => {
    if (!Array.isArray(items)) {
      console.warn('convertItemsToPlayoutChannel: items non è un array valido');
      return [];
    }

    return items.map(item => {
      try {
        // CORREZIONE CRITICA: Verifica presenza campo notes prima della conversione
        const originalNotes = item.data?.notes || '';
        console.log(`🔄 Convertendo item "${item.name}" (${item.type}) - Notes originale: "${originalNotes}"`);

        // Clone profondo dell'item per evitare modifiche alla configurazione locale
        const clonedItem = JSON.parse(JSON.stringify(item));

        // Funzione helper per aggiornare ricorsivamente tutti i canali in un oggetto
        const updateChannelsRecursively = (obj, channel) => {
          if (!obj || typeof obj !== 'object') return;

          // Se l'oggetto ha una proprietà channel, aggiornala
          if (obj.hasOwnProperty('channel')) {
            obj.channel = channel;
          }

          // Se l'oggetto ha casparcgConfig con channel, aggiornalo
          if (obj.casparcgConfig && obj.casparcgConfig.hasOwnProperty('channel')) {
            obj.casparcgConfig.channel = channel;
          }

          // Ricorsione per oggetti annidati
          Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
              updateChannelsRecursively(value, channel);
            }
          });
        };

        // Applica l'aggiornamento ricorsivo a tutto l'oggetto data
        if (clonedItem.data) {
          updateChannelsRecursively(clonedItem.data, targetChannel);
        }

        // Mappa i campi timing dalla struttura JSONB al formato flat per il calendario
        if (clonedItem.data && clonedItem.data.timing) {
          const timing = clonedItem.data.timing;

          // Aggiungi i campi timing al livello principale del data per compatibilità con il calendario
          clonedItem.data.startTime = timing.startTime || clonedItem.data.startTime || '00:00:00';
          clonedItem.data.duration = timing.duration || clonedItem.data.duration || '00:01:00';
          clonedItem.data.inPoint = timing.inPoint || clonedItem.data.inPoint || '00:00:00:00';
          clonedItem.data.outPoint = timing.outPoint || clonedItem.data.outPoint || '00:00:00:00';
        }

        // Assicurati che i campi essenziali per il calendario siano sempre presenti
        if (clonedItem.data) {
          clonedItem.data.startTime = clonedItem.data.startTime || '00:00:00';
          clonedItem.data.duration = clonedItem.data.duration || '00:01:00';
          clonedItem.data.customName = clonedItem.data.customName || clonedItem.name || 'Elemento senza nome';

          // CORREZIONE CRITICA: Assicurati che il campo notes sia preservato esplicitamente
          clonedItem.data.notes = originalNotes;
          console.log(`  ✅ Campo notes preservato: "${clonedItem.data.notes}"`);

          // Per elementi MEDIA, assicurati che clip sia presente
          if (clonedItem.type === 'MEDIA' && clonedItem.data.mediaDetails?.clipPath) {
            clonedItem.data.clip = clonedItem.data.mediaDetails.clipPath;
          }

          // Per elementi TEMPLATE, assicurati che template sia presente
          if (clonedItem.type === 'TEMPLATE' && clonedItem.data.templateDetails?.templateFile) {
            clonedItem.data.template = clonedItem.data.templateDetails.templateFile;
          }
        }

        return clonedItem;
      } catch (error) {
        console.error(`Errore nella conversione dell'item ${item.id || 'sconosciuto'}:`, error);
        // Ritorna l'item originale in caso di errore
        return item;
      }
    });
  };

  /**
   * Funzione di test per verificare la conversione dei canali e dei campi timing
   * Utile per debugging e verifica della funzionalità
   *
   * @param {Array} originalItems - Item originali
   * @param {Array} convertedItems - Item convertiti
   * @param {number} expectedChannel - Canale atteso dopo la conversione
   */
  const testChannelConversion = (originalItems, convertedItems, expectedChannel = 1) => {
    console.group('🔍 Test Conversione per Calendario');

    let totalChannelsFound = 0;
    let totalChannelsConverted = 0;
    let totalTimingFieldsMapped = 0;
    let totalTimingFieldsExpected = 0;

    convertedItems.forEach((item, index) => {
      const originalItem = originalItems[index];
      console.log(`\n📋 Item ${index + 1}: ${item.name} (${item.type})`);

      // Verifica conversione canali
      const checkChannels = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;

        if (obj.hasOwnProperty('channel')) {
          totalChannelsFound++;
          const isConverted = obj.channel === expectedChannel;
          if (isConverted) totalChannelsConverted++;

          console.log(`  ${isConverted ? '✅' : '❌'} ${path}channel: ${obj.channel} ${isConverted ? '(convertito)' : '(NON convertito)'}`);
        }

        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            checkChannels(value, `${path}${key}.`);
          }
        });
      };

      // Verifica mapping campi timing
      const checkTimingMapping = () => {
        const timingFields = ['startTime', 'duration', 'inPoint', 'outPoint'];

        timingFields.forEach(field => {
          // Se l'item originale ha il campo nella struttura timing
          if (originalItem.data?.timing?.[field]) {
            totalTimingFieldsExpected++;

            // Verifica che sia stato mappato al livello principale
            if (item.data?.[field]) {
              totalTimingFieldsMapped++;
              console.log(`  ✅ timing.${field} → data.${field}: ${item.data[field]} (mappato)`);
            } else {
              console.log(`  ❌ timing.${field} NON mappato a data.${field}`);
            }
          }
        });
      };

      if (item.data) {
        checkChannels(item.data);
        checkTimingMapping();

        // Verifica campi essenziali per il calendario (incluso notes)
        const essentialFields = ['startTime', 'duration', 'customName', 'notes'];
        essentialFields.forEach(field => {
          if (item.data[field] !== undefined) {
            console.log(`  ✅ Campo essenziale ${field}: "${item.data[field]}"`);
          } else {
            console.log(`  ⚠️ Campo essenziale ${field} mancante`);
          }
        });

        // Verifica campi specifici per tipo
        if (item.type === 'MEDIA' && item.data.clip) {
          console.log(`  ✅ Campo clip per MEDIA: ${item.data.clip}`);
        }
        if (item.type === 'TEMPLATE' && item.data.template) {
          console.log(`  ✅ Campo template per TEMPLATE: ${item.data.template}`);
        }
      }
    });

    console.log(`\n📊 Riepilogo conversione:`);
    console.log(`   - Canali trovati: ${totalChannelsFound}`);
    console.log(`   - Canali convertiti: ${totalChannelsConverted}`);
    console.log(`   - Campi timing mappati: ${totalTimingFieldsMapped}/${totalTimingFieldsExpected}`);
    console.log(`   - Successo canali: ${totalChannelsFound === totalChannelsConverted ? '✅' : '❌'}`);
    console.log(`   - Successo timing: ${totalTimingFieldsExpected === 0 || totalTimingFieldsMapped === totalTimingFieldsExpected ? '✅' : '❌'}`);

    console.groupEnd();

    return {
      totalChannelsFound,
      totalChannelsConverted,
      totalTimingFieldsMapped,
      totalTimingFieldsExpected,
      channelsSuccess: totalChannelsFound === totalChannelsConverted,
      timingSuccess: totalTimingFieldsExpected === 0 || totalTimingFieldsMapped === totalTimingFieldsExpected,
      success: (totalChannelsFound === totalChannelsConverted) &&
               (totalTimingFieldsExpected === 0 || totalTimingFieldsMapped === totalTimingFieldsExpected)
    };
  };

  // Funzione per gestire la conferma dell'invio al calendario
  const handleConfirmSendToCalendar = (selectedDay, startTime) => {
    try {
      console.log("Calendar context:", calendar);

      // Verifica se il context del calendario è disponibile
      if (!calendar || typeof calendar.addRundownToDay !== 'function') {
        throw new Error("Il context del calendario non è disponibile o non contiene la funzione addRundownToDay");
      }

      // Crea un ID univoco per il rundown
      const rundownId = uuidv4();

      // Converti tutti gli item al canale di playout (1) prima dell'invio al calendario
      // Questo assicura che tutti gli elementi utilizzino il canale di messa in onda
      // senza modificare la configurazione locale dell'editor (che continua a usare il canale 3 per preview)
      const playoutItems = convertItemsToPlayoutChannel(scalettaItems.scalettaItems, 1);

      // Esegui il test di conversione per verificare canali e mapping timing
      const conversionTest = testChannelConversion(scalettaItems.scalettaItems, playoutItems, 1);

      if (conversionTest.success) {
        addSystemLog(`✅ Conversione completata: ${conversionTest.totalChannelsConverted}/${conversionTest.totalChannelsFound} canali → canale 1, ${conversionTest.totalTimingFieldsMapped}/${conversionTest.totalTimingFieldsExpected} campi timing mappati`, 'success');
      } else {
        let message = '⚠️ Conversione parziale: ';
        if (!conversionTest.channelsSuccess) {
          message += `${conversionTest.totalChannelsConverted}/${conversionTest.totalChannelsFound} canali convertiti`;
        }
        if (!conversionTest.timingSuccess) {
          if (!conversionTest.channelsSuccess) message += ', ';
          message += `${conversionTest.totalTimingFieldsMapped}/${conversionTest.totalTimingFieldsExpected} campi timing mappati`;
        }
        addSystemLog(message, 'warning');
      }

      // Prepara i dati del rundown con gli item convertiti per il playout
      const rundownData = {
        id: rundownId,
        name: scalettaItems.scalettaName,
        type: 'RUNDOWN',
        startTime: startTime,
        duration: calculateTotalDuration(),
        items: playoutItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          data: { ...item.data }
        }))
      };

      console.log("Invio al calendario:", { selectedDay, rundownData });

      // Aggiungi il rundown al giorno selezionato
      calendar.addRundownToDay(selectedDay, rundownData);

      // Chiudi il dialogo
      setWeekDaySelectDialogOpen(false);

      // Mostra un messaggio di successo
      alert(`La scaletta "${scalettaItems.scalettaName}" è stata inviata al calendario settimanale per il giorno ${selectedDay} con successo!`);
      addSystemLog(`Scaletta "${scalettaItems.scalettaName}" inviata al calendario settimanale per il giorno ${selectedDay}`, 'success');

    } catch (error) {
      console.error("Errore nell'invio al calendario:", error);
      dialogs.setErrorMessage(`Errore nell'invio al calendario: ${error.message}`);
      addSystemLog(`Errore nell'invio al calendario: ${error.message}`, 'error');
      setWeekDaySelectDialogOpen(false);
    }
  };

  // Funzione per riprodurre un media dalla scaletta
  const handlePlayItem = (item) => {
    try {
      if (!item || !item.data) {
        console.error("Impossibile riprodurre il media: item o item.data non definito");
        return;
      }

      // Estrai i dati dal campo data JSONB
      // Struttura attesa: item.data.mediaDetails.clipPath
      const mediaDetails = item.data.mediaDetails;
      const timing = item.data.timing || {};

      // Verifica che mediaDetails sia definito
      if (!mediaDetails) {
        console.error("Impossibile riprodurre il media: mediaDetails non definito");
        dialogs.setErrorMessage("Errore: dettagli del media non definiti");
        return;
      }

      // Usa sempre il canale di preview (3)
      const clip = mediaDetails.clipPath;

      // Verifica che clip sia definito
      if (!clip || typeof clip !== 'string' || clip.trim() === '') {
        console.error("Impossibile riprodurre il media: clipPath non definito o non valido");
        dialogs.setErrorMessage("Errore: percorso del file media non definito o non valido");
        return;
      }

      // Ottieni il punto IN dal campo timing
      const inPoint = timing.inPoint;

      console.log(`Riproducendo media: ${clip} con inPoint: ${inPoint}`);

      if (inPoint && inPoint !== '00:00:00:00') {
        const frames = timecodeToFrames(inPoint);
        if (frames > 0) {
          sendCommand(casparCommands.generatePlayCommand(previewChannel, 1, clip, frames))
            .catch(error => {
              console.error(`Errore durante la riproduzione con SEEK: ${error.message || JSON.stringify(error)}`);
              dialogs.setErrorMessage(`Errore riproduzione media: ${error.message}`);
            });
        } else {
          sendCommand(casparCommands.generatePlayCommand(previewChannel, 1, clip))
            .catch(error => {
              console.error(`Errore durante la riproduzione: ${error.message || JSON.stringify(error)}`);
              dialogs.setErrorMessage(`Errore riproduzione media: ${error.message}`);
            });
        }
      } else {
        sendCommand(casparCommands.generatePlayCommand(previewChannel, 1, clip))
          .catch(error => {
            console.error(`Errore durante la riproduzione: ${error.message || JSON.stringify(error)}`);
            dialogs.setErrorMessage(`Errore riproduzione media: ${error.message}`);
          });
      }

      // Aggiorna la preview
      previewPlayer.setPreviewMedia(clip);
      previewPlayer.handlePlaybackControl('play');

      // CORREZIONE CRITICA: Usa status PREVIEW per ambiente scalette
      playbackSync.updatePlaybackStatus(item.id, {
        status: 'PREVIEW', // CORREZIONE: Cambiato da 'PLAYING' a 'PREVIEW'
        channel: previewChannel,
        layer: 1,
        startTime: Date.now(),
        source: 'scalette'
      });

    } catch (e) {
      console.error(`Errore riproduzione media:`, e);
      dialogs.setErrorMessage(`Errore riproduzione media: ${e.message}`);
    }
  };

  // Funzione per mettere in pausa un media dalla scaletta
  const handlePauseItem = () => {
    try {
      // Usa sempre il canale di preview (3)
      sendCommand(casparCommands.generatePauseCommand(previewChannel, 1))
        .catch(error => {
          console.error(`Errore durante la pausa: ${error.message || JSON.stringify(error)}`);
          dialogs.setErrorMessage(`Errore pausa media: ${error.message}`);
        });
      previewPlayer.handlePlaybackControl('pause');
    } catch (e) {
      console.error(`Errore pausa media:`, e);
      dialogs.setErrorMessage(`Errore pausa media: ${e.message}`);
    }
  };

  // Funzione per fermare un media dalla scaletta
  const handleStopItem = (item = null) => {
    try {
      // Usa sempre il canale di preview (3)
      sendCommand(casparCommands.generateStopCommand(previewChannel, 1))
        .catch(error => {
          console.error(`Errore durante lo stop: ${error.message || JSON.stringify(error)}`);
          dialogs.setErrorMessage(`Errore stop media: ${error.message}`);
        });
      previewPlayer.handlePlaybackControl('stop');

      // RICHIESTA 1: Sincronizza stato di arresto se abbiamo un item
      if (item && item.id) {
        playbackSync.updatePlaybackStatus(item.id, {
          status: 'STOPPED',
          channel: previewChannel,
          layer: 1,
          startTime: null,
          source: 'scalette'
        });
      }

    } catch (e) {
      console.error(`Errore stop media:`, e);
      dialogs.setErrorMessage(`Errore stop media: ${e.message}`);
    }
  };



  // Funzione per riprodurre l'elemento selezionato
  const handlePlaySelected = () => {
    if (scalettaItems.selectedItemIndex >= 0 && scalettaItems.selectedItemIndex < scalettaItems.scalettaItems.length) {
      const item = scalettaItems.scalettaItems[scalettaItems.selectedItemIndex];
      if (item.type === 'MEDIA') {
        handlePlayItem(item);
      } else if (item.type === 'TEMPLATE') {
        handlePlayTemplate(item);
      } else if (item.type === 'STORY') {
        handlePlayStory(item);
      }
    }
  };

  // Funzione per riprodurre un item di tipo STORY
  const handlePlayStory = (item) => {
    try {
      if (!item || !item.data) {
        console.error("Impossibile riprodurre la storia: item o item.data non definito");
        return;
      }

      let hasPlayedSomething = false;

      // Verifica se la storia ha un media associato
      if (item.data.mediaDetails && item.data.mediaDetails.clipPath) {
        // Crea un oggetto media con i dati della storia
        const mediaItem = {
          ...item,
          type: 'MEDIA',
          data: {
            ...item.data,
            clip: item.data.mediaDetails.clipPath,
            channel: item.data.mediaDetails.channel || item.data.casparcgConfig?.channel || 1,
            layer: item.data.mediaDetails.layer || item.data.casparcgConfig?.layer || 10
          }
        };

        // Riproduci il media
        handlePlayItem(mediaItem);
        addSystemLog(`Riproduzione media dalla storia: ${item.name}`, 'info');
        hasPlayedSomething = true;
      }

      // Verifica se la storia ha template multipli (nuovo formato)
      if (item.data.templatesDetails && item.data.templatesDetails.length > 0) {
        // Riproduci tutti i template associati in modo asincrono
        const playTemplatesAsync = async () => {
          for (let index = 0; index < item.data.templatesDetails.length; index++) {
            const templateDetail = item.data.templatesDetails[index];

            if (templateDetail.templateFile) {
              // Usa il layer configurato dall'utente se presente, altrimenti calcola un layer unico per evitare conflitti
              const configuredLayer = templateDetail.casparcgConfig?.layer;
              const baseLayer = configuredLayer || 20;
              const uniqueLayer = configuredLayer || (baseLayer + index); // Usa il layer configurato o calcola uno unico

              // Crea un oggetto template con i dati del template corrente
              const templateItem = {
                ...item,
                type: 'TEMPLATE',
                data: {
                  ...item.data,
                  template: templateDetail.templateFile,
                  templateDetails: {
                    ...templateDetail,
                    casparcgConfig: {
                      ...templateDetail.casparcgConfig,
                      channel: templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                      layer: uniqueLayer,
                      cgLayer: templateDetail.casparcgConfig?.cgLayer || 1,
                      playOnLoad: templateDetail.casparcgConfig?.playOnLoad !== undefined ? templateDetail.casparcgConfig.playOnLoad : true
                    }
                  }
                }
              };

              // Gestisci la temporizzazione del template
              const startDelay = templateDetail.timing?.startDelay || 0;
              const autoStart = templateDetail.timing?.autoStart !== false;

              if (autoStart) {
                if (startDelay > 0) {
                  // Riproduci il template dopo il ritardo specificato
                  addSystemLog(`Template ${index + 1} programmato tra ${startDelay} secondi: ${item.name}`, 'info');
                  setTimeout(async () => {
                    try {
                      await handlePlayTemplate(templateItem);
                      addSystemLog(`Riproduzione template ${index + 1} dalla storia: ${item.name}`, 'info');
                    } catch (error) {
                      console.error(`Errore riproduzione template ${index + 1}:`, error);
                      addSystemLog(`Errore riproduzione template ${index + 1}: ${error.message}`, 'error');
                    }
                  }, startDelay * 1000);
                } else {
                  // Riproduci il template immediatamente con un piccolo delay per evitare conflitti
                  try {
                    await new Promise(resolve => setTimeout(resolve, index * 100)); // 100ms di delay tra template
                    await handlePlayTemplate(templateItem);
                    addSystemLog(`Riproduzione template ${index + 1} dalla storia: ${item.name}`, 'info');
                  } catch (error) {
                    console.error(`Errore riproduzione template ${index + 1}:`, error);
                    addSystemLog(`Errore riproduzione template ${index + 1}: ${error.message}`, 'error');
                  }
                }
                hasPlayedSomething = true;
              } else {
                addSystemLog(`Template ${index + 1} non avviato automaticamente: ${item.name}`, 'info');
              }
            }
          }
        };

        // Esegui la riproduzione asincrona dei template
        playTemplatesAsync().catch(error => {
          console.error('Errore nella riproduzione dei template multipli:', error);
          addSystemLog(`Errore nella riproduzione dei template multipli: ${error.message}`, 'error');
        });
      }
      // Verifica se la storia ha un template associato (vecchio formato)
      else if (item.data.templateDetails && item.data.templateDetails.templateFile) {
        // Crea un oggetto template con i dati della storia
        const templateItem = {
          ...item,
          type: 'TEMPLATE',
          data: {
            ...item.data,
            template: item.data.templateDetails.templateFile
          }
        };

        // Riproduci il template
        handlePlayTemplate(templateItem);
        addSystemLog(`Riproduzione template dalla storia: ${item.name}`, 'info');
        hasPlayedSomething = true;
      }

      // Se non ha né media né template, mostra un messaggio di errore
      if (!hasPlayedSomething) {
        console.log("Storia senza media o template associati");
        dialogs.setErrorMessage("La storia non ha media o template associati da riprodurre");
      }
    } catch (e) {
      console.error(`Errore riproduzione storia:`, e);
      dialogs.setErrorMessage(`Errore riproduzione storia: ${e.message}`);
    }
  };

  // Funzione per fermare un item di tipo STORY
  const handleStopStory = (item) => {
    try {
      if (!item || !item.data) {
        console.error("Impossibile fermare la storia: item o item.data non definito");
        return;
      }

      let hasStoppedSomething = false;

      // Verifica se la storia ha un media associato
      if (item.data.mediaDetails && item.data.mediaDetails.clipPath) {
        // Crea un oggetto media con i dati della storia
        const mediaItem = {
          ...item,
          type: 'MEDIA',
          data: {
            ...item.data,
            clip: item.data.mediaDetails.clipPath,
            channel: item.data.mediaDetails.channel || item.data.casparcgConfig?.channel || 1,
            layer: item.data.mediaDetails.layer || item.data.casparcgConfig?.layer || 10
          }
        };

        // Ferma il media
        handleStopItem(mediaItem);
        addSystemLog(`Media fermato dalla storia: ${item.name}`, 'info');
        hasStoppedSomething = true;
      }

      // Verifica se la storia ha template multipli (nuovo formato)
      if (item.data.templatesDetails && item.data.templatesDetails.length > 0) {
        // Ferma tutti i template associati
        item.data.templatesDetails.forEach((templateDetail, index) => {
          if (templateDetail.templateFile) {
            // Usa il layer configurato dall'utente se presente, altrimenti usa il layer di default
            const configuredLayer = templateDetail.casparcgConfig?.layer;
            const defaultLayer = 20;
            const layerToUse = configuredLayer || defaultLayer;

            // Crea un oggetto template con i dati del template corrente
            const templateItem = {
              ...item,
              type: 'TEMPLATE',
              data: {
                ...item.data,
                template: templateDetail.templateFile,
                templateDetails: {
                  ...templateDetail,
                  casparcgConfig: {
                    ...templateDetail.casparcgConfig,
                    channel: templateDetail.casparcgConfig?.channel || item.data.casparcgConfig?.channel || 1,
                    layer: layerToUse,
                    cgLayer: templateDetail.casparcgConfig?.cgLayer || 1,
                    playOnLoad: templateDetail.casparcgConfig?.playOnLoad !== undefined ? templateDetail.casparcgConfig.playOnLoad : true
                  }
                }
              }
            };

            // Ferma il template
            handleStopTemplate(templateItem);
            addSystemLog(`Template ${index + 1} fermato dalla storia: ${item.name}`, 'info');
            hasStoppedSomething = true;
          }
        });
      }
      // Verifica se la storia ha un template associato (vecchio formato)
      else if (item.data.templateDetails && item.data.templateDetails.templateFile) {
        // Crea un oggetto template con i dati della storia
        const templateItem = {
          ...item,
          type: 'TEMPLATE',
          data: {
            ...item.data,
            template: item.data.templateDetails.templateFile
          }
        };

        // Ferma il template
        handleStopTemplate(templateItem);
        addSystemLog(`Template fermato dalla storia: ${item.name}`, 'info');
        hasStoppedSomething = true;
      }

      // Se non ha né media né template, mostra un messaggio di errore
      if (!hasStoppedSomething) {
        console.log("Storia senza media o template associati");
        dialogs.setErrorMessage("La storia non ha media o template associati da fermare");
      }
    } catch (e) {
      console.error(`Errore arresto storia:`, e);
      dialogs.setErrorMessage(`Errore arresto storia: ${e.message}`);
    }
  };

  // Funzione per gestire il browse del media nel dialogo di modifica
  const handleBrowseMedia = (item, forStory = false) => {
    // Salva temporaneamente l'item in modifica
    if (!forStory) {
      dialogs.setEditingItem(item);
      // Chiudi il dialogo di modifica
      dialogs.closeEditDialog();
    }
    // Apri il selettore media
    dialogs.openMediaDialog(forStory);
  };

  // Funzione per gestire il browse del template nel dialogo di modifica
  const handleBrowseTemplate = (item, forStory = false, templateIndex = null) => {
    // Salva temporaneamente l'item in modifica
    if (!forStory) {
      dialogs.setEditingItem(item);
      // Chiudi il dialogo di modifica
      dialogs.closeEditDialog();
    }
    // Apri il selettore template
    dialogs.openTemplateDialog(forStory, templateIndex);
  };

  // Funzione per aprire il pannello di modifica
  const handleOpenEditPanel = (item) => {
    dialogs.setEditingItem(item);
    setIsEditPanelOpen(true);
  };

  // Funzione per chiudere il pannello di modifica
  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
  };

  // Funzione per gestire il cambio di visibilità delle colonne
  const handleColumnVisibilityChange = (newVisibleColumns) => {
    setVisibleColumns(newVisibleColumns);
    // Salva le preferenze dell'utente in localStorage
    localStorage.setItem('scalettaTableColumns', JSON.stringify(newVisibleColumns));
  };

  // Funzione per gestire la ricerca
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Funzioni per gestire il menu delle impostazioni
  const handleOpenSettings = (event) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setSettingsMenuAnchor(null);
  };

  // Funzione per salvare la scaletta
  const handleSaveScaletta = async () => {
    try {
      const result = await scalettaItems.saveScaletta();

      if (result.success) {
        addSystemLog(result.message, 'success');
      } else {
        dialogs.setErrorMessage(result.error);
        addSystemLog(result.error, 'error');
      }
    } catch (error) {
      console.error('Errore nel salvataggio della scaletta:', error);
      dialogs.setErrorMessage(`Errore nel salvataggio della scaletta: ${error.message}`);
      addSystemLog(`Errore nel salvataggio della scaletta: ${error.message}`, 'error');
    } finally {
      handleCloseSettings();
    }
  };

  // Funzione per eliminare la scaletta
  const handleDeleteScaletta = async () => {
    try {
      // Chiedi conferma all'utente
      if (!window.confirm('Sei sicuro di voler eliminare questa scaletta? Questa azione non può essere annullata.')) {
        return;
      }

      const result = await scalettaItems.deleteScaletta();

      if (result.success) {
        addSystemLog(result.message, 'success');

        // Reindirizza alla lista delle scalette
        if (result.redirectTo) {
          window.location.href = result.redirectTo;
        }
      } else {
        dialogs.setErrorMessage(result.error);
        addSystemLog(result.error, 'error');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione della scaletta:', error);
      dialogs.setErrorMessage(`Errore nell'eliminazione della scaletta: ${error.message}`);
      addSystemLog(`Errore nell'eliminazione della scaletta: ${error.message}`, 'error');
    } finally {
      handleCloseSettings();
    }
  };

  // Funzione per esportare la scaletta
  const handleExportScaletta = () => {
    try {
      const result = scalettaItems.exportScaletta();

      if (result.success) {
        // Crea un file JSON da scaricare
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `scaletta_${scalettaItems.scalettaName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        addSystemLog('Scaletta esportata con successo', 'success');
      } else {
        dialogs.setErrorMessage(result.error);
        addSystemLog(result.error, 'error');
      }
    } catch (error) {
      console.error('Errore nell\'esportazione della scaletta:', error);
      dialogs.setErrorMessage(`Errore nell'esportazione della scaletta: ${error.message}`);
      addSystemLog(`Errore nell'esportazione della scaletta: ${error.message}`, 'error');
    } finally {
      handleCloseSettings();
    }
  };

  // Funzione per ripristinare la scaletta
  const handleRestoreScaletta = async () => {
    try {
      // Chiedi conferma all'utente
      if (!window.confirm('Sei sicuro di voler ripristinare questa scaletta? Le modifiche non salvate andranno perse.')) {
        return;
      }

      const result = await scalettaItems.restoreScaletta();

      if (result.success) {
        addSystemLog(result.message, 'success');
      } else {
        dialogs.setErrorMessage(result.error);
        addSystemLog(result.error, 'error');
      }
    } catch (error) {
      console.error('Errore nel ripristino della scaletta:', error);
      dialogs.setErrorMessage(`Errore nel ripristino della scaletta: ${error.message}`);
      addSystemLog(`Errore nel ripristino della scaletta: ${error.message}`, 'error');
    } finally {
      handleCloseSettings();
    }
  };

  // Funzione per condividere la scaletta
  const handleShareScaletta = () => {
    // Apri il dialog dei collaboratori
    setCollaboratorsDialogOpen(true);
    handleCloseSettings();
  };

  // Funzione per aggiungere una nuova storia
  const handleAddStory = () => {
    // Apri il dialogo per la creazione di una nuova storia
    setStoryDialogOpen(true);
  };

  // Funzione per creare una nuova storia con i dati forniti
  const handleCreateStory = async (storyData) => {
    try {
      // Crea una nuova storia con i dati forniti
      await scalettaItems.addEmptyStory(storyData);
      addSystemLog(`Storia "${storyData.name}" creata con successo`, 'success');
    } catch (error) {
      console.error("Errore nell'aggiunta della storia:", error);
      dialogs.setErrorMessage("Errore nell'aggiunta della storia: " + error.message);
    }
  };

  // Funzione per gestire la conferma di un media per una storia (senza aggiungerlo alla scaletta)
  const handleConfirmMediaForStory = () => {
    // Non facciamo nulla qui, il media è già stato selezionato tramite onSelectMedia
    // e sarà utilizzato quando la storia verrà creata
    console.log("Media confermato per la storia:", previewPlayer.previewMedia);
  };

  // Funzione per gestire la conferma di un template per una storia (senza aggiungerlo alla scaletta)
  const handleConfirmTemplateForStory = (templateIndex = null) => {
    console.log("Template confermato per la storia:", previewPlayer.previewTemplate, "Indice:", templateIndex);

    // Se stiamo modificando un template esistente in una storia
    if (templateIndex !== null && dialogs.editingItem && dialogs.editingItem.type === 'STORY') {
      console.log("Aggiornamento template esistente nella storia all'indice:", templateIndex);

      // Ottieni il template selezionato
      const selectedTemplate = previewPlayer.previewTemplate;
      if (!selectedTemplate) {
        console.error("Nessun template selezionato");
        return;
      }

      // Crea una copia profonda dell'item in modifica
      const updatedItem = JSON.parse(JSON.stringify(dialogs.editingItem));

      // Assicurati che templatesDetails sia un array
      if (!updatedItem.data.templatesDetails) {
        updatedItem.data.templatesDetails = [];
      }

      // Ottieni il path del template
      const templatePath = typeof selectedTemplate === 'string'
        ? selectedTemplate
        : selectedTemplate.path;

      // Se l'indice è valido e esiste già un template a quell'indice, aggiornalo
      if (templateIndex >= 0 && templateIndex < updatedItem.data.templatesDetails.length) {
        // Aggiorna solo il path del template, mantenendo le altre configurazioni
        updatedItem.data.templatesDetails[templateIndex] = {
          ...updatedItem.data.templatesDetails[templateIndex],
          templateFile: templatePath
        };
      } else {
        // Se l'indice non è valido, aggiungi un nuovo template
        updatedItem.data.templatesDetails.push({
          templateFile: templatePath,
          casparcgConfig: {
            channel: updatedItem.data.casparcgConfig?.channel || 1,
            layer: 20,
            cgLayer: 1,
            playOnLoad: true
          },
          autoRemove: false,
          instanceData: {},
          timing: {
            startDelay: 0,
            autoStart: true
          }
        });
      }

      // Assicurati che templateDetails sia null per evitare confusione
      updatedItem.data.templateDetails = null;

      // Aggiorna l'item nel dialogo
      dialogs.setEditingItem(updatedItem);
    }
  };

  // Calcola la durata totale della scaletta
  const calculateTotalDuration = () => {
    if (!scalettaItems.scalettaItems || scalettaItems.scalettaItems.length === 0) {
      return '00:00:00';
    }

    // Implementazione semplificata - in un'applicazione reale si dovrebbe
    // calcolare correttamente la durata totale considerando i timecode
    const totalSeconds = scalettaItems.scalettaItems.reduce((total, item) => {
      // Estrai la durata in formato HH:MM:SS
      // Verifica che item.data e item.data.timing esistano
      const duration = item.data?.timing?.duration || '00:00:00';
      // Converti in secondi per il calcolo
      const [hours, minutes, seconds] = duration.split(':').map(Number);
      const durationInSeconds = hours * 3600 + minutes * 60 + seconds;
      return total + durationInSeconds;
    }, 0);

    // Converti i secondi totali in formato HH:MM:SS
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Definizione delle colonne disponibili per la tabella
  const availableColumns = [
    { id: 'index', label: '#' },
    { id: 'startTime', label: 'Start' },
    { id: 'duration', label: 'Durata' },
    { id: 'location', label: 'Posizione' },
    { id: 'name', label: 'Nome' },
    { id: 'file', label: 'File' },
    { id: 'notes', label: 'Note' },
    { id: 'inPoint', label: 'In' },
    { id: 'outPoint', label: 'Out' },
    { id: 'actions', label: 'Azioni' }
  ];

  return (
    <Box sx={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Barra delle informazioni globali */}
      <ScalettaGlobalInfoBar
        scalettaName={scalettaItems.scalettaName}
        onScalettaNameChange={scalettaItems.setScalettaName}
        totalDuration={calculateTotalDuration()}
        userRole={scalettaItems.userRoleForScaletta}
        onOpenCollaborators={() => setCollaboratorsDialogOpen(true)}
        onOpenSettings={handleOpenSettings}
        onSave={handleSaveScaletta}
        modified={scalettaItems.modified}
      />



      {/* Area superiore (Preview e controlli) */}
      <Box sx={{
        height: `${topAreaHeight}px`,
        minHeight: '100px',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Area di preview e controlli - Layout Newsroom Pro v3 */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100%',
          p: 1,
          gap: 1
        }}>
          {/* Grid per i quattro moduli dell'area superiore */}
          <Grid container spacing={1} sx={{ height: '100%' }}>
            {/* Modulo A.1.1: Preview */}
            <Grid item xs={12} md={3} sx={{ height: '100%' }}>
              <Paper
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <PreviewSection
                    previewState={{
                      ...previewPlayer,
                      handleTemplateControl: previewPlayer.handleTemplateControl
                    }}
                    onPlaybackControl={previewPlayer.handlePlaybackControl}
                    onToggleExpand={() => previewPlayer.setPreviewExpanded(!previewPlayer.previewExpanded)}
                    controls={{
                      pin: true,
                      popOut: true,
                      collapse: false
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Modulo A.1.2: Item Control */}
            <Grid item xs={12} md={3} sx={{ height: '100%' }}>
              <Paper
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <ItemContextControls
                    selectedItem={scalettaItems.selectedItemIndex !== -1 ? scalettaItems.scalettaItems[scalettaItems.selectedItemIndex] : null}
                    playbackStatus={previewPlayer.playbackStatus}
                    previewChannel={previewPlayer.previewChannel}
                    previewLayer={previewPlayer.previewLayer}
                    onUpdateItem={(itemId, updates) => {
                      console.log('[ScaletteEditor] Richiesta aggiornamento item:', { itemId, updates });

                      // Trova l'item corrente e aggiorna i suoi dati
                      const currentItem = scalettaItems.scalettaItems.find(item => item.id === itemId);
                      if (currentItem) {
                        console.log('[ScaletteEditor] Item trovato, dati attuali:', currentItem);

                        const updatedItem = {
                          ...currentItem,
                          data: updates
                        };

                        console.log('[ScaletteEditor] Item aggiornato:', updatedItem);
                        scalettaItems.updateItem(updatedItem);
                        console.log('[ScaletteEditor] updateItem chiamato, scaletta aggiornata');
                      } else {
                        console.warn('[ScaletteEditor] Item non trovato nella scaletta:', itemId);
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Modulo A.1.3 e A.1.4: Controlli Estesi (2 colonne) */}
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <ExtendedControls
                selectedItem={scalettaItems.selectedItemIndex !== -1 ? scalettaItems.scalettaItems[scalettaItems.selectedItemIndex] : null}
                nextItems={
                  scalettaItems.selectedItemIndex !== -1 && scalettaItems.selectedItemIndex < scalettaItems.scalettaItems.length - 1
                    ? scalettaItems.scalettaItems.slice(scalettaItems.selectedItemIndex + 1, scalettaItems.selectedItemIndex + 5)
                    : []
                }
                onPlaybackControl={previewPlayer.handlePlaybackControl}
                onTemplateControl={(action, selectedItem, options) => previewPlayer.handleTemplateControl(action, selectedItem, options)}
                disabled={!connected}
                remainingTime={previewPlayer.remainingTime}
                systemLogs={systemLogs}
                oscData={previewPlayer.previewOscData || {}}
                onSelectItem={(item) => {
                  scalettaItems.selectItemById(item.id);
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Maniglia per il ridimensionamento */}
        <Box
          ref={resizeHandleRef}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            cursor: 'row-resize',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.3)',
            },
            zIndex: 10
          }}
        />
      </Box>

      {/* Area inferiore (Tabella e pannello di modifica) */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Tabella degli elementi */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Toolbar della tabella */}
          <ScalettaTableToolbar
            onAddMedia={dialogs.openMediaDialog}
            onAddTemplate={dialogs.openTemplateDialog}
            onAddStory={handleAddStory}
            onSearch={handleSearch}
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            userRole={scalettaItems.userRoleForScaletta}
            onSendToRundown={handleSendToRundown}
            onSendToCalendar={handleSendToCalendar}
            isPlayoutOperator={isPlayoutOperator}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            tableViewMode={tableViewMode}
            onTableViewModeChange={handleTableViewModeChange}
            itemCount={scalettaItems.scalettaItems?.length || 0}
            selectAllState={multiSelection.selectAllState}
            onSelectAllChange={multiSelection.toggleSelectAll}
            selectionStats={multiSelection.getSelectionStats()}
            hasSelection={multiSelection.hasSelection}
          />

          {/* Messaggio di errore */}
          {dialogs.error && (
            <Alert
              severity="error"
              sx={{ mx: 1, mb: 1 }}
              onClose={() => dialogs.setErrorMessage(null)}
            >
              {dialogs.error}
            </Alert>
          )}

          {/* Vista principale: Tabella/Card o Timeline */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, pb: 1 }}>
            {viewMode === 'table' ? (
              tableViewMode === 'compact' ? (
                <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ScalettaTable
                    items={searchTerm.trim() ? filteredItems : scalettaItems.scalettaItems}
                    selectedItemIndex={scalettaItems.selectedItemIndex}
                    dragOverIndex={scalettaItems.dragOverIndex}
                    onSelectItem={scalettaItems.setSelectedItemIndex}
                    onEditItem={handleOpenEditPanel}
                    onPlayItem={handlePlayItem}
                    onPauseItem={handlePauseItem}
                    onStopItem={handleStopItem}
                    onRemoveItem={(itemId) => {
                      console.log("onRemoveItem chiamata con ID:", itemId);
                      if (scalettaItems && typeof scalettaItems.removeItem === 'function') {
                        scalettaItems.removeItem(itemId);
                      } else {
                        console.error("scalettaItems.removeItem non è una funzione valida!");
                        console.log("scalettaItems:", scalettaItems);
                      }
                    }}
                    onPlayTemplate={handlePlayTemplate}
                    onStopTemplate={handleStopTemplate}
                    onRemoveTemplate={handleRemoveTemplate}
                    onDragStart={scalettaItems.handleDragStart}
                    onDragOver={scalettaItems.handleDragOver}
                    onDragEnd={scalettaItems.handleDragEnd}
                    onDrop={scalettaItems.handleDrop}
                    onPlaySelected={handlePlaySelected}
                    onSendToRundown={handleSendToRundown}
                    userRole={scalettaItems.userRoleForScaletta}
                    editingStatusByItemId={scalettaItems.editingStatusByItemId}
                    isPlayoutOperator={isPlayoutOperator}
                    onPlayStory={handlePlayStory}
                    onStopStory={handleStopStory}
                    visibleColumns={visibleColumns}
                    selectedItemsSet={multiSelection.selectedItemsSet}
                    onItemSelectionChange={multiSelection.toggleItemSelection}
                    playbackSync={playbackSync}
                  />
                </Paper>
              ) : (
                <ScalettaCardView
                  items={searchTerm.trim() ? filteredItems : scalettaItems.scalettaItems}
                  selectedItemIndex={scalettaItems.selectedItemIndex}
                  onSelectItem={scalettaItems.setSelectedItemIndex}
                  onEditItem={handleOpenEditPanel}
                  onPlayItem={handlePlayItem}
                  onRemoveItem={(itemId) => {
                    console.log("onRemoveItem chiamata con ID:", itemId);
                    if (scalettaItems && typeof scalettaItems.removeItem === 'function') {
                      scalettaItems.removeItem(itemId);
                    } else {
                      console.error("scalettaItems.removeItem non è una funzione valida!");
                      console.log("scalettaItems:", scalettaItems);
                    }
                  }}
                  onUpdateItem={scalettaItems.updateItem}
                  editingStatusByItemId={scalettaItems.editingStatusByItemId}
                  canEdit={scalettaItems.userRoleForScaletta === 'owner' || scalettaItems.userRoleForScaletta === 'editor'}
                  selectedItemsSet={multiSelection.selectedItemsSet}
                  onItemSelectionChange={multiSelection.toggleItemSelection}
                />
              )
            ) : (
              <ProfessionalTimeline
                items={searchTerm.trim() ? filteredItems : scalettaItems.scalettaItems}
                selectedItem={scalettaItems.selectedItemIndex !== -1 ? scalettaItems.scalettaItems[scalettaItems.selectedItemIndex] : null}
                onItemSelect={handleTimelineItemSelect}
                onItemUpdate={handleTimelineItemUpdate}
                onItemPlay={handleTimelineItemPlay}
                onItemStop={handleTimelineItemStop}
                oscData={oscData}
                previewChannel={previewPlayer.previewChannel}
                previewLayer={previewPlayer.previewLayer}
              />
            )}
          </Box>
        </Box>

        {/* Pannello di modifica laterale */}
        <ItemEditPanel
          open={isEditPanelOpen}
          onClose={handleCloseEditPanel}
          item={dialogs.editingItem}
          onSave={scalettaItems.updateItem}
          onChange={dialogs.setEditingItem}
          onBrowseMedia={handleBrowseMedia}
          onBrowseTemplate={handleBrowseTemplate}
          startEditingItem={scalettaItems.startEditingItem}
          stopEditingItem={scalettaItems.stopEditingItem}
          userRole={scalettaItems.userRoleForScaletta}
        />
      </Box>

      {/* Dialoghi per la selezione di media e template */}
      <MediaDialog
        open={dialogs.mediaDialogOpen}
        onClose={dialogs.closeMediaDialog}
        onSelectMedia={previewPlayer.handleSelectMedia}
        onAddMedia={handleAddMedia}
        onConfirmForStory={handleConfirmMediaForStory}
        selectedMedia={previewPlayer.previewMedia}
        isUpdate={!!dialogs.editingItem && dialogs.editingItem.type === 'MEDIA'}
        isForStory={dialogs.isDialogForStory}
      />

      <TemplateDialog
        open={dialogs.templateDialogOpen}
        onClose={dialogs.closeTemplateDialog}
        onSelectTemplate={handleSelectTemplate}
        onAddTemplate={handleAddTemplate}
        onConfirmForStory={handleConfirmTemplateForStory}
        selectedTemplate={previewPlayer.previewTemplate}
        isUpdate={!!dialogs.editingItem && dialogs.editingItem.type === 'TEMPLATE'}
        isForStory={dialogs.isDialogForStory}
        templateIndex={dialogs.templateIndex}
      />

      {/* Dialog per la gestione dei collaboratori */}
      <CollaboratorsDialog
        open={collaboratorsDialogOpen}
        onClose={() => setCollaboratorsDialogOpen(false)}
        scalettaId={scalettaItems.activeScalettaId}
        scalettaName={scalettaItems.scalettaName}
        isOwner={scalettaItems.userRoleForScaletta === 'owner'}
      />

      {/* Dialog per la creazione di una nuova storia */}
      <StoryDialog
        open={storyDialogOpen}
        onClose={() => setStoryDialogOpen(false)}
        onAddStory={handleCreateStory}
        onBrowseMedia={dialogs.openMediaDialog}
        onBrowseTemplate={dialogs.openTemplateDialog}
        selectedMedia={previewPlayer.previewMedia}
        selectedTemplate={previewPlayer.previewTemplate}
      />

      {/* Dialog per la selezione del giorno della settimana */}
      <WeekDaySelectDialog
        open={weekDaySelectDialogOpen}
        onClose={() => setWeekDaySelectDialogOpen(false)}
        onConfirm={handleConfirmSendToCalendar}
        scalettaName={scalettaItems.scalettaName}
      />

      {/* Dialog per l'invio selettivo al rundown */}
      <SendToRundownDialog
        open={sendToRundownDialogOpen}
        onClose={() => setSendToRundownDialogOpen(false)}
        selectedItems={multiSelection.hasSelection ? multiSelection.getSelectedItems() : scalettaItems.scalettaItems}
        existingRundownItems={rundownContext?.items || []}
        onConfirm={handleConfirmSendToRundown}
        loading={sendToRundownLoading}
      />

      {/* Dialogo di selezione rundown di destinazione */}
      <RundownSelectorDialog
        open={rundownSelectorDialogOpen}
        onClose={() => setRundownSelectorDialogOpen(false)}
        onConfirm={handleRundownSelection}
        loading={sendToRundownLoading}
      />

      {/* Menu delle impostazioni */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleCloseSettings}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSaveScaletta}>
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Salva Scaletta" />
        </MenuItem>

        <MenuItem onClick={handleRestoreScaletta}>
          <ListItemIcon>
            <SettingsBackupRestoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Ripristina Scaletta" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleShareScaletta}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Condividi Scaletta" />
        </MenuItem>

        <MenuItem onClick={handleExportScaletta}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Esporta Scaletta" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleDeleteScaletta} disabled={scalettaItems.userRoleForScaletta !== 'owner'}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Elimina Scaletta" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ScaletteEditor;
