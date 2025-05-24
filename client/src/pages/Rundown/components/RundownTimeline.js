import React from 'react';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
// import { useRundown } from '../../../contexts/RundownContext'; // Non utilizzato
import useRundownDialogs from '../hooks/useRundownDialogs';

/**
 * Componente per la visualizzazione della timeline con fasce orarie e indicatore di tempo.
 */
const RundownTimeline = ({
  timelineView,
  setTimelineView,
  timelineStartHour,
  setTimelineStartHour,
  timeIndicatorPosition,
  currentTime,
  scheduledPlayback,
  items,
  calculateEndTime
}) => {
  const { handleEditItemDialogOpen } = useRundownDialogs();
  return (
    <>
      {/* Controlli della timeline */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        p: 1,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        width: '100%'
      }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          Visualizzazione:
        </Typography>

        <ToggleButtonGroup
          value={timelineView}
          exclusive
          onChange={(_, newValue) => {
            if (newValue) {
              setTimelineView(newValue);
            }
          }}
          size="small"
          sx={{ mr: 2 }}
        >
          <ToggleButton value="3h">3h</ToggleButton>
          <ToggleButton value="6h">6h</ToggleButton>
          <ToggleButton value="12h">12h</ToggleButton>
          <ToggleButton value="24h" sx={{ fontWeight: timelineView === '24h' ? 'bold' : 'normal' }}>24h</ToggleButton>
        </ToggleButtonGroup>

        {timelineView !== '24h' && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ mr: 1 }}>
              Ora inizio:
            </Typography>
            <Select
              value={timelineStartHour}
              onChange={(e) => setTimelineStartHour(e.target.value)}
              size="small"
              sx={{ minWidth: 80 }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {`${i.toString().padStart(2, '0')}:00`}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </Box>

      {/* Timeline giornaliera con indicatore di tempo corrente */}
      <Box sx={{
        position: 'relative',
        height: '30px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        m: 0,
        px: 0
      }}>
        {/* Ore della giornata */}
        {(() => {
          if (timelineView === '24h') {
            // Per la visualizzazione 24h, generiamo esattamente 24 etichette (da 0 a 23)
            return Array.from({ length: 24 }, (_, i) => {
              return (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    // Posizionamento speciale per la prima etichetta (00:00) per evitare che venga tagliata
                    left: i === 0
                      ? '5px' // Margine fisso per la prima etichetta
                      : i === 23
                        ? `calc(${(i / 24) * 100}% - 20px)` // Margine maggiore per l'ultima etichetta
                        : `calc(${(i / 24) * 100}% - 10px)`, // Centrato per le altre etichette
                    height: '100%',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    width: 20, // Aumentato per dare più spazio al testo
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold', // Reso più visibile
                    color: 'rgba(255, 255, 255, 0.8)', // Aumentato ulteriormente il contrasto
                    zIndex: 5
                  }}
                >
                  {`${i.toString().padStart(2, '0')}:00`}
                </Box>
              );
            });
          } else {
            // Per le altre visualizzazioni, manteniamo il codice esistente
            let hoursToShow = 24;
            let startHour = 0;

            if (timelineView === '12h') {
              hoursToShow = 12;
              startHour = timelineStartHour;
            } else if (timelineView === '6h') {
              hoursToShow = 6;
              startHour = timelineStartHour;
            } else if (timelineView === '3h') {
              hoursToShow = 3;
              startHour = timelineStartHour;
            }

            return Array.from({ length: hoursToShow }, (_, i) => {
              const hour = (startHour + i) % 24;
              return (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    // Posizionamento speciale per la prima etichetta per evitare che venga tagliata
                    left: i === 0
                      ? '5px' // Margine fisso per la prima etichetta
                      : i === hoursToShow - 1
                        ? `calc(${(i / hoursToShow) * 100}% - 20px)` // Margine maggiore per l'ultima etichetta
                        : `calc(${(i / hoursToShow) * 100}% - 10px)`, // Centrato per le altre etichette
                    height: '100%',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    width: 20, // Aumentato per dare più spazio al testo
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold', // Reso più visibile
                    color: 'rgba(255, 255, 255, 0.8)', // Aumentato ulteriormente il contrasto
                    zIndex: 5
                  }}
                >
                  {`${hour.toString().padStart(2, '0')}:00`}
                </Box>
              );
            });
          }
        })()}

        {/* Indicatore di tempo corrente */}
        {(() => {
          // Calcola la posizione dell'indicatore di tempo in base alla visualizzazione corrente
          let position;
          const currentTimeString = currentTime.toTimeString().substring(0, 8); // HH:MM:SS

          if (timelineView === '24h') {
            position = timeIndicatorPosition;
          } else {
            // Calcola la posizione relativa all'intervallo di visualizzazione
            const [hours, minutes, seconds] = currentTimeString.split(':').map(Number);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;

            let viewHours = 24;
            if (timelineView === '12h') viewHours = 12;
            else if (timelineView === '6h') viewHours = 6;
            else if (timelineView === '3h') viewHours = 3;

            const startSeconds = timelineStartHour * 3600;
            const endSeconds = startSeconds + (viewHours * 3600);

            // Se il tempo è fuori dall'intervallo di visualizzazione, nascondi l'indicatore
            if (totalSeconds < startSeconds || totalSeconds > endSeconds) {
              return null;
            }

            // Calcola la percentuale all'interno dell'intervallo di visualizzazione
            position = ((totalSeconds - startSeconds) / (viewHours * 3600)) * 100;
          }

          return (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: 0,
                  width: '3px', // Aumentato da 2px a 3px
                  height: '100%',
                  backgroundColor: '#ff5722',
                  boxShadow: '0 0 8px #ff5722', // Aumentato l'effetto glow
                  zIndex: 10,
                  '&::before': { // Aggiunto un elemento decorativo per aumentare la visibilità
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#ff5722',
                    boxShadow: '0 0 8px #ff5722'
                  },
                  '&::after': { // Aggiunto un elemento decorativo per aumentare la visibilità
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#ff5722',
                    boxShadow: '0 0 8px #ff5722'
                  }
                }}
              />

              {/* Etichetta dell'ora corrente */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `calc(${position}% - 20px)`,
                  bottom: '100%',
                  backgroundColor: '#ff5722',
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: '2px 2px 0 0',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  zIndex: 10,
                  display: scheduledPlayback ? 'block' : 'none'
                }}
              >
                {currentTime.toTimeString().substring(0, 5)}
              </Box>
            </>
          );
        })()}

        {/* Visualizzazione degli elementi pianificati sulla timeline */}
        {scheduledPlayback && items.map((item) => {
          if (!item.data.startTime || !item.data.duration) return null;

          // Calcola la posizione e la larghezza dell'elemento sulla timeline
          const [startHours, startMinutes, startSeconds] = item.data.startTime.split(':').map(Number);
          const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;

          // Calcola la durata in secondi
          const [durationHours, durationMinutes, durationSeconds] = item.data.duration.split(':').map(Number);
          const durationTotalSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds;

          // Determina la visualizzazione corrente
          let viewHours = 24;
          let startHour = 0;

          if (timelineView === '12h') {
            viewHours = 12;
            startHour = timelineStartHour;
          } else if (timelineView === '6h') {
            viewHours = 6;
            startHour = timelineStartHour;
          } else if (timelineView === '3h') {
            viewHours = 3;
            startHour = timelineStartHour;
          }

          // Calcola l'intervallo di visualizzazione in secondi
          const viewStartSeconds = startHour * 3600;
          const viewEndSeconds = viewStartSeconds + (viewHours * 3600);

          // Verifica se l'elemento è visibile nell'intervallo corrente
          const elementEndSeconds = startTotalSeconds + durationTotalSeconds;
          if (elementEndSeconds < viewStartSeconds || startTotalSeconds > viewEndSeconds) {
            return null; // L'elemento non è visibile nell'intervallo corrente
          }

          // Calcola la posizione di inizio relativa all'intervallo di visualizzazione
          let startPosition = ((startTotalSeconds - viewStartSeconds) / (viewHours * 3600)) * 100;
          if (startPosition < 0) startPosition = 0;

          // Calcola la larghezza relativa all'intervallo di visualizzazione
          let visibleDuration = durationTotalSeconds;
          if (startTotalSeconds < viewStartSeconds) {
            // L'elemento inizia prima dell'intervallo visibile
            visibleDuration = elementEndSeconds - viewStartSeconds;
          }
          if (elementEndSeconds > viewEndSeconds) {
            // L'elemento finisce dopo l'intervallo visibile
            visibleDuration = viewEndSeconds - Math.max(startTotalSeconds, viewStartSeconds);
          }

          const widthPercentage = (visibleDuration / (viewHours * 3600)) * 100;

          return (
            <Tooltip
              key={`timeline-${item.id}`}
              title={`${item.data.customName || item.name} (${item.data.startTime} - ${calculateEndTime(item.data.startTime, item.data.duration)})`}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${startPosition}%`,
                  top: '5px',
                  height: '20px',
                  width: `${Math.max(0.5, widthPercentage)}%`,
                  backgroundColor: item.isPlaying
                    ? (item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(33, 150, 243, 0.9)')
                    : (item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.7)' : 'rgba(33, 150, 243, 0.7)'),
                  borderRadius: '2px',
                  zIndex: item.isPlaying ? 6 : 5,
                  cursor: 'pointer',
                  border: item.isPlaying ? '1px solid white' : 'none',
                  boxShadow: item.isPlaying ? '0 0 4px rgba(255, 255, 255, 0.5)' : 'none',
                  '&:hover': {
                    backgroundColor: item.type === 'MEDIA' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(33, 150, 243, 0.9)',
                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)'
                  }
                }}
                onClick={() => handleEditItemDialogOpen(item.id)}
              />
            </Tooltip>
          );
        })}
      </Box>
    </>
  );
};

export default RundownTimeline;
