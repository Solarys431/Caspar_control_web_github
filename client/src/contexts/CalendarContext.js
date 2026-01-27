import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRundown } from './RundownContext';

// Crea il context
const CalendarContext = createContext();

// Hook personalizzato per utilizzare il context
export const useCalendar = () => useContext(CalendarContext);

// Provider del context
export const CalendarProvider = ({ children }) => {
  // eslint-disable-next-line no-unused-vars
  const { saveRundown, loadRundown } = useRundown();

  // Struttura dati per il calendario: un oggetto con le date come chiavi (formato ISO)
  // e array di rundown pianificati come valori
  // Stato per i dati del calendario
  const [calendarData, setCalendarData] = useState(() => {
    // Tenta di caricare i dati dal localStorage
    const savedData = localStorage.getItem('calendarData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);

        // Verifica se i dati sono nel vecchio formato (giorni della settimana)
        // Se sì, li convertiamo nel nuovo formato (date ISO)
        if (parsedData.monday !== undefined) {
          console.log('Conversione dal vecchio formato al nuovo formato del calendario');

          // Creiamo un nuovo oggetto con le date della settimana corrente
          const newData = {};
          const today = new Date();
          const currentDay = today.getDay(); // 0 = domenica, 1 = lunedì, ecc.

          // Calcoliamo la data di lunedì di questa settimana
          const mondayDate = new Date(today);
          mondayDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

          // Creiamo le date per ogni giorno della settimana
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach((day, index) => {
            const date = new Date(mondayDate);
            date.setDate(mondayDate.getDate() + index);
            const isoDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD

            // Copiamo i dati dal vecchio formato al nuovo
            if (Array.isArray(parsedData[day])) {
              newData[isoDate] = parsedData[day];
            } else {
              newData[isoDate] = [];
            }
          });

          return newData;
        }

        return parsedData;
      } catch (error) {
        console.error('Errore nel parsing dei dati del calendario dal localStorage:', error);
      }
    }

    // Struttura di default se non ci sono dati salvati
    // Creiamo un oggetto con le date della settimana corrente
    const defaultData = {};
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domenica, 1 = lunedì, ecc.

    // Calcoliamo la data di lunedì di questa settimana
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    // Creiamo le date per ogni giorno della settimana
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      const isoDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      defaultData[isoDate] = [];
    }

    return defaultData;
  });

  // Struttura dati per la playlist/rundown con orari precisi
  const [playlistData, setPlaylistData] = useState([]);

  // Stato per tenere traccia delle modifiche
  const [modified, setModified] = useState(false);

  // Effetto per salvare i dati del calendario nel localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    setModified(true);
  }, [calendarData]);

  // Aggiunge un rundown a un giorno specifico con orario preciso
  const addRundownToDay = useCallback((day, rundown) => {
    // Assicuriamoci che il rundown abbia i campi necessari per la pianificazione
    const enhancedRundown = {
      ...rundown,
      startTime: rundown.startTime || '00:00:00',
      duration: rundown.duration || '00:05:00',
      endTime: rundown.endTime || calculateEndTime(rundown.startTime || '00:00:00', rundown.duration || '00:05:00')
    };

    setCalendarData(prevData => {
      // Verifichiamo che prevData[day] sia un array, altrimenti creiamo un nuovo array
      const currentDayData = Array.isArray(prevData[day]) ? prevData[day] : [];

      return {
        ...prevData,
        [day]: [...currentDayData, enhancedRundown]
      };
    });

    // Aggiungiamo anche alla playlist se non è già presente
    setPlaylistData(prevPlaylist => {
      // Verifichiamo se l'elemento è già presente nella playlist
      const exists = prevPlaylist.some(item => item.id === enhancedRundown.id);
      if (!exists) {
        return [...prevPlaylist, {
          ...enhancedRundown,
          day,
          scheduled: true
        }];
      }
      return prevPlaylist;
    });
  }, []);

  // Funzione per calcolare l'orario di fine in base all'orario di inizio e alla durata
  const calculateEndTime = (startTime, duration) => {
    try {
      // Convertiamo l'orario di inizio in secondi
      const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
      const startTotalSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;

      // Convertiamo la durata in secondi
      const [durationHours, durationMinutes, durationSeconds] = duration.split(':').map(Number);
      const durationTotalSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds;

      // Calcoliamo l'orario di fine in secondi
      const endTotalSeconds = startTotalSeconds + durationTotalSeconds;

      // Convertiamo l'orario di fine in formato HH:MM:SS
      const endHours = Math.floor(endTotalSeconds / 3600);
      const endMinutes = Math.floor((endTotalSeconds % 3600) / 60);
      const endSeconds = endTotalSeconds % 60;

      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Errore nel calcolo dell\'orario di fine:', error);
      return '00:05:00'; // Valore predefinito in caso di errore
    }
  };

  // Rimuove un rundown da un giorno specifico
  const removeRundownFromDay = useCallback((day, rundownId) => {
    setCalendarData(prevData => {
      // Verifichiamo che prevData[day] sia un array, altrimenti ritorniamo i dati invariati
      if (!Array.isArray(prevData[day])) {
        return prevData;
      }

      return {
        ...prevData,
        [day]: prevData[day].filter(item => item.id !== rundownId)
      };
    });
  }, []);

  // Sposta un rundown da un giorno all'altro
  const moveRundown = useCallback((fromDay, toDay, rundownId) => {
    setCalendarData(prevData => {
      // Verifichiamo che prevData[fromDay] sia un array
      if (!Array.isArray(prevData[fromDay])) {
        return prevData;
      }

      const rundown = prevData[fromDay].find(item => item.id === rundownId);
      if (!rundown) return prevData;

      // Verifichiamo che prevData[toDay] sia un array, altrimenti creiamo un nuovo array
      const toDayData = Array.isArray(prevData[toDay]) ? prevData[toDay] : [];

      return {
        ...prevData,
        [fromDay]: prevData[fromDay].filter(item => item.id !== rundownId),
        [toDay]: [...toDayData, rundown]
      };
    });
  }, []);

  // Aggiorna un rundown in un giorno specifico
  const updateRundownInDay = useCallback((day, rundownId, updatedRundown) => {
    setCalendarData(prevData => {
      // Verifichiamo che prevData[day] sia un array, altrimenti ritorniamo i dati invariati
      if (!Array.isArray(prevData[day])) {
        return prevData;
      }

      return {
        ...prevData,
        [day]: prevData[day].map(item =>
          item.id === rundownId ? { ...item, ...updatedRundown } : item
        )
      };
    });
  }, []);

  // Salva il calendario come file JSON
  const saveCalendarToFile = useCallback(async () => {
    try {
      // Salva anche nel localStorage
      localStorage.setItem('calendarData', JSON.stringify(calendarData));

      const response = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarData),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Calendario salvato con successo:', result);
      return result;
    } catch (error) {
      console.error('Errore durante il salvataggio del calendario:', error);
      throw error;
    }
  }, [calendarData]);

  // Carica il calendario da un file JSON
  const loadCalendarFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setCalendarData(data);
          setModified(false);
        } catch (error) {
          console.error('Errore nel parsing del file:', error);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, []);

  // Pulisce il calendario
  const clearCalendar = useCallback(() => {
    // Creiamo un nuovo oggetto con le date della settimana corrente, ma con array vuoti
    const defaultData = {};
    const today = new Date();
    const currentDay = today.getDay(); // 0 = domenica, 1 = lunedì, ecc.

    // Calcoliamo la data di lunedì di questa settimana
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    // Creiamo le date per ogni giorno della settimana
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + i);
      const isoDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      defaultData[isoDate] = [];
    }

    setCalendarData(defaultData);
    setModified(false);
  }, []);

  // Aggiunge un elemento alla playlist
  const addRundownToPlaylist = useCallback((rundown) => {
    setPlaylistData(prevPlaylist => {
      // Verifichiamo se l'elemento è già presente nella playlist
      const exists = prevPlaylist.some(existingItem => existingItem.id === rundown.id);
      if (!exists) {
        return [...prevPlaylist, rundown];
      }
      return prevPlaylist;
    });
  }, []);

  // Rimuove un elemento dalla playlist
  const removeRundownFromPlaylist = useCallback((rundownId) => {
    setPlaylistData(prevPlaylist => prevPlaylist.filter(item => item.id !== rundownId));
  }, []);

  // Aggiorna un elemento nella playlist
  const updateRundownInPlaylist = useCallback((rundownId, updatedData) => {
    setPlaylistData(prevPlaylist => {
      return prevPlaylist.map(item => {
        if (item.id === rundownId) {
          const updatedItem = { ...item, ...updatedData };

          // Aggiorna anche l'orario di fine se necessario
          if (updatedData.startTime || updatedData.duration) {
            updatedItem.endTime = calculateEndTime(
              updatedData.startTime || item.startTime,
              updatedData.duration || item.duration
            );
          }

          return updatedItem;
        }
        return item;
      });
    });

    // Se l'elemento è pianificato, aggiorniamo anche il calendario
    if (updatedData.day && updatedData.scheduled) {
      setCalendarData(prevCalendar => {
        // Rimuoviamo l'elemento da tutti i giorni
        const newCalendar = Object.keys(prevCalendar).reduce((acc, day) => {
          if (Array.isArray(prevCalendar[day])) {
            acc[day] = prevCalendar[day].filter(item => item.id !== rundownId);
          } else {
            acc[day] = [];
          }
          return acc;
        }, {...prevCalendar});

        // Aggiungiamo l'elemento aggiornato al giorno specificato
        const itemToUpdate = playlistData.find(item => item.id === rundownId);
        if (itemToUpdate) {
          const updatedItem = {
            ...itemToUpdate,
            ...updatedData,
            endTime: calculateEndTime(
              updatedData.startTime || itemToUpdate.startTime,
              updatedData.duration || itemToUpdate.duration
            )
          };
          newCalendar[updatedData.day] = [...newCalendar[updatedData.day], updatedItem];
        }

        return newCalendar;
      });
    }
  }, [playlistData]);

  // Pulisce la playlist
  const clearPlaylist = useCallback(() => {
    setPlaylistData([]);
  }, []);

  // Carica la playlist da un file JSON
  const loadPlaylistFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setPlaylistData(data);
        } catch (error) {
          console.error('Errore nel parsing del file:', error);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, []);

  // Salva la playlist come file JSON
  const savePlaylistToFile = useCallback(() => {
    const data = JSON.stringify(playlistData);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.json';
    a.click();
  }, [playlistData]);

  // Carica la playlist da una stringa JSON
  const loadPlaylistFromJson = useCallback((json) => {
    try {
      const data = JSON.parse(json);
      setPlaylistData(data);
    } catch (error) {
      console.error('Errore nel parsing del file:', error);
    }
  }, []);

  // Carica la playlist dal server
  const loadPlaylistFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/playlist/load');
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      const data = await response.json();
      setPlaylistData(data);
    } catch (error) {
      console.error('Errore durante il caricamento della playlist:', error);
    }
  }, []);

  // Seleziona un rundown
  const setSelectedRundown = useCallback((rundownId) => {
    const selectedRundown = playlistData.find(item => item.id === rundownId);
    if (selectedRundown) {
      // Aggiorna il calendario con il rundown selezionato
      setCalendarData(prevCalendar => {
        const newCalendar = Object.keys(prevCalendar).reduce((acc, day) => {
          if (Array.isArray(prevCalendar[day])) {
            acc[day] = prevCalendar[day].filter(item => item.id !== rundownId);
          } else {
            acc[day] = [];
          }
          return acc;
        }, {...prevCalendar});

        // Aggiungiamo il rundown selezionato al giorno specificato
        const day = selectedRundown.day;
        if (day) {
          if (!Array.isArray(newCalendar[day])) {
            newCalendar[day] = [];
          }
          newCalendar[day] = [...newCalendar[day], selectedRundown];
        }

        return newCalendar;
      });
    }
  }, [playlistData]);

  // Riordina gli elementi della playlist
  const reorderPlaylist = useCallback((sourceIndex, destinationIndex) => {
    setPlaylistData(prevPlaylist => {
      const result = Array.from(prevPlaylist);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result;
    });
  }, []);

  // Funzione per caricare la playlist del giorno corrente nel rundown
  const loadCurrentDayPlaylistToRundown = useCallback(() => {
    // Determina il giorno corrente
    const today = new Date();
    const currentDateIso = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // Verifica se ci sono rundown per il giorno corrente
    if (calendarData[currentDateIso] && Array.isArray(calendarData[currentDateIso]) && calendarData[currentDateIso].length > 0) {
      // Ordina i rundown per orario di inizio
      const sortedRundowns = [...calendarData[currentDateIso]].sort((a, b) => {
        // Converti gli orari in secondi per un confronto numerico più preciso
        const [hoursA, minutesA, secsA] = (a.startTime || '00:00:00').split(':').map(Number);
        const [hoursB, minutesB, secsB] = (b.startTime || '00:00:00').split(':').map(Number);

        const totalSecondsA = hoursA * 3600 + minutesA * 60 + secsA;
        const totalSecondsB = hoursB * 3600 + minutesB * 60 + secsB;

        return totalSecondsA - totalSecondsB;
      });

      // Carica i rundown nel playlist corrente
      setPlaylistData(sortedRundowns);
      return sortedRundowns;
    }

    return [];
  }, [calendarData, setPlaylistData]);

  // Carica il calendario da un oggetto JSON
  const loadCalendarFromJson = useCallback((jsonData) => {
    try {
      if (typeof jsonData === 'string') {
        jsonData = JSON.parse(jsonData);
      }

      // Verifica che il jsonData sia un oggetto valido con la struttura del calendario
      if (jsonData && typeof jsonData === 'object') {
        // Assicuriamoci che ci siano tutte le chiavi necessarie
        const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const newCalendarData = {};

        requiredDays.forEach(day => {
          // Se il giorno esiste nel jsonData e è un array, lo utilizziamo, altrimenti manteniamo un array vuoto
          if (jsonData[day] && Array.isArray(jsonData[day])) {
            newCalendarData[day] = jsonData[day];
          } else {
            newCalendarData[day] = [];
          }
        });

        setCalendarData(newCalendarData);
        setModified(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Errore durante il caricamento del calendario da JSON:', error);
      return false;
    }
  }, []);

  // Carica il calendario dal server
  const loadCalendarFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/load');

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      return loadCalendarFromJson(data);
    } catch (error) {
      console.error('Errore durante il caricamento del calendario dal server:', error);
      return false;
    }
  }, [loadCalendarFromJson]);

  // Fine delle implementazioni delle funzioni mancanti

  // Valore del context
  return (
    <CalendarContext.Provider
      value={{
        calendarData,
        playlistData,
        modified,
        addRundownToDay,
        removeRundownFromDay,
        moveRundown,
        updateRundownInDay,
        saveCalendarToFile,
        loadCalendarFromFile,
        loadCalendarFromJson,
        loadCalendarFromServer,
        addRundownToPlaylist,
        removeRundownFromPlaylist,
        updateRundownInPlaylist,
        clearPlaylist,
        loadPlaylistFromFile,
        savePlaylistToFile,
        loadPlaylistFromJson,
        loadPlaylistFromServer,
        setSelectedRundown,
        loadCurrentDayPlaylistToRundown,
        clearCalendar,
        reorderPlaylist,
        calculateEndTime
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
