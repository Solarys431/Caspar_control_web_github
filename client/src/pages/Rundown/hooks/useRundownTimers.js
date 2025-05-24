import { useState, useEffect, useCallback } from 'react';
import { useRundown } from '../../../contexts/RundownContext';

/**
 * Hook personalizzato per gestire i timer e gli orari del rundown.
 * Gestisce il calcolo dei countdown, la formattazione degli orari e la gestione dei timer.
 */
const useRundownTimers = () => {
  const {
    items,
    currentTime,
    // setCurrentTime non utilizzato
    scheduledPlayback,
    playingItems,
    playItem,
    stopItem,
    prepareNextItem,
    calculateEndTime,
    addLog
  } = useRundown();

  // Stato per la posizione dell'indicatore di tempo
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(0);

  // Aggiorna l'ora corrente ogni secondo
  useEffect(() => {
    let timer;
    if (scheduledPlayback) {
      timer = setInterval(() => {
        const now = new Date();

        // Calcola la posizione dell'indicatore di tempo (percentuale della giornata)
        const totalSecondsInDay = 24 * 60 * 60;
        const secondsSinceMidnight =
          now.getHours() * 3600 +
          now.getMinutes() * 60 +
          now.getSeconds();

        const percentage = (secondsSinceMidnight / totalSecondsInDay) * 100;
        setTimeIndicatorPosition(percentage);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scheduledPlayback]);

  // Verifica se ci sono elementi da riprodurre in base all'orario
  useEffect(() => {
    if (!scheduledPlayback || !items.length) return;

    const checkScheduledItems = () => {
      const currentTimeString = currentTime.toTimeString().substring(0, 8); // HH:MM:SS

      items.forEach(item => {
        if (
          item.data.startTime &&
          item.data.startTime === currentTimeString &&
          !playingItems.includes(item.id)
        ) {
          // Riproduci l'elemento quando l'orario corrente corrisponde all'orario di inizio
          playItem(item);
        }
      });
    };

    checkScheduledItems();
  }, [currentTime, items, playingItems, playItem, scheduledPlayback]);

  // Verifica se ci sono elementi da fermare in base all'orario di fine
  useEffect(() => {
    if (!scheduledPlayback || !items.length) return;

    const checkItemsToStop = () => {
      const currentTimeString = currentTime.toTimeString().substring(0, 8); // HH:MM:SS

      items.forEach(item => {
        if (
          item.data.startTime &&
          item.data.duration &&
          playingItems.includes(item.id)
        ) {
          const endTime = calculateEndTime(item.data.startTime, item.data.duration);

          if (endTime === currentTimeString) {
            // Ferma l'elemento quando l'orario corrente corrisponde all'orario di fine
            stopItem(item);
          }
        }
      });
    };

    checkItemsToStop();
  }, [currentTime, items, playingItems, stopItem, scheduledPlayback, calculateEndTime]);

  // Gestione dell'auto-take quando scade il countdown
  useEffect(() => {
    if (!items.length) return;

    const timer = setInterval(() => {
      // Controlla tutti gli elementi in riproduzione
      items.filter(item => item.isPlaying && item.playingStartTime).forEach(item => {
        // Verifica se l'elemento ha punti IN e OUT definiti
        if (item.data.inPoint && item.data.outPoint) {
          // Calcola la differenza tra OUT e IN
          const [outHours, outMinutes, outSeconds] = item.data.outPoint.split(':').map(Number);
          const [inHours, inMinutes, inSeconds] = item.data.inPoint.split(':').map(Number);

          const outTotalSeconds = outHours * 3600 + outMinutes * 60 + outSeconds;
          const inTotalSeconds = inHours * 3600 + inMinutes * 60 + inSeconds;

          const totalDifferenceSeconds = outTotalSeconds - inTotalSeconds;

          // Calcola il tempo trascorso dalla riproduzione
          const now = new Date();
          const start = new Date(item.playingStartTime);
          const elapsedSeconds = Math.floor((now - start) / 1000);

          // Trova l'indice dell'elemento corrente
          const currentIndex = items.findIndex(i => i.id === item.id);

          // Precarica il prossimo elemento quando mancano pochi secondi alla fine
          const PRELOAD_THRESHOLD_SECONDS = 3; // Precarica quando mancano 3 secondi
          const remainingSeconds = totalDifferenceSeconds - elapsedSeconds;

          if (remainingSeconds <= PRELOAD_THRESHOLD_SECONDS &&
              remainingSeconds > 0 &&
              currentIndex >= 0 &&
              currentIndex < items.length - 1) {
            const nextItem = items[currentIndex + 1];
            if (nextItem.type === 'MEDIA') {
              if (typeof addLog === 'function') {
                addLog(`TIMER: Precaricamento del prossimo media "${nextItem.name}" (mancano ${remainingSeconds.toFixed(1)}s)`, 'debug');
              }
              prepareNextItem(nextItem);
            }
          }

          // Se abbiamo superato la differenza tra OUT e IN, esegui l'autotake
          if (elapsedSeconds >= totalDifferenceSeconds && totalDifferenceSeconds > 0) {
            if (typeof addLog === 'function') {
              addLog(`TIMER: Punto OUT raggiunto per ${item.data.customName || item.name}, eseguo autotake`, 'info');
            }

            // Per i template grafici, invia sempre il comando STOP
            if (item.type === 'TEMPLATE') {
              stopItem(item, true); // true = contesto autotake
              if (typeof addLog === 'function') {
                addLog(`TIMER: Template fermato: ${item.data.customName || item.name}`, 'info');
              }
            }

            // Se c'è un elemento successivo, riproducilo
            if (currentIndex >= 0 && currentIndex < items.length - 1) {
              const nextItem = items[currentIndex + 1];

              // Ferma l'elemento corrente se è un media (per i template è già fatto sopra)
              if (item.type === 'MEDIA') {
                stopItem(item, true); // true = contesto autotake
              }

              // Riproduci il prossimo elemento
              playItem(nextItem);
              if (typeof addLog === 'function') {
                addLog(`TIMER: Autotake: ${nextItem.data.customName || nextItem.name}`, 'info');
              }
            } else if (item.type !== 'TEMPLATE') {
              // Se non c'è un elemento successivo e non è un template (già fermato sopra), ferma l'elemento corrente
              stopItem(item, false); // false = non è un contesto autotake, è l'ultimo elemento
              if (typeof addLog === 'function') {
                addLog(`TIMER: Punto OUT raggiunto (ultimo elemento): ${item.data.customName || item.name}`, 'info');
              }
            }
          }
        }
      });
    }, 250); // Controlla più frequentemente per maggiore precisione

    return () => clearInterval(timer);
  }, [items, playItem, stopItem, prepareNextItem, addLog]);

  // Formatta il tempo di riproduzione
  const formatPlayingTime = useCallback((startTime) => {
    if (!startTime) return '00:00:00';

    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / 1000);

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calcola il countdown per un elemento
  const calculateCountdown = useCallback((item) => {
    if (!item.data.outPoint || !item.data.inPoint) return '';

    // Calcola la differenza tra OUT e IN
    const [outHours, outMinutes, outSeconds] = item.data.outPoint.split(':').map(Number);
    const [inHours, inMinutes, inSeconds] = item.data.inPoint.split(':').map(Number);

    const outTotalSeconds = outHours * 3600 + outMinutes * 60 + outSeconds;
    const inTotalSeconds = inHours * 3600 + inMinutes * 60 + inSeconds;

    let diffSeconds = outTotalSeconds - inTotalSeconds;

    // Se l'elemento è in riproduzione, calcola il countdown in base al tempo trascorso
    if (item.isPlaying && item.playingStartTime) {
      const now = new Date();
      const start = new Date(item.playingStartTime);
      const elapsedSeconds = Math.floor((now - start) / 1000);

      diffSeconds = Math.max(0, diffSeconds - elapsedSeconds);
    }

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calcola il tempo rimanente prima che un elemento vada in onda
  const calculateTimeToAir = useCallback((item) => {
    if (!item.data.startTime || !scheduledPlayback) return '';

    const [startHours, startMinutes, startSeconds] = item.data.startTime.split(':').map(Number);
    const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

    let diffSeconds = startTotalSeconds - currentTotalSeconds;

    // Se l'orario di inizio è già passato, considera il giorno successivo
    if (diffSeconds < 0) {
      diffSeconds += 24 * 3600;
    }

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [scheduledPlayback]);

  return {
    timeIndicatorPosition,
    formatPlayingTime,
    calculateCountdown,
    calculateTimeToAir
  };
};

export default useRundownTimers;
