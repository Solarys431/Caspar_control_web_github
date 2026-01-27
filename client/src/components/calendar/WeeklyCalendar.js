import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Grid,
  ButtonGroup,
  FormControlLabel,
  Checkbox,
  Select,
  InputLabel,
  FormControl,
  List,
  ListItem,
  Tooltip // <<<< AGGIUNTO IMPORT MANCANTE
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
// import AddIcon from '@mui/icons-material/Add'; // Non utilizzato, commentato
import TodayIcon from '@mui/icons-material/Today';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useCalendar } from '../../contexts/CalendarContext';
import { useCaspar } from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext';
import ExplodePreviewDialog from './ExplodePreviewDialog';

// Funzione helper per determinare il tipo di template basandosi nel nome
const getTemplateTypeFromName = (templateName) => {
  if (!templateName) return 'generic';
  const lowerName = templateName.toLowerCase();
  if (lowerName.includes('ticker')) return 'ticker';
  if (lowerName.includes('lower') && lowerName.includes('third')) return 'lower_third';
  if (lowerName.includes('logo')) return 'logo';
  if (lowerName.includes('text') && !lowerName.includes('lower_third') && !lowerName.includes('ticker')) return 'text';
  return 'generic';
};


// Componente per il calendario settimanale professionale
const WeeklyCalendar = () => {
  const {
    calendarData,
    modified,
    addRundownToDay,
    removeRundownFromDay,
    updateRundownInDay,
    loadCurrentDayPlaylistToRundown,
    saveCalendarToFile: saveCalendar,
    loadCalendarFromFile: loadCalendar,
    clearCalendar,
    calculateEndTime
  } = useCalendar();

  const { connected, mediaList, templateList } = useCaspar();
  const { loadRundown, setItems: setRundownItems } = useRundown();

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [rundownPath, setRundownPath] = useState('');
  const [rundownName, setRundownName] = useState('');
  const [rundownStartTime, setRundownStartTime] = useState('00:00:00');
  const [rundownDuration, setRundownDuration] = useState('01:00:00');
  const [rundownNote, setRundownNote] = useState('');
  const [rundownInPoint, setRundownInPoint] = useState('00:00:00');
  const [rundownOutPoint, setRundownOutPoint] = useState('');
  const [itemType, setItemType] = useState('RUNDOWN');
  const [itemChannel, setItemChannel] = useState(1);
  const [itemLayer, setItemLayer] = useState(10);
  const [itemCgLayer, setItemCgLayer] = useState(1);
  const [itemDataJson, setItemDataJson] = useState('{}');
  const [itemLoop, setItemLoop] = useState(false);

  const [currentMainTemplateType, setCurrentMainTemplateType] = useState('generic');
  const [mainTemplateFieldText, setMainTemplateFieldText] = useState('');
  const [mainTemplateFieldTitle, setMainTemplateFieldTitle] = useState('');
  const [mainTemplateFieldSubtitle, setMainTemplateFieldSubtitle] = useState('');
  const [mainTemplatePlayOnLoad, setMainTemplatePlayOnLoad] = useState(true);

  const [linkedTemplateFile, setLinkedTemplateFile] = useState('');
  const [linkedTemplateGeneralLayer, setLinkedTemplateGeneralLayer] = useState(20);
  const [linkedTemplateCgLayer, setLinkedTemplateCgLayer] = useState(1);
  const [linkedTemplateDelay, setLinkedTemplateDelay] = useState(1000);
  const [linkedTemplatePlayOnLoad, setLinkedTemplatePlayOnLoad] = useState(true);
  const [currentLinkedTemplateType, setCurrentLinkedTemplateType] = useState('generic');
  const [linkedTemplateFieldText, setLinkedTemplateFieldText] = useState('');
  const [linkedTemplateFieldTitle, setLinkedTemplateFieldTitle] = useState('');
  const [linkedTemplateFieldSubtitle, setLinkedTemplateFieldSubtitle] = useState('');
  const [linkedTemplateDataJson, setLinkedTemplateDataJson] = useState('{}');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [calendarView, setCalendarView] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // Stato per il dialogo di anteprima dell'esplosione
  const [explodePreviewOpen, setExplodePreviewOpen] = useState(false);
  const [itemsToExplode, setItemsToExplode] = useState([]);
  const [explodeSource, setExplodeSource] = useState({
    scalettaName: '',
    day: ''
  });

  // const weekDays = useMemo(() => ({ // Non utilizzato direttamente nel JSX, commentato per ora
  //   monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì',
  //   thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica'
  // }), []);

  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handlePreviousWeek = useCallback(() => {
    setCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - (calendarView === 'day' ? 1 : 7));
      return newDate;
    });
  }, [calendarView]);

  const handleNextWeek = useCallback(() => {
    setCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (calendarView === 'day' ? 1 : 7));
      return newDate;
    });
  }, [calendarView]);

  const handleMenuClose = useCallback(() => setMenuAnchorEl(null), []);

  const resetAddEditDialogState = () => {
    setRundownPath('');
    setRundownName('');
    setRundownStartTime('00:00:00');
    setRundownDuration('01:00:00');
    setRundownNote('');
    setRundownInPoint('00:00:00');
    setRundownOutPoint('');
    setItemType('RUNDOWN');
    setItemChannel(1);
    setItemLayer(10);
    setItemCgLayer(1);
    setItemDataJson('{}');
    setItemLoop(false);
    setMainTemplatePlayOnLoad(true);

    setCurrentMainTemplateType('generic');
    setMainTemplateFieldText('');
    setMainTemplateFieldTitle('');
    setMainTemplateFieldSubtitle('');

    setLinkedTemplateFile('');
    setLinkedTemplateGeneralLayer(20);
    setLinkedTemplateCgLayer(1);
    setLinkedTemplateDelay(1000);
    setLinkedTemplatePlayOnLoad(true);
    setCurrentLinkedTemplateType('generic');
    setLinkedTemplateFieldText('');
    setLinkedTemplateFieldTitle('');
    setLinkedTemplateFieldSubtitle('');
    setLinkedTemplateDataJson('{}');
  };

  useEffect(() => {
    if (itemType === 'TEMPLATE' && rundownPath) {
        const type = getTemplateTypeFromName(rundownPath);
        if (type !== currentMainTemplateType) {
            setCurrentMainTemplateType(type);
            setMainTemplateFieldText('');
            setMainTemplateFieldTitle('');
            setMainTemplateFieldSubtitle('');
            setItemDataJson('{}');
        }
    } else if (itemType !== 'TEMPLATE') {
        setCurrentMainTemplateType('generic');
    }
  }, [rundownPath, itemType, currentMainTemplateType]);

  useEffect(() => {
    if (itemType === 'MEDIA' && linkedTemplateFile) {
        const type = getTemplateTypeFromName(linkedTemplateFile);
        if (type !== currentLinkedTemplateType) {
            setCurrentLinkedTemplateType(type);
            setLinkedTemplateFieldText('');
            setLinkedTemplateFieldTitle('');
            setLinkedTemplateFieldSubtitle('');
            setLinkedTemplateDataJson('{}');
        }
    } else if (itemType !== 'MEDIA' || !linkedTemplateFile) {
        setCurrentLinkedTemplateType('generic');
    }
  }, [linkedTemplateFile, itemType, currentLinkedTemplateType]);


  const handleAddDialogOpen = useCallback((dayIso, dateForStartTime) => {
    resetAddEditDialogState();
    setSelectedDay(dayIso);
    if (dateForStartTime instanceof Date) {
      const hours = dateForStartTime.getHours().toString().padStart(2, '0');
      const minutes = dateForStartTime.getMinutes().toString().padStart(2, '0');
      setRundownStartTime(`${hours}:${minutes}:00`);
    } else {
      setRundownStartTime('00:00:00');
    }
    setItemType('RUNDOWN');
    setAddDialogOpen(true);
  }, []);

  const handleAddDialogClose = useCallback(() => {
    setAddDialogOpen(false);
    resetAddEditDialogState();
  }, []);

  const handleEditDialogOpen = useCallback((eventData) => {
    resetAddEditDialogState();
    setSelectedEvent(eventData);
    const { rundown } = eventData;

    setRundownName(rundown.name || '');
    setRundownPath(rundown.path || rundown.clip || rundown.template || '');
    setRundownStartTime(rundown.startTime || '00:00:00');
    setRundownDuration(rundown.duration || '01:00:00');
    setRundownNote(rundown.note || '');
    setRundownInPoint(rundown.inPoint || '00:00:00');
    setRundownOutPoint(rundown.outPoint || '');
    setItemType(rundown.type || 'RUNDOWN');
    setItemChannel(rundown.channel || 1);
    setItemLayer(rundown.layer || (rundown.type === 'TEMPLATE' ? 20 : 10));

    if (rundown.type === 'TEMPLATE') {
        setItemCgLayer(rundown.cgLayer || 1);
        setMainTemplatePlayOnLoad(rundown.playOnLoad !== undefined ? rundown.playOnLoad : true);
        const templateType = getTemplateTypeFromName(rundown.template);
        setCurrentMainTemplateType(templateType);
        const mainData = rundown.data || {};
        if (templateType === 'ticker' || templateType === 'logo' || templateType === 'text') {
            setMainTemplateFieldText(mainData.text || '');
        } else if (templateType === 'lower_third') {
            setMainTemplateFieldTitle(mainData.title || '');
            setMainTemplateFieldSubtitle(mainData.subtitle || '');
        } else {
            setItemDataJson(JSON.stringify(mainData, null, 2));
        }
    } else if (rundown.type === 'MEDIA') {
        setItemLoop(rundown.loop || false);
        if (rundown.linkedTemplate && rundown.linkedTemplate.template) {
            const linked = rundown.linkedTemplate;
            setLinkedTemplateFile(linked.template || '');
            const linkedType = getTemplateTypeFromName(linked.template);
            setCurrentLinkedTemplateType(linkedType);
            setLinkedTemplateGeneralLayer(linked.layer || (rundown.layer ? rundown.layer + 10 : 20));
            setLinkedTemplateCgLayer(linked.cgLayer || 1);
            setLinkedTemplateDelay(linked.delay !== undefined ? linked.delay : 1000);
            setLinkedTemplatePlayOnLoad(linked.playOnLoad !== undefined ? linked.playOnLoad : true);
            const linkedData = linked.data || {};
            if (linkedType === 'ticker' || linkedType === 'logo' || linkedType === 'text') {
                setLinkedTemplateFieldText(linkedData.text || '');
            } else if (linkedType === 'lower_third') {
                setLinkedTemplateFieldTitle(linkedData.title || '');
                setLinkedTemplateFieldSubtitle(linkedData.subtitle || '');
            } else {
                setLinkedTemplateDataJson(JSON.stringify(linkedData, null, 2));
            }
        }
    }
    setEditDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    resetAddEditDialogState();
    setSelectedEvent(null);
  }, []);

  const handleSaveEvent = useCallback(() => {
    const targetDay = editDialogOpen ? selectedEvent.day : selectedDay;
    if (!targetDay || !rundownName) {
      showNotification('Giorno e nome sono obbligatori', 'error');
      return;
    }

    const now = new Date();
    const currentTimeForDefault = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    // Costruzione del payload dell'evento
    const eventPayload = {
      id: editDialogOpen ? selectedEvent.rundown.id : uuidv4(),
      type: itemType,
      name: rundownName,
      startTime: rundownStartTime || currentTimeForDefault,
      duration: rundownDuration,
      note: rundownNote,
      inPoint: rundownInPoint,
      outPoint: rundownOutPoint,
      channel: itemChannel,
      layer: itemLayer,
      ...(itemType === 'RUNDOWN' && { path: rundownPath }),
      ...(itemType === 'MEDIA' && {
        clip: rundownPath,
        loop: itemLoop,
        linkedTemplate: null // Inizializza linkedTemplate, verrà popolato dopo se necessario
      }),
      ...(itemType === 'TEMPLATE' && {
        template: rundownPath,
        cgLayer: itemCgLayer,
        playOnLoad: mainTemplatePlayOnLoad,
        data: {} // Inizializza data, verrà popolato dopo
      }),
    };

    // Popolamento dei dati specifici per tipo TEMPLATE
    if (itemType === 'TEMPLATE') {
      try {
        if (currentMainTemplateType === 'ticker' || currentMainTemplateType === 'logo' || currentMainTemplateType === 'text') {
          eventPayload.data = { text: mainTemplateFieldText || "" };
        } else if (currentMainTemplateType === 'lower_third') {
          eventPayload.data = { title: mainTemplateFieldTitle || "", subtitle: mainTemplateFieldSubtitle || "" };
        } else {
          eventPayload.data = itemDataJson ? JSON.parse(itemDataJson) : {};
        }
      } catch (error) {
        showNotification('Errore nel formato JSON dei dati del template principale.', 'error');
        return;
      }
    }

    // Popolamento dei dati specifici per tipo MEDIA con template annidato
    if (itemType === 'MEDIA' && linkedTemplateFile) {
      let linkedDataObject = {};
      try {
        if (currentLinkedTemplateType === 'ticker' || currentLinkedTemplateType === 'logo' || currentLinkedTemplateType === 'text') {
          linkedDataObject = { text: linkedTemplateFieldText || "" };
        } else if (currentLinkedTemplateType === 'lower_third') {
          linkedDataObject = { title: linkedTemplateFieldTitle || "", subtitle: linkedTemplateFieldSubtitle || "" };
        } else {
          linkedDataObject = linkedTemplateDataJson ? JSON.parse(linkedTemplateDataJson) : {};
        }
      } catch (error) {
        showNotification('Errore nel formato JSON dei dati del template annidato.', 'error');
        return;
      }
      eventPayload.linkedTemplate = {
        template: linkedTemplateFile,
        channel: itemChannel, // O un canale dedicato per i template annidati
        layer: linkedTemplateGeneralLayer,
        cgLayer: linkedTemplateCgLayer,
        delay: linkedTemplateDelay,
        playOnLoad: linkedTemplatePlayOnLoad,
        name: linkedTemplateFile.split('/').pop(), // Nome basato sul file
        data: linkedDataObject,
      };
    }

    // Aggiornamento o aggiunta dell'evento nel calendario
    if (editDialogOpen) {
      updateRundownInDay(targetDay, eventPayload.id, eventPayload);
      showNotification(`Evento "${rundownName}" aggiornato`, 'success');
      handleEditDialogClose();
    } else {
      addRundownToDay(targetDay, eventPayload);
      const formattedDate = format(new Date(targetDay + 'T00:00:00'), 'EEEE d MMMM yy', { locale: it });
      showNotification(`Evento "${rundownName}" aggiunto a ${formattedDate}`, 'success');
      handleAddDialogClose();
    }

    // Sincronizzazione con il rundown se l'evento modificato/aggiunto è per il giorno corrente
    const todayIso = new Date().toISOString().split('T')[0];
    if (targetDay === todayIso) {
      // Ottiene tutti gli item del calendario per il giorno corrente
      const itemsFromCalendarToday = loadCurrentDayPlaylistToRundown();

      if (itemsFromCalendarToday && itemsFromCalendarToday.length > 0) {
        // Trasforma gli item del calendario nel formato atteso dal rundown
        const calendarItemsForRundown = itemsFromCalendarToday.map(calItem => ({
          id: calItem.id,
          type: calItem.type,
          name: calItem.name,
          data: { ...calItem }, // Assicura che tutti i dati dell'evento del calendario siano inclusi
          // Potrebbe essere utile aggiungere un flag per identificare l'origine, es:
          // source: 'calendarToday'
        }));

        // Aggiorna il rundown mantenendo gli item non provenienti dal calendario di oggi
        setRundownItems(prevRundownItems => {
          // Crea un set degli ID degli item del calendario di oggi per una ricerca efficiente
          const calendarItemIdsToday = new Set(calendarItemsForRundown.map(item => item.id));

          // Filtra gli item del rundown precedente:
          // Mantieni quelli che NON hanno un ID corrispondente agli item del calendario di oggi.
          // Questo preserverà gli item aggiunti manualmente o da altre fonti.
          // Una logica più robusta potrebbe usare un flag 'source' se disponibile.
          const existingItemsToKeep = prevRundownItems.filter(
            item => !calendarItemIdsToday.has(item.id)
          );

          // Unisci gli item esistenti da mantenere con i nuovi (o aggiornati) item del calendario
          const newRundownState = [...existingItemsToKeep, ...calendarItemsForRundown];

          // È importante riordinare gli item, ad esempio per orario di inizio,
          // per mantenere la coerenza con come il rundown viene gestito altrove.
          return newRundownState.sort((a, b) => (a.data.startTime || "0").localeCompare(b.data.startTime || "0"));
        });
        showNotification('Rundown aggiornato con gli eventi odierni del calendario.', 'info');
      } else {
        // Se non ci sono eventi nel calendario per oggi, potresti voler pulire solo
        // gli item del rundown che erano originariamente dal calendario di oggi,
        // invece di svuotare completamente il rundown o lasciarlo inalterato.
        // Questa logica dipende dal comportamento desiderato.
        // Per ora, se non ci sono eventi per oggi, non modifichiamo gli item non di calendario.
        setRundownItems(prevRundownItems => {
            // Rimuovi solo gli item che POTREBBERO essere stati precedentemente sincronizzati dal calendario
            // Questa è una semplificazione; una gestione con 'source' sarebbe più precisa.
            // Se non hai un modo per identificare gli item del calendario, potresti
            // decidere di non fare nulla qui, o di pulire il rundown solo se
            // prevRundownItems contiene solo item che si presume siano del calendario.
            // Per la massima sicurezza e per evitare cancellazioni impreviste,
            // la logica più sicura senza un flag 'source' è non modificare il rundown
            // se il calendario di oggi è vuoto, a meno che non si voglia esplicitamente
            // che il rundown rifletta SEMPRE SOLO il calendario.
            // La seguente linea è un esempio di come potresti voler mantenere gli item non di calendario:
            // return prevRundownItems.filter(item => !item.id.startsWith("cal-")); // Esempio se ID avessero un prefisso

            // Data la richiesta originale, se il calendario di oggi è vuoto,
            // NON vogliamo cancellare gli item aggiunti manualmente.
            // Quindi, potremmo filtrare via solo gli item che *sappiamo* provenire dal calendario
            // Se non abbiamo un marcatore, la soluzione più sicura è non toccare il rundown
            // o, se si vuole una pulizia, essere molto specifici.
            // In questo caso, se itemsToLoadToRundown è vuoto, non facciamo nulla
            // per evitare di cancellare item aggiunti manualmente.
            // La logica precedente con `setRundownItems(rundownCompatibleItems)` avrebbe svuotato
            // il rundown se `itemsToLoadToRundown` fosse stato vuoto.
            // Con la nuova logica di merge, se `calendarItemsForRundown` è vuoto,
            // `newRundownState` conterrà solo `existingItemsToKeep`.
            return prevRundownItems; // Mantiene lo stato attuale se non ci sono item dal calendario
        });
        showNotification('Nessun evento nel calendario per oggi da sincronizzare con il rundown.', 'info');
      }
    }
  }, [
    selectedDay, editDialogOpen, selectedEvent, rundownName, rundownPath, rundownStartTime, rundownDuration, rundownNote,
    rundownInPoint, rundownOutPoint, itemType, itemChannel, itemLayer, itemCgLayer, itemDataJson, itemLoop, mainTemplatePlayOnLoad,
    currentMainTemplateType, mainTemplateFieldText, mainTemplateFieldTitle, mainTemplateFieldSubtitle,
    linkedTemplateFile, linkedTemplateGeneralLayer, linkedTemplateCgLayer, linkedTemplateDelay, linkedTemplatePlayOnLoad,
    currentLinkedTemplateType, linkedTemplateFieldText, linkedTemplateFieldTitle, linkedTemplateFieldSubtitle, linkedTemplateDataJson,
    addRundownToDay, updateRundownInDay, handleAddDialogClose, handleEditDialogClose, showNotification,
    // Rimuovi calendarData dalle dipendenze se non direttamente usato qui per leggere,
    // ma solo tramite loadCurrentDayPlaylistToRundown.
    // calendarData,
    loadCurrentDayPlaylistToRundown,
    setRundownItems,
    // Aggiungi le dipendenze mancanti se usate direttamente nella funzione `format` o `uuidv4`
    // (anche se solitamente sono import globali e non necessitano di essere nelle dipendenze di useCallback)
    // it // (per la locale di date-fns, se usata direttamente qui)
  ]);


  const handleRemoveRundownFromMenu = useCallback(() => {
    if (selectedEvent && selectedEvent.rundown) {
      removeRundownFromDay(selectedEvent.day, selectedEvent.rundown.id);
      showNotification(`Evento "${selectedEvent.rundown.name}" rimosso`, 'info');
    }
    handleMenuClose();
  }, [selectedEvent, removeRundownFromDay, handleMenuClose, showNotification]);

  const handleLoadRundownToMain = useCallback(() => {
    if (selectedEvent && selectedEvent.resource && selectedEvent.resource.path) { // Questo blocco potrebbe essere obsoleto se selectedEvent.resource non è più usato
      loadRundown(selectedEvent.resource.path);
      showNotification(`Rundown "${selectedEvent.title}" caricato nel player principale`, 'success');
    } else if (selectedEvent && selectedEvent.rundown) {
        const rundownToLoad = {
            name: selectedEvent.rundown.name || "Playlist del Calendario",
            items: [{
                id: selectedEvent.rundown.id,
                type: selectedEvent.rundown.type,
                name: selectedEvent.rundown.name,
                data: { ...selectedEvent.rundown }
            }]
        };
        loadRundown(rundownToLoad);
        showNotification(`Evento "${selectedEvent.rundown.name}" caricato nel player principale`, 'success');
    }
    handleMenuClose();
  }, [selectedEvent, loadRundown, handleMenuClose, showNotification]);

  // Funzione per scorporare gli elementi di una scaletta e inviarli al rundown
  const handleExplodeRundownToMain = useCallback(() => {
    if (selectedEvent && selectedEvent.rundown && selectedEvent.rundown.items && Array.isArray(selectedEvent.rundown.items)) {
      // CORREZIONE: Prepara gli elementi da inviare al rundown rimuovendo duplicati
      const itemsToLoad = selectedEvent.rundown.items
        .filter((item, index, self) => index === self.findIndex(i => i.id === item.id))
        .map(item => {
          return {
            id: item.id,
            type: item.type,
            name: item.name,
            data: { ...item.data }
          };
        });

      console.log('🔍 [WEEKLY CALENDAR] Preparazione esplosione scaletta:', {
        originalItems: selectedEvent.rundown.items.length,
        uniqueItems: itemsToLoad.length,
        duplicatesRemoved: selectedEvent.rundown.items.length - itemsToLoad.length
      });

      // Imposta gli elementi da esplodere e apre il dialogo di anteprima
      if (itemsToLoad.length > 0) {
        setItemsToExplode(itemsToLoad);
        setExplodeSource({
          scalettaName: selectedEvent.rundown.name,
          day: selectedEvent.day
        });
        setExplodePreviewOpen(true);
      } else {
        showNotification(`La scaletta "${selectedEvent.rundown.name}" non contiene elementi da esplodere`, 'warning');
      }
    } else {
      showNotification('Impossibile esplodere la scaletta: formato non valido o nessun elemento presente', 'error');
    }
    handleMenuClose();
  }, [selectedEvent, handleMenuClose, showNotification]);

  // Funzione per gestire la conferma dell'esplosione dal dialogo di anteprima
  const handleConfirmExplode = useCallback((selectedItems, options) => {
    if (selectedItems.length === 0) {
      showNotification('Nessun elemento selezionato per l\'esplosione', 'warning');
      return;
    }

    // Prepara gli elementi da inviare al rundown
    const itemsToLoad = selectedItems.map(item => {
      // Se l'opzione è attiva, preserva le informazioni di origine
      let enhancedItem = { ...item };

      if (options.preserveSourceInfo) {
        // Preserva le informazioni di origine
        const sourceInfo = {
          sourceScalettaId: explodeSource.scalettaName,
          sourceScalettaName: explodeSource.scalettaName,
          sourceDay: explodeSource.day,
          explodedAt: new Date().toISOString()
        };

        enhancedItem.data = {
          ...enhancedItem.data,
          sourceInfo
        };
      }

      return enhancedItem;
    });

    // Ordina gli elementi per orario di inizio
    let processedItems = [...itemsToLoad].sort((a, b) => {
      const startTimeA = a.data.startTime || '00:00:00';
      const startTimeB = b.data.startTime || '00:00:00';
      return startTimeA.localeCompare(startTimeB);
    });

    // Se l'opzione è attiva, ricalcola gli orari di inizio
    if (options.recalculateStartTimes) {
      const baseTime = options.startTimeOffset || '00:00:00';
      let [hours, minutes, seconds] = baseTime.split(':').map(Number);
      let totalSeconds = hours * 3600 + minutes * 60 + seconds;

      processedItems = processedItems.map((item, index) => {
        if (index === 0) {
          // Il primo elemento inizia all'orario specificato
          item.data.startTime = baseTime;
        } else {
          // Gli elementi successivi iniziano dopo la fine dell'elemento precedente
          const prevItem = processedItems[index - 1];
          const prevDuration = prevItem.data.duration || '00:00:00';
          const [prevHours, prevMinutes, prevSeconds] = prevDuration.split(':').map(Number);
          const prevDurationSeconds = prevHours * 3600 + prevMinutes * 60 + prevSeconds;

          totalSeconds += prevDurationSeconds;

          const newHours = Math.floor(totalSeconds / 3600);
          const newMinutes = Math.floor((totalSeconds % 3600) / 60);
          const newSeconds = totalSeconds % 60;

          item.data.startTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        }

        return item;
      });
    }

    // Carica gli elementi nel rundown
    if (options.replaceRundown) {
      // Sostituisci il rundown attuale
      const rundownToLoad = {
        name: `${explodeSource.scalettaName} (Esploso)`,
        items: processedItems
      };
      loadRundown(rundownToLoad);
    } else {
      // Aggiungi al rundown esistente
      if (options.avoidDuplicates) {
        // Ottieni gli ID degli elementi già presenti nel rundown
        setRundownItems(prevItems => {
          const existingIds = prevItems.map(item => item.id);
          // Filtra gli elementi da aggiungere per evitare duplicati
          const newItems = processedItems.filter(item => !existingIds.includes(item.id));
          return [...prevItems, ...newItems];
        });
      } else {
        // Aggiungi tutti gli elementi senza controllo duplicati
        setRundownItems(prevItems => [...prevItems, ...processedItems]);
      }
    }

    showNotification(`Scaletta "${explodeSource.scalettaName}" esplosa nel rundown con ${processedItems.length} elementi`, 'success');
  }, [explodeSource, loadRundown, setRundownItems, showNotification]);

  const handleSaveCalendar = useCallback(() => saveCalendar().then(() => showNotification('Calendario salvato', 'success')), [saveCalendar, showNotification]);
  const handleLoadCalendar = useCallback(() => loadCalendar().then(() => showNotification('Calendario caricato', 'success')), [loadCalendar, showNotification]);
  const handleClearCalendar = useCallback(() => {
    if (window.confirm('Sei sicuro di voler cancellare tutti gli eventi dal calendario?')) {
      clearCalendar();
      showNotification('Calendario svuotato', 'info');
    }
  }, [clearCalendar, showNotification]);

  const handleSelectRundownFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setRundownPath(file.name); // o il percorso completo se necessario per il caricamento
        setRundownName(file.name.replace(/\.[^/.]+$/, "")); // Rimuove l'estensione
      }
    };
    input.click();
   }, []);
  const handleSelectMediaFile = useCallback(() => setMediaSelectorOpen(true), []);
  const handleSelectTemplateFile = useCallback(() => setTemplateSelectorOpen(true), []);

  const handleMenuOpen = (event, day, rundown) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedEvent({ day, rundown });
  };


  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#2d2d2d' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">Calendario Settimanale Professionale</Typography>
            {modified && (<Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>Modificato</Typography>)}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={handleLoadCalendar} size="small">Carica</Button>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveCalendar} size="small">Salva</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleClearCalendar} size="small">Pulisci</Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, backgroundColor: '#2d2d2d', height: 'calc(100vh - 250px)', minHeight: '500px' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Button variant="outlined" startIcon={<TodayIcon />} onClick={() => setCalendarDate(new Date())} sx={{ mr: 1 }}>Oggi</Button>
              <ButtonGroup variant="outlined" color="secondary">
                <Button onClick={() => {
                    const itemsLoaded = loadCurrentDayPlaylistToRundown();
                    if (itemsLoaded && itemsLoaded.length > 0) {
                        setRundownItems(itemsLoaded.map(calItem => ({
                            id: calItem.id,
                            type: calItem.type,
                            name: calItem.name,
                            data: { ...calItem }
                        })));
                        showNotification(`Caricati ${itemsLoaded.length} eventi nel rundown attuale`, 'success');
                    } else {
                        showNotification('Nessun evento per oggi nel calendario.', 'info');
                    }
                }}>
                  Carica Eventi Odierni nel Rundown
                </Button>
                <Button
                  onClick={() => {
                    // Determina il giorno corrente
                    const today = new Date();
                    const currentDateIso = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD

                    // Verifica se ci sono rundown per il giorno corrente
                    if (calendarData[currentDateIso] && Array.isArray(calendarData[currentDateIso]) && calendarData[currentDateIso].length > 0) {
                      // Filtra solo le scalette che hanno elementi
                      const scaletteWithItems = calendarData[currentDateIso].filter(item =>
                        item.items && Array.isArray(item.items) && item.items.length > 0
                      );

                      if (scaletteWithItems.length > 0) {
                        // CORREZIONE: Prepara tutti gli elementi da tutte le scalette rimuovendo duplicati
                        const allItems = [];
                        scaletteWithItems.forEach(scaletta => {
                          const itemsFromScaletta = scaletta.items.map(item => {
                            return {
                              id: item.id,
                              type: item.type,
                              name: item.name,
                              data: { ...item.data }
                            };
                          });
                          allItems.push(...itemsFromScaletta);
                        });

                        // Rimuovi duplicati basati sull'ID
                        const uniqueItems = allItems.filter((item, index, self) =>
                          index === self.findIndex(i => i.id === item.id)
                        );

                        console.log('🔍 [WEEKLY CALENDAR] Preparazione esplosione giornaliera:', {
                          totalScalette: scaletteWithItems.length,
                          originalItems: allItems.length,
                          uniqueItems: uniqueItems.length,
                          duplicatesRemoved: allItems.length - uniqueItems.length
                        });

                        // Imposta gli elementi da esplodere e apre il dialogo di anteprima
                        if (uniqueItems.length > 0) {
                          setItemsToExplode(uniqueItems);
                          setExplodeSource({
                            scalettaName: `Scalette del ${format(today, 'dd/MM/yyyy')}`,
                            day: currentDateIso
                          });
                          setExplodePreviewOpen(true);
                        } else {
                          showNotification('Nessun elemento trovato nelle scalette di oggi', 'warning');
                        }
                      } else {
                        showNotification('Nessuna scaletta con elementi trovata per oggi', 'warning');
                      }
                    } else {
                      showNotification('Nessun evento per oggi nel calendario.', 'info');
                    }
                  }}
                  startIcon={<PlaylistPlayIcon />}
                >
                  Esplodi Scalette Odierne nel Rundown
                </Button>
              </ButtonGroup>
            </Box>
            <ButtonGroup variant="outlined">
              <Button onClick={() => setCalendarView('week')} variant={calendarView === 'week' ? 'contained' : 'outlined'}>Settimana</Button>
              <Button onClick={() => setCalendarView('day')} variant={calendarView === 'day' ? 'contained' : 'outlined'}>Giorno</Button>
            </ButtonGroup>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#1e1e1e', borderRadius: 1, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <Button onClick={handlePreviousWeek} sx={{ minWidth: '40px', p: 1 }}><ArrowBackIosNewIcon fontSize="small" /></Button>
              <Typography variant="h6" sx={{ mx: 2, textAlign: 'center' }}>
                {calendarView === 'week'
                  ? `${format(startOfWeek(calendarDate, { locale: it, weekStartsOn: 1 }), 'd MMM', { locale: it })} - ${format(endOfWeek(calendarDate, { locale: it, weekStartsOn: 1 }), 'd MMM yy', { locale: it })}`
                  : format(calendarDate, 'EEEE d MMMM yy', { locale: it })
                }
              </Typography>
              <Button onClick={handleNextWeek} sx={{ minWidth: '40px', p: 1 }}><ArrowForwardIosIcon fontSize="small" /></Button>
            </Box>

            {calendarView === 'week' && (
              <Grid container spacing={0.5}>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const currentDayDate = new Date(startOfWeek(calendarDate, { locale: it, weekStartsOn: 1 }));
                  currentDayDate.setDate(currentDayDate.getDate() + dayIndex);
                  const dayIso = currentDayDate.toISOString().split('T')[0];
                  const dayName = format(currentDayDate, 'EEE', { locale: it });
                  const dayNumber = currentDayDate.getDate();

                  return (
                    <Grid item xs={12/7} key={dayIso} sx={{borderRight: dayIndex < 6 ? '1px solid #333' : 'none', '&:first-of-type': { borderLeft: '1px solid #333'}}}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#272727', borderTop: '1px solid #333', borderBottom:'1px solid #444' }}>
                        <Typography variant="subtitle2" sx={{fontSize: '0.8rem'}}>{dayName.toUpperCase()} {dayNumber}</Typography>
                      </Paper>
                      <Box sx={{ mt: 0, minHeight: '500px', position: 'relative', overflowY: 'auto', maxHeight: '60vh',
                          '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '2px' }
                        }}>
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <Box key={hour}
                            sx={{ position: 'relative', height: '40px', borderBottom: '1px dotted #3a3a3a',
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)', cursor:'copy' }
                            }}
                            onClick={() => handleAddDialogOpen(dayIso, new Date(new Date(currentDayDate).setHours(hour,0,0)))} // Passa l'oggetto Date completo
                          >
                            <Typography variant="caption" sx={{ position: 'absolute', left: 2, top: 2, color: '#777', fontSize: '0.65rem' }}>
                              {`${hour.toString().padStart(2, '0')}:00`}
                            </Typography>
                          </Box>
                        ))}
                        {(calendarData[dayIso] || []).map((item, idx) => {
                          const [hours, minutes] = (item.startTime || '00:00:00').split(':').map(Number);
                          const topPosition = (hours * 40) + (minutes / 60 * 40);
                          const [dHours, dMinutes] = (item.duration || '00:05:00').split(':').map(Number);
                          const durationMinutesTotal = dHours * 60 + dMinutes;
                          const height = Math.max(20, durationMinutesTotal * (40 / 60));
                          let bgColor = item.type === 'MEDIA' ? '#4caf50' : item.type === 'TEMPLATE' ? '#ff9800' : '#2196f3';
                          if (item.type === 'MEDIA' && item.linkedTemplate) bgColor = '#c4a700';

                          return (
                            <Tooltip key={item.id || `${dayIso}-${idx}`} title={`${item.name} (${item.startTime} - ${calculateEndTime(item.startTime, item.duration)}) ${item.note ? 'Nota: '+item.note : ''}`}>
                              <Paper
                                sx={{ position: 'absolute', left: '5%', top: `${topPosition}px`, width: '90%', height: `${height}px`,
                                  p: 0.5, bgcolor: bgColor, color: 'white', cursor: 'pointer', zIndex: 2, overflow: 'hidden',
                                  boxShadow: 3, '&:hover': { zIndex: 3, boxShadow: 6, opacity:0.9 }, display:'flex', flexDirection:'column', justifyContent:'center'
                                }}
                                onClick={(e) => { e.stopPropagation(); handleEditDialogOpen({ day: dayIso, rundown: item }); }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuOpen(e, dayIso, item);}}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                  {item.name || 'Evento'}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                  {item.startTime.substring(0,5)} - {item.type} {item.type === 'MEDIA' && item.linkedTemplate ? `+T` : ''}
                                </Typography>
                              </Paper>
                            </Tooltip>
                          );
                        })}
                        {dayIso === new Date().toISOString().split('T')[0] && (() => {
                            const now = new Date();
                            const currentHour = now.getHours();
                            const currentMinute = now.getMinutes();
                            const topPos = (currentHour * 40) + (currentMinute / 60 * 40);
                            return ( <Box sx={{ position: 'absolute', left: 0, top: `${topPos}px`, width: '100%', height: '2px', backgroundColor: '#f44336', zIndex: 4}}/>);
                        })()}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {calendarView === 'day' && (
              <Box>
                 <Box sx={{ mt: 1, minHeight: '500px', position: 'relative', border: '1px solid #333', borderRadius: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
                    {Array.from({ length: 24 }).map((_, hour) => (
                        <Box key={hour}
                            sx={{ position: 'relative', height: '60px', borderBottom: '1px solid #333', '&:last-child': { borderBottom: 'none' },
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', cursor:'copy' }
                            }}
                             onClick={() => handleAddDialogOpen(calendarDate.toISOString().split('T')[0], new Date(new Date(calendarDate).setHours(hour,0,0)))}
                        >
                            <Typography variant="caption" sx={{ position: 'absolute', left: 5, top: 5, color: '#aaa', fontSize: '0.8rem' }}>
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </Typography>
                             <Box sx={{position: 'absolute', left: 0, top: '50%', width: '100%', borderBottom: '1px dashed #444'}}/>
                        </Box>
                    ))}
                    {(calendarData[calendarDate.toISOString().split('T')[0]] || []).map((item, idx) => {
                        const [hours, minutes] = (item.startTime || '00:00:00').split(':').map(Number);
                        const topPosition = (hours * 60 + minutes); // Altezza ora è 60px
                        const [dHours, dMinutes] = (item.duration || '00:05:00').split(':').map(Number);
                        const durationMinutesTotal = dHours * 60 + dMinutes;
                        const height = Math.max(30, durationMinutesTotal); // Altezza in minuti, 1px per minuto
                        let bgColor = item.type === 'MEDIA' ? '#4caf50' : item.type === 'TEMPLATE' ? '#ff9800' : '#2196f3';
                        if (item.type === 'MEDIA' && item.linkedTemplate) bgColor = '#c4a700';

                        return (
                            <Tooltip key={item.id || `${calendarDate.toISOString().split('T')[0]}-${idx}`} title={`${item.name} (${item.startTime} - ${calculateEndTime(item.startTime, item.duration)})`}>
                                <Paper
                                    sx={{ position: 'absolute', left: '10%', top: `${topPosition}px`, width: '85%', height: `${height}px`,
                                        p: 1, bgcolor: bgColor, color: 'white', cursor: 'pointer', zIndex: 2, overflow: 'hidden',
                                        boxShadow: 3, '&:hover': { zIndex: 3, boxShadow: 6, opacity: 0.9 }
                                    }}
                                    onClick={(e) => { e.stopPropagation(); handleEditDialogOpen({ day: calendarDate.toISOString().split('T')[0], rundown: item }); }}
                                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleMenuOpen(e, calendarDate.toISOString().split('T')[0], item);}}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name || 'Evento'}</Typography>
                                    <Typography variant="caption" display="block" sx={{fontSize:'0.75rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                        {item.startTime.substring(0,5)} - {item.type} {item.type === 'MEDIA' && item.linkedTemplate ? `+T` : ''}
                                    </Typography>
                                </Paper>
                            </Tooltip>
                        );
                    })}
                    {(() => {
                        const now = new Date();
                        if (now.toISOString().split('T')[0] === calendarDate.toISOString().split('T')[0]) {
                            const currentHour = now.getHours();
                            const currentMinute = now.getMinutes();
                            const topPos = (currentHour * 60) + currentMinute;
                            return ( <Box sx={{ position: 'absolute', left: 0, top: `${topPos}px`, width: '100%', height: '2px', backgroundColor: '#f44336', zIndex: 4}}/>);
                        }
                        return null;
                    })()}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        {selectedEvent && (
          <div>
            <MenuItem onClick={handleLoadRundownToMain} disabled={!connected}><ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon><ListItemText primary="Carica nel Rundown Attuale" /></MenuItem>
            <MenuItem onClick={handleExplodeRundownToMain} disabled={!connected || !(selectedEvent.rundown && selectedEvent.rundown.items && Array.isArray(selectedEvent.rundown.items))}>
              <ListItemIcon><PlaylistPlayIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Esplodi Scaletta nel Rundown" secondary="Scorporare gli elementi della scaletta" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleEditDialogOpen(selectedEvent)}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText primary="Modifica Evento" /></MenuItem>
            <MenuItem onClick={handleRemoveRundownFromMenu}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon><ListItemText primary="Rimuovi Evento" /></MenuItem>
          </div>
        )}
      </Menu>

      <Dialog open={addDialogOpen || editDialogOpen} onClose={editDialogOpen ? handleEditDialogClose : handleAddDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>{editDialogOpen ? 'Modifica Evento' : 'Aggiungi Evento'} al Calendario {selectedDay ? `per ${format(new Date(selectedDay + 'T00:00:00'), 'EEEE d MMM', {locale:it})}` : ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Tipo di Elemento</Typography>
            <ButtonGroup variant="outlined" color="primary" fullWidth>
              {['RUNDOWN', 'MEDIA', 'TEMPLATE'].map(type => (
                <Button key={type} variant={itemType === type ? 'contained' : 'outlined'} onClick={() => setItemType(type)}>{type}</Button>
              ))}
            </ButtonGroup>
          </Box>

          <TextField autoFocus margin="dense" label="Nome Evento/Elemento" fullWidth variant="outlined" value={rundownName} onChange={(e) => setRundownName(e.target.value)} sx={{ mb: 2 }}/>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField margin="dense" label={itemType === 'RUNDOWN' ? "File Rundown (.json)" : (itemType === 'MEDIA' ? "File Media" : "File Template")} fullWidth variant="outlined" value={rundownPath}
             InputProps={{
                readOnly: itemType !== 'RUNDOWN', // Solo RUNDOWN è editabile direttamente qui
             }}
             // onChange={(e) => itemType === 'RUNDOWN' && setRundownPath(e.target.value)} // Permetti modifica solo per RUNDOWN
            />
            {itemType === 'RUNDOWN' && <Button variant="outlined" onClick={handleSelectRundownFile}>Sfoglia Locale</Button>}
            {itemType === 'MEDIA' && <Button variant="outlined" onClick={handleSelectMediaFile}>Sfoglia Server Media</Button>}
            {itemType === 'TEMPLATE' && <Button variant="outlined" onClick={handleSelectTemplateFile}>Sfoglia Server Template</Button>}
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Programmazione</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="Orario Inizio" fullWidth variant="outlined" value={rundownStartTime} onChange={(e) => setRundownStartTime(e.target.value)} placeholder="HH:MM:SS" /></Grid>
            <Grid item xs={6}><TextField label="Durata" fullWidth variant="outlined" value={rundownDuration} onChange={(e) => setRundownDuration(e.target.value)} placeholder="HH:MM:SS" /></Grid>
            <Grid item xs={6}><TextField label="Punto IN" fullWidth variant="outlined" value={rundownInPoint} onChange={(e) => setRundownInPoint(e.target.value)} placeholder="HH:MM:SS" /></Grid>
            <Grid item xs={6}><TextField label="Punto OUT" fullWidth variant="outlined" value={rundownOutPoint} onChange={(e) => setRundownOutPoint(e.target.value)} placeholder="HH:MM:SS" /></Grid>
          </Grid>

          {(itemType === 'MEDIA' || itemType === 'TEMPLATE') && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Impostazioni Riproduzione CasparCG</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} md={itemType === 'TEMPLATE' ? 4:6}><TextField label="Canale" type="number" fullWidth variant="outlined" value={itemChannel} onChange={(e) => setItemChannel(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} /></Grid>
                <Grid item xs={6} md={itemType === 'TEMPLATE' ? 4:6}><TextField label="Layer" type="number" fullWidth variant="outlined" value={itemLayer} onChange={(e) => setItemLayer(parseInt(e.target.value) || (itemType === 'TEMPLATE' ? 20 : 10))} InputProps={{ inputProps: { min: 1 } }} /></Grid>
                {itemType === 'TEMPLATE' && (
                    <Grid item xs={12} md={4}><TextField label="CG Layer" type="number" fullWidth variant="outlined" value={itemCgLayer} onChange={(e) => setItemCgLayer(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} /></Grid>
                )}
              </Grid>
            </>
          )}

          {itemType === 'MEDIA' && (<FormControlLabel control={<Checkbox checked={itemLoop} onChange={(e) => setItemLoop(e.target.checked)}/>} label="Loop Media" sx={{mt:1}}/>)}
          {itemType === 'TEMPLATE' && (<FormControlLabel control={<Checkbox checked={mainTemplatePlayOnLoad} onChange={(e) => setMainTemplatePlayOnLoad(e.target.checked)}/>} label="Play Template on Load" sx={{mt:1}}/>)}


          {itemType === 'TEMPLATE' && (
            <Box sx={{ mt: 2, p:1, border:'1px dashed grey', borderRadius:1}}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Dati per "{rundownPath.split('/').pop()}" (Tipo: {currentMainTemplateType})</Typography>
              {currentMainTemplateType === 'ticker' && (<TextField label="Testo Ticker" fullWidth margin="dense" value={mainTemplateFieldText} onChange={(e) => setMainTemplateFieldText(e.target.value)} multiline rows={2}/>)}
              {currentMainTemplateType === 'lower_third' && (<><TextField label="Titolo" fullWidth margin="dense" value={mainTemplateFieldTitle} onChange={(e) => setMainTemplateFieldTitle(e.target.value)}/><TextField label="Sottotitolo" fullWidth margin="dense" value={mainTemplateFieldSubtitle} onChange={(e) => setMainTemplateFieldSubtitle(e.target.value)}/></>)}
              {currentMainTemplateType === 'logo' && (<TextField label="Testo/ID Logo" fullWidth margin="dense" value={mainTemplateFieldText} onChange={(e) => setMainTemplateFieldText(e.target.value)}/>)}
              {currentMainTemplateType === 'text' && (<TextField label="Testo Generico" fullWidth margin="dense" value={mainTemplateFieldText} onChange={(e) => setMainTemplateFieldText(e.target.value)} multiline rows={3}/>)}
              {currentMainTemplateType === 'generic' && (<TextField label="Dati Template (JSON)" fullWidth margin="dense" multiline rows={3} value={itemDataJson} onChange={(e) => setItemDataJson(e.target.value)} placeholder='{"f0":"Valore"}'/>)}
            </Box>
          )}

          {itemType === 'MEDIA' && (
            <Box sx={{ mt: 3, p:2, border:'1px solid #555', borderRadius:1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.light' }}>Template Annidato (Opzionale)</Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth margin="dense">
                <InputLabel>File Template Annidato</InputLabel>
                <Select value={linkedTemplateFile} onChange={(e) => setLinkedTemplateFile(e.target.value)} label="File Template Annidato">
                  <MenuItem value=""><em>Nessuno</em></MenuItem>
                  {templateList.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                </Select>
              </FormControl>
              {linkedTemplateFile && (
                <Grid container spacing={2} sx={{mt:1}}>
                  <Grid item xs={6} md={3}><TextField label="Layer T.A." type="number" fullWidth value={linkedTemplateGeneralLayer} onChange={(e) => setLinkedTemplateGeneralLayer(parseInt(e.target.value) || 20)} InputProps={{ inputProps: { min: 1 } }} helperText="Generale"/></Grid>
                  <Grid item xs={6} md={3}><TextField label="CG Layer T.A." type="number" fullWidth value={linkedTemplateCgLayer} onChange={(e) => setLinkedTemplateCgLayer(parseInt(e.target.value) || 1)} InputProps={{ inputProps: { min: 1 } }} helperText="Grafico"/></Grid>
                  <Grid item xs={6} md={3}><TextField label="Delay T.A. (ms)" type="number" fullWidth value={linkedTemplateDelay} onChange={(e) => setLinkedTemplateDelay(parseInt(e.target.value) || 0)} InputProps={{ inputProps: { min: 0 } }}/></Grid>
                  <Grid item xs={6} md={3} sx={{display:'flex', alignItems:'center'}}><FormControlLabel control={<Checkbox checked={linkedTemplatePlayOnLoad} onChange={(e) => setLinkedTemplatePlayOnLoad(e.target.checked)}/>} label="Play T.A."/></Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ mb: 1 }}>Dati per "{linkedTemplateFile.split('/').pop()}" (Tipo: {currentLinkedTemplateType})</Typography>
                    {currentLinkedTemplateType === 'ticker' && (<TextField label="Testo Ticker Ann." fullWidth margin="dense" value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)} multiline rows={2}/>)}
                    {currentLinkedTemplateType === 'lower_third' && (<><TextField label="Titolo Ann." fullWidth margin="dense" value={linkedTemplateFieldTitle} onChange={(e) => setLinkedTemplateFieldTitle(e.target.value)}/><TextField label="Sottotitolo Ann." fullWidth margin="dense" value={linkedTemplateFieldSubtitle} onChange={(e) => setLinkedTemplateFieldSubtitle(e.target.value)}/></>)}
                    {currentLinkedTemplateType === 'logo' && (<TextField label="Testo/ID Logo Ann." fullWidth margin="dense" value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)}/>)}
                    {currentLinkedTemplateType === 'text' && (<TextField label="Testo Generico Ann." fullWidth margin="dense" value={linkedTemplateFieldText} onChange={(e) => setLinkedTemplateFieldText(e.target.value)} multiline rows={3}/>)}
                    {currentLinkedTemplateType === 'generic' && (<TextField label="Dati T.A. (JSON)" fullWidth margin="dense" multiline rows={3} value={linkedTemplateDataJson} onChange={(e) => setLinkedTemplateDataJson(e.target.value)} placeholder='{"f0":"Valore"}'/>)}
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
          <TextField margin="dense" label="Note Aggiuntive" fullWidth variant="outlined" value={rundownNote} onChange={(e) => setRundownNote(e.target.value)} multiline rows={2} sx={{ mt: 3 }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={editDialogOpen ? handleEditDialogClose : handleAddDialogClose}>Annulla</Button>
          <Button onClick={handleSaveEvent} variant="contained" color="primary">{editDialogOpen ? 'Salva Modifiche' : 'Aggiungi Evento'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={mediaSelectorOpen} onClose={() => setMediaSelectorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Seleziona Media da Server CasparCG</DialogTitle>
        <DialogContent sx={{minHeight:'300px', maxHeight:'50vh', overflowY:'auto'}}>
          {mediaList.length > 0 ? <List>{mediaList.map((media) => {
            const mediaName = typeof media === 'string' ? media : (media?.name || media?.path || 'Media sconosciuto');
            const mediaPath = typeof media === 'string' ? media : (media?.path || media?.name || media);
            const displayName = typeof media === 'string' ? media.split('.')[0] : (media?.name ? media.name.split('.')[0] : 'Media');
            return (<ListItem key={mediaName} onClick={() => { setRundownPath(mediaPath); setRundownName(displayName); setMediaSelectorOpen(false);}} sx={{cursor:'pointer', '&:hover':{backgroundColor:'rgba(255,255,255,0.08)'}}}><ListItemText primary={mediaName} /></ListItem>);
          })}</List> : <Typography>Nessun media trovato o non connesso.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setMediaSelectorOpen(false)}>Annulla</Button></DialogActions>
      </Dialog>

      <Dialog open={templateSelectorOpen} onClose={() => setTemplateSelectorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Seleziona Template da Server CasparCG</DialogTitle>
        <DialogContent sx={{minHeight:'300px', maxHeight:'50vh', overflowY:'auto'}}>
         {templateList.length > 0 ? <List>{templateList.map((template) => {
            const templateName = typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto');
            const templatePath = typeof template === 'string' ? template : (template?.path || template?.name || template);
            const displayName = typeof template === 'string' ? template.split('.')[0] : (template?.name ? template.name.split('.')[0] : 'Template');
            return (<ListItem key={templateName} onClick={() => { setRundownPath(templatePath); setRundownName(displayName); setTemplateSelectorOpen(false);}} sx={{cursor:'pointer', '&:hover':{backgroundColor:'rgba(255,255,255,0.08)'}}}><ListItemText primary={templateName} /></ListItem>);
          })}</List> : <Typography>Nessun template trovato o non connesso.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setTemplateSelectorOpen(false)}>Annulla</Button></DialogActions>
      </Dialog>

      {/* Dialogo di anteprima per l'esplosione degli elementi */}
      <ExplodePreviewDialog
        open={explodePreviewOpen}
        onClose={() => setExplodePreviewOpen(false)}
        items={itemsToExplode}
        onConfirm={handleConfirmExplode}
        scalettaName={explodeSource.scalettaName}
        day={explodeSource.day}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

// Funzioni helper per la gestione della settimana
const startOfWeek = (date, options) => {
  const d = new Date(date);
  const day = d.getDay();
  // weekStartsOn: 1 (Lunedì)
  const diff = d.getDate() - day + (options.weekStartsOn === 1 ? (day === 0 ? -6 : 1) : 0);
  return new Date(d.setDate(diff));
};

const endOfWeek = (date, options) => {
  const d = new Date(startOfWeek(date, options));
  return new Date(d.setDate(d.getDate() + 6));
};


export default WeeklyCalendar;
