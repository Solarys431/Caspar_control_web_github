import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { useCaspar } from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext'; // Hook principale per i dati del rundown
import { CalendarProvider } from '../../contexts/CalendarContext';
import WeeklyCalendar from '../../components/calendar/WeeklyCalendar';
import RundownHeader from './components/RundownHeader';
import RundownTabs from './components/RundownTabs';
import RundownTimeline from './components/RundownTimeline';
import RundownList from './components/RundownList';
import RundownDialogs from './components/RundownDialogs';
import RundownClock from './components/RundownClock';
// import RundownSettings from './components/RundownSettings'; // ESLint: 'RundownSettings' is defined but never used. Rimuovere se non utilizzato.
import useRundownNotifications from './hooks/useRundownNotifications';
// import useRundownTimers from './hooks/useRundownTimers'; // Rimuovere se le funzioni sottostanti non sono usate
import useRundownPlayback from './hooks/useRundownPlayback';
import useRundownDialogs from './hooks/useRundownDialogs';

/**
 * Componente principale del Rundown che orchestrerà gli altri componenti.
 * Gestisce lo stato principale e le funzioni di alto livello.
 */
const RundownPage = () => {
  // Hook per la connessione e i dati di CasparCG
  const {
    connected,
    mediaList,
    templateList,
    getMediaList,
    getTemplateList
  } = useCaspar();

  // Hook per i dati e le funzioni del Rundown
  // Chiamare useRundown() UNA SOLA VOLTA qui al top level
  const {
    items,
    rundownName,
    modified,
    // autoPlay, // ESLint: 'autoPlay' is assigned a value but never used.
    // currentPlayingIndex, // ESLint: 'currentPlayingIndex' is assigned a value but never used.
    playingItems,
    currentTime,
    scheduledPlayback,
    // dayStartTime, // ESLint: 'dayStartTime' is assigned a value but never used.
    timeIndicatorPosition,
    calculateEndTime,
    removeItem, // Estrarre removeItem per passarlo come prop
    updateItem  // Estrarre updateItem per passarlo come prop
  } = useRundown();

  // Stato per le tab (Rundown / Calendario)
  const [tabValue, setTabValue] = useState(0);

  // Stato per la visualizzazione della timeline
  const [timelineView, setTimelineView] = useState('24h'); // Valori possibili: '24h', '12h', '6h', '3h'
  const [timelineStartHour, setTimelineStartHour] = useState(0);

  // Gestione delle notifiche (Snackbar)
  const { snackbarOpen, snackbarMessage, snackbarSeverity, setSnackbarOpen, showNotification } = useRundownNotifications();

  // Gestione dei timer (se usati, altrimenti rimuovere)
  // const {
  //   formatPlayingTime, // ESLint: 'formatPlayingTime' is assigned a value but never used.
  //   calculateCountdown, // ESLint: 'calculateCountdown' is assigned a value but never used.
  //   calculateTimeToAir  // ESLint: 'calculateTimeToAir' is assigned a value but never used.
  // } = useRundownTimers();

  // Gestione della riproduzione
  const {
    // playItem, // ESLint: 'playItem' is assigned a value but never used.
    // stopItem, // ESLint: 'stopItem' is assigned a value but never used.
    playAll,
    stopAll
  } = useRundownPlayback();

  // Gestione dei dialoghi del rundown (aggiungi/modifica elementi)
  const dialogsState = useRundownDialogs();

  // Effetto per caricare le liste di media e template da CasparCG quando la connessione è attiva
  useEffect(() => {
    if (connected) {
      getMediaList();
      getTemplateList();
    }
  }, [connected, getMediaList, getTemplateList]);

  // Effetto per forzare la visualizzazione della timeline a 24h all'avvio
  useEffect(() => {
    setTimelineView('24h');
  }, []);

  // Gestore per il cambio di tab
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header del Rundown: nome, stato, controlli globali */}
      <RundownHeader
        rundownName={rundownName}
        modified={modified}
        scheduledPlayback={scheduledPlayback}
        items={items}
        connected={connected}
        showNotification={showNotification}
        dialogsState={dialogsState}
        playAll={playAll} // Passa la funzione playAll
        stopAll={stopAll} // Passa la funzione stopAll
      />

      {/* Tabs per navigare tra la vista Rundown e la vista Calendario */}
      <RundownTabs
        tabValue={tabValue}
        handleTabChange={handleTabChange}
      />

      {/* Contenuto della Tab Rundown (visibile se tabValue === 0) */}
      <div
        role="tabpanel"
        hidden={tabValue !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {tabValue === 0 && (
          <Box sx={{
            backgroundColor: '#2d2d2d', // Sfondo scuro per la sezione rundown
            minHeight: 400, // Altezza minima
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden' // Evita lo scroll orizzontale
          }}>
            {/* Sezione superiore: Orologio e Timeline */}
            <Box sx={{ display: 'flex', width: '100%' }}>
              {/* Orologio e controlli di riproduzione principali */}
              <RundownClock
                connected={connected}
                playAll={playAll}
                stopAll={stopAll}
              />

              {/* Timeline visuale degli eventi */}
              <Box sx={{ flexGrow: 1 }}> {/* Occupa lo spazio rimanente */}
                <RundownTimeline
                  timelineView={timelineView}
                  setTimelineView={setTimelineView}
                  timelineStartHour={timelineStartHour}
                  setTimelineStartHour={setTimelineStartHour}
                  currentTime={currentTime}
                  scheduledPlayback={scheduledPlayback}
                  items={items}
                  calculateEndTime={calculateEndTime}
                  timeIndicatorPosition={timeIndicatorPosition}
                />
              </Box>
            </Box>

            {/* Lista degli elementi del rundown */}
            <RundownList
              items={items}
              playingItems={playingItems}
              currentTime={currentTime}
              scheduledPlayback={scheduledPlayback}
              connected={connected}
              showNotification={showNotification}
              dialogsState={dialogsState}
              removeItem={removeItem} // CORREZIONE: Passa la funzione removeItem ottenuta da useRundown()
              updateItem={updateItem} // CORREZIONE: Passa la funzione updateItem ottenuta da useRundown()
            />
          </Box>
        )}
      </div>

      {/* Contenuto della Tab Calendario (visibile se tabValue === 1) */}
      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {tabValue === 1 && (
          <WeeklyCalendar />
        )}
      </div>

      {/* Dialoghi utilizzati nel rundown (es. per aggiungere/modificare elementi) */}
      <RundownDialogs
        mediaList={mediaList}
        templateList={templateList}
        connected={connected}
        showNotification={showNotification}
        dialogsState={dialogsState}
      />

      {/* Snackbar per mostrare notifiche all'utente */}
      <Snackbar
        open={snackbarOpen && snackbarMessage && !snackbarMessage.startsWith('Aggiornamento timer:')} // Non mostrare per i messaggi di aggiornamento timer
        autoHideDuration={3000} // Nascondi dopo 3 secondi
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Posizione
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity} // Tipo di alert (success, error, warning, info)
          variant="filled" // Stile dell'alert
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RundownPage;
