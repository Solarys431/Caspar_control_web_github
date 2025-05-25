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

// Componenti
import PreviewSection from './components/PreviewSection';
import ScalettaTable from './components/ScalettaTable';
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
import WeekDaySelectDialog from './components/WeekDaySelectDialog';

// Stili CSS
import './ScaletteEditor.css';

/**
 * Componente principale per l'editor di scalette
 *
 * @returns {JSX.Element} - Componente React
 */
const ScaletteEditor = () => {
  // Accesso al contesto CasparCG
  const { connected, getMediaList, getTemplateList, cgAdd, sendCommand } = useContext(CasparContext);

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

  // Stato per il pannello di modifica
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  // Stato per il menu delle impostazioni
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);

  // Stato per l'altezza dell'area superiore
  const [topAreaHeight, setTopAreaHeight] = useState(300);

  // Stato per il collasso dell'area superiore
  const [isTopAreaCollapsed, setIsTopAreaCollapsed] = useState(false);

  // Stato per la modalità di transizione
  const [transitionType, setTransitionType] = useState('CUT');

  // Stato per la modalità auto
  const [autoMode, setAutoMode] = useState(false);

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
    if (connected) {
      if (typeof getMediaList === 'function') getMediaList();
      if (typeof getTemplateList === 'function') getTemplateList();
    }
  }, [connected, getMediaList, getTemplateList]);

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

  // Funzione per gestire il cambio di transizione
  const handleTransitionChange = (newTransitionType) => {
    setTransitionType(newTransitionType);
    // Aggiungi un log di sistema
    addSystemLog(`Transizione cambiata a: ${newTransitionType}`, 'info');
  };

  // Funzione per gestire il toggle della modalità auto
  const handleToggleAutoMode = () => {
    setAutoMode(!autoMode);
    // Aggiungi un log di sistema
    addSystemLog(`Modalità AUTO ${!autoMode ? 'attivata' : 'disattivata'}`, 'info');
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
    const outPoint = outPointField ? outPointField.value : '00:03:30:00';

    const mediaData = {
      clip: mediaPath,
      channel: previewChannel,
      layer: 1,
      customName: typeof previewPlayer.previewMedia === 'string'
        ? previewPlayer.previewMedia.split('/').pop()
        : previewPlayer.previewMedia.name,
      startTime: '00:00:00',
      duration: outPoint,
      inPoint: inPoint,
      outPoint: outPoint,
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
      duration: '00:01:00',
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

  // Funzione per inviare la scaletta al rundown
  const handleSendToRundown = () => {
    // Verifica i permessi dell'utente
    const canSend = canUserSendToRundown(scalettaItems.userRoleForScaletta, isPlayoutOperator);

    if (!canSend) {
      dialogs.setErrorMessage("Non hai i permessi per inviare la scaletta al rundown. Devi essere il proprietario, un operatore di playout designato, o avere il ruolo 'playout_operator'.");
      return;
    }

    if (!rundownContext || typeof rundownContext.addMedia !== 'function' || typeof rundownContext.addTemplate !== 'function') {
      console.error("Le funzioni addMedia o addTemplate non sono disponibili da useRundown.");
      dialogs.setErrorMessage("Errore: le funzioni per inviare al rundown non sono disponibili.");
      return;
    }

    try {
      // Contatore per tenere traccia degli elementi inviati con successo
      let successCount = 0;

      // Invia ogni elemento al rundown
      scalettaItems.scalettaItems.forEach(item => {
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

          console.log("Invio media al rundown:", mediaData);
          rundownContext.addMedia(mediaData);
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

          console.log("Invio template al rundown:", templateData);
          rundownContext.addTemplate(templateData);
          successCount++;
        } else if (item.type === 'STORY') {
          // Per le storie, verifichiamo se hanno un media o template associati
          const { customName, originalName, timing, casparcgConfig, mediaDetails, templateDetails, templatesDetails } = item.data;

          // Se la storia ha un media associato, lo inviamo al rundown
          if (mediaDetails && mediaDetails.clipPath) {
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

            console.log("Invio media della storia al rundown:", mediaData);
            rundownContext.addMedia(mediaData);
            successCount++;
          }

          // Se la storia ha template multipli (nuovo formato), li inviamo tutti al rundown
          if (templatesDetails && templatesDetails.length > 0) {
            templatesDetails.forEach((templateDetail, index) => {
              if (templateDetail.templateFile) {
                // Usa il layer configurato dall'utente se presente
                const configuredLayer = templateDetail.casparcgConfig?.layer;
                const layerToUse = configuredLayer || 20;

                const templateData = {
                  template: templateDetail.templateFile,
                  channel: templateDetail.casparcgConfig?.channel || casparcgConfig.channel || 1,
                  layer: layerToUse,
                  cgLayer: templateDetail.casparcgConfig?.cgLayer || 1,
                  playOnLoad: templateDetail.casparcgConfig?.playOnLoad !== undefined ? templateDetail.casparcgConfig.playOnLoad : true,
                  data: templateDetail.instanceData || {},
                  customName: `${customName || originalName} - Template ${index + 1}`,
                  startTime: timing.startTime || '00:00:00',
                  duration: timing.duration || '00:00:10',
                  location: `CH${templateDetail.casparcgConfig?.channel || casparcgConfig.channel || 1}-L${layerToUse}`,
                  notes: item.data.notes || '',
                  autoRemove: templateDetail.autoRemove || false
                };

                console.log(`Invio template ${index + 1} della storia al rundown:`, templateData);
                rundownContext.addTemplate(templateData);
                successCount++;
              }
            });
          }
          // Se la storia ha un template associato (vecchio formato), lo inviamo al rundown
          else if (templateDetails && templateDetails.templateFile) {
            const templateData = {
              template: templateDetails.templateFile,
              channel: casparcgConfig.channel || 1,
              layer: casparcgConfig.layer || 20,
              cgLayer: templateDetails.casparcgConfig?.cgLayer || 1,
              playOnLoad: templateDetails.casparcgConfig?.playOnLoad !== undefined ? templateDetails.casparcgConfig.playOnLoad : true,
              data: templateDetails.instanceData || {},
              customName: customName || originalName,
              startTime: timing.startTime || '00:00:00',
              duration: timing.duration || '00:00:10',
              location: `CH${casparcgConfig.channel}-L${casparcgConfig.layer}`,
              notes: item.data.notes || '',
              autoRemove: templateDetails.autoRemove || false
            };

            console.log("Invio template della storia al rundown:", templateData);
            rundownContext.addTemplate(templateData);
            successCount++;
          }

          // Se la storia non ha né media né template, la saltiamo
          if (!mediaDetails?.clipPath && !templatesDetails?.length && !templateDetails?.templateFile) {
            console.log("Storia senza media o template associati, saltata");
          }
        }
      });

      // Mostra un messaggio di successo
      if (successCount > 0) {
        alert(`${successCount} elementi inviati al rundown con successo!`);
      } else {
        dialogs.setErrorMessage("Nessun elemento valido da inviare al rundown.");
      }
    } catch (error) {
      console.error("Errore durante l'invio al rundown:", error);
      dialogs.setErrorMessage(`Errore durante l'invio al rundown: ${error.message}`);
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

      // Prepara i dati del rundown
      const rundownData = {
        id: rundownId,
        name: scalettaItems.scalettaName,
        type: 'RUNDOWN',
        startTime: startTime,
        duration: calculateTotalDuration(),
        items: scalettaItems.scalettaItems.map(item => ({
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
  const handleStopItem = () => {
    try {
      // Usa sempre il canale di preview (3)
      sendCommand(casparCommands.generateStopCommand(previewChannel, 1))
        .catch(error => {
          console.error(`Errore durante lo stop: ${error.message || JSON.stringify(error)}`);
          dialogs.setErrorMessage(`Errore stop media: ${error.message}`);
        });
      previewPlayer.handlePlaybackControl('stop');
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

          {/* Tabella */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1, pb: 1 }}>
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
              />
            </Paper>
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
