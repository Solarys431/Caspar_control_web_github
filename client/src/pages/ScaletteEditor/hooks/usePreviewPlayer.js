import { useState, useEffect, useContext, useCallback } from 'react';
import CasparContext, { useCaspar } from '../../../contexts/CasparContext';
import { timecodeToFrames } from '../utils/timecodeUtils';
import useOscData from './useOscData';

/**
 * Hook per gestire il player di anteprima
 *
 * @param {number} previewChannel - Canale di preview (usato solo se non si utilizza un profilo)
 * @returns {Object} - Funzioni e stati per gestire il player di anteprima
 */
const usePreviewPlayer = (previewChannel = 3) => {
  // Accesso al contesto CasparCG
  const {
    sendCommand,
    stop,
    pause,
    resume,
    previewSessionId,
    requestPreviewSession,
    activeProfileId
  } = useCaspar();

  // Stati per la preview
  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewSession, setPreviewSession] = useState(null);

  // Stati per le informazioni di playback
  const [playbackStatus, setPlaybackStatus] = useState('STOPPED');

  // Ottieni i dati OSC dal context per funzioni specifiche
  const { getOscData } = useCaspar();

  // Determina il canale e il layer di preview
  const [actualPreviewChannel, setActualPreviewChannel] = useState(previewChannel);
  const [actualPreviewLayer, setActualPreviewLayer] = useState(1);

  // Utilizziamo il nuovo hook useOscData per ottenere i dati OSC
  const oscData = useOscData(actualPreviewChannel, actualPreviewLayer);

  // Effetto per richiedere una sessione di preview quando cambia il profilo attivo
  useEffect(() => {
    const initPreviewSession = async () => {
      if (!activeProfileId) return;

      try {
        // Se abbiamo già una sessione, non ne richiediamo un'altra
        if (previewSessionId) {
          console.log(`Sessione di preview già attiva: ${previewSessionId}`);
          return;
        }

        console.log(`Richiesta sessione di preview per il profilo ${activeProfileId}...`);

        // Richiedi una sessione di preview
        const result = await requestPreviewSession();

        if (result.success) {
          console.log(`Sessione di preview ottenuta: ${result.sessionId}`);
          console.log(`Server: ${result.server.host}:${result.server.port}, Canale: ${result.channel}, Layer: ${result.layer}`);

          // Salva i dettagli della sessione
          setPreviewSession({
            id: result.sessionId,
            server: result.server,
            channel: result.channel,
            layer: result.layer
          });

          // Aggiorna il canale e il layer di preview
          setActualPreviewChannel(result.channel);
          setActualPreviewLayer(result.layer);
        } else {
          console.error(`Errore nella richiesta di sessione di preview: ${result.message}`);

          // Fallback al canale di preview predefinito
          console.log(`Utilizzo del canale di preview predefinito: ${previewChannel}`);
          setActualPreviewChannel(previewChannel);
          setActualPreviewLayer(1);
        }
      } catch (error) {
        console.error(`Errore nella richiesta di sessione di preview: ${error.message}`);

        // Fallback al canale di preview predefinito
        console.log(`Utilizzo del canale di preview predefinito: ${previewChannel}`);
        setActualPreviewChannel(previewChannel);
        setActualPreviewLayer(1);
      }
    };

    initPreviewSession();
  }, [activeProfileId, previewSessionId, requestPreviewSession, previewChannel]);

  // Aggiorna lo stato di playback in base ai dati OSC
  useEffect(() => {
    if (oscData.isConnected) {
      // Se abbiamo un timecode valido e non è in pausa, lo stato è PLAYING
      if (oscData.timecode !== '00:00:00:00' && !oscData.paused && timecodeToFrames(oscData.timecode) > 0) {
        setPlaybackStatus('PLAYING');
      }
      // Se è in pausa, lo stato è PAUSED
      else if (oscData.paused) {
        setPlaybackStatus('PAUSED');
      }
      // Altrimenti, lo stato è STOPPED
      else {
        setPlaybackStatus('STOPPED');
      }

      // Aggiorna il campo OUT con la durata totale del media
      if (oscData.duration && oscData.duration !== '00:00:00:00') {
        const outPointField = document.getElementById('outPointField');
        if (outPointField) {
          outPointField.value = oscData.duration;
        }
      }
    }
  }, [oscData]);

  // Funzione per gestire la selezione di un media
  const handleSelectMedia = async (media, inPoint = '00:00:00:00') => {
    // Crea un oggetto media con le proprietà necessarie se è una stringa
    const mediaObj = typeof media === 'string'
      ? {
          path: media,
          name: media.split('/').pop(), // Estrae il nome del file dal path
          duration: '00:00:00' // Valore predefinito
        }
      : media;

    // Imposta il media selezionato
    setPreviewMedia(mediaObj);

    // Per compatibilità con il codice esistente che si aspetta una stringa
    const mediaPath = typeof media === 'string' ? media : media.path;

    try {
      if (typeof sendCommand === 'function') {
        // Carica il media senza riprodurlo immediatamente
        // Questo permette di visualizzare il primo frame e di navigare nel media

        // Determina il canale e il layer da utilizzare
        const channel = actualPreviewChannel;
        const layer = actualPreviewLayer;

        // Opzioni per il comando
        const commandOptions = previewSessionId ?
          { isPreview: true, sessionId: previewSessionId } :
          {};

        // Se c'è un punto IN specificato, usa il parametro SEEK
        if (inPoint && inPoint !== '00:00:00:00') {
          // Converti il timecode in frame
          const frames = timecodeToFrames(inPoint);

          try {
            if (frames > 0) {
              // Usa PLAY con SEEK per iniziare da un frame specifico
              await sendCommand(`PLAY ${channel}-${layer} "${mediaPath}" SEEK ${frames}`, commandOptions);
              // Attendi un po' e poi metti in pausa
              await new Promise(resolve => setTimeout(resolve, 100));
              await sendCommand(`PAUSE ${channel}-${layer}`, commandOptions);
            } else {
              // Se il frame è 0 o negativo, usa LOAD
              await sendCommand(`LOAD ${channel}-${layer} "${mediaPath}"`, commandOptions);
            }
          } catch (error) {
            console.warn(`Avviso: Comando fallito: ${error.message}. Utilizzo metodo di fallback.`);

            // Metodo di fallback: usa PLAY direttamente e poi PAUSE
            try {
              await sendCommand(`PLAY ${channel}-${layer} "${mediaPath}"`, commandOptions);
              // Attendi un po' e poi metti in pausa
              await new Promise(resolve => setTimeout(resolve, 100));
              await sendCommand(`PAUSE ${channel}-${layer}`, commandOptions);
            } catch (fallbackError) {
              console.error(`Errore nel metodo di fallback: ${fallbackError.message}`);
            }
          }
        } else {
          try {
            // Usa LOAD per caricare il media senza riprodurlo
            await sendCommand(`LOAD ${channel}-${layer} "${mediaPath}"`, commandOptions);
          } catch (error) {
            console.warn(`Avviso: Comando LOAD fallito: ${error.message}. Utilizzo metodo di fallback.`);

            // Metodo di fallback: usa PLAY e poi PAUSE
            try {
              await sendCommand(`PLAY ${channel}-${layer} "${mediaPath}"`, commandOptions);
              // Attendi un po' e poi metti in pausa
              await new Promise(resolve => setTimeout(resolve, 100));
              await sendCommand(`PAUSE ${channel}-${layer}`, commandOptions);
            } catch (fallbackError) {
              console.error(`Errore nel metodo di fallback: ${fallbackError.message}`);
            }
          }
        }

        // Aggiorna lo stato dell'interfaccia
        setPlaybackStatus('PAUSED');

        // Imposta il punto IN nel campo di input
        const inPointField = document.getElementById('inPointField');
        if (inPointField) {
          inPointField.value = inPoint;
        }

        // Ottieni la durata del media dai dati OSC (se disponibile)
        // Attendiamo un po' per dare tempo a CasparCG di inviare i dati OSC
        setTimeout(() => {
          // Ottieni i dati OSC per il canale e layer specificati
          const currentOscData = getOscData ? getOscData(`${previewChannel}-1`) : null;

          console.log("Dati OSC ricevuti:", currentOscData);

          // Verifica se abbiamo dati sulla lunghezza
          if (currentOscData && currentOscData.length && currentOscData.length.timecode) {
            const mediaDuration = currentOscData.length.timecode;
            console.log(`Durata media da OSC: ${mediaDuration}`);

            // Aggiorna il campo OUT con la durata totale del media
            const outPointField = document.getElementById('outPointField');
            if (outPointField) {
              outPointField.value = mediaDuration;
            }
          } else {
            // Se non abbiamo i dati OSC, usiamo un valore predefinito
            console.log("Dati OSC non disponibili, uso valore predefinito");

            // Imposta una durata predefinita
            const defaultDuration = '00:03:30:00';

            // Aggiorna il campo OUT con la durata predefinita
            const outPointField = document.getElementById('outPointField');
            if (outPointField) {
              outPointField.value = defaultDuration;
            }
          }
        }, 1000); // Attendi 1 secondo per dare tempo ai dati OSC di arrivare
      }
    } catch (e) {
      console.error(`Errore caricamento media: ${e.message}`);
      // Non propagare l'errore, ma gestiscilo qui
      console.warn("Si è verificato un errore durante il caricamento del media, ma l'applicazione continuerà a funzionare.");
    }
  };

  // Funzione per gestire i controlli dei template grafici
  const handleTemplateControl = async (action, selectedItem = null, options = {}) => {
    // Determina il canale e il layer da utilizzare per i template
    const channel = actualPreviewChannel;
    const layer = options.layer || 10; // Layer dedicato per i template nella preview
    const cgLayer = options.cgLayer || 1; // CG Layer di default

    // Opzioni per il comando
    const commandOptions = previewSessionId ?
      { isPreview: true, sessionId: previewSessionId } :
      {};

    // Determina il template da utilizzare
    let templateToUse = previewTemplate;
    let templateData = null;
    let templateConfig = null;

    // Se abbiamo un elemento selezionato, prova a estrarre il template da lì
    if (!templateToUse && selectedItem) {
      if (selectedItem.type === 'TEMPLATE' && selectedItem.data?.template) {
        templateToUse = selectedItem.data.template;
        templateData = selectedItem.data.templateData;
        templateConfig = selectedItem.data;
      } else if (selectedItem.type === 'STORY') {
        // Per le storie, usa il template specificato o il primo disponibile
        const templateIndex = options.templateIndex || 0;

        if (selectedItem.data?.templateDetails?.templateFile) {
          templateToUse = selectedItem.data.templateDetails.templateFile;
          templateData = selectedItem.data.templateDetails.templateData;
          templateConfig = selectedItem.data.templateDetails;
        } else if (selectedItem.data?.templatesDetails && selectedItem.data.templatesDetails.length > templateIndex) {
          const selectedTemplate = selectedItem.data.templatesDetails[templateIndex];
          templateToUse = selectedTemplate.templateFile;
          templateData = selectedTemplate.templateData;
          templateConfig = selectedTemplate;
        }
      }
    }

    if (!templateToUse) {
      console.error("Nessun template disponibile per l'operazione:", action);
      console.log("previewTemplate:", previewTemplate);
      console.log("selectedItem:", selectedItem);
      console.log("options:", options);
      return;
    }

    const templatePath = typeof templateToUse === 'string' ? templateToUse : templateToUse.path;
    const templateName = templatePath.split('/').pop().replace('.html', ''); // Estrai nome template

    try {
      switch (action) {
        case 'cgAdd':
          // Aggiungi il template specificando il nome
          if (typeof sendCommand === 'function') {
            const dataToSend = templateData ? JSON.stringify(templateData).replace(/"/g, '\\"') : '{}';
            const command = `CG ${channel}-${layer} ADD ${cgLayer} "${templateName}" 1 "${dataToSend}"`;
            console.log(`Invio comando CG ADD: ${command}`);
            console.log(`Template: ${templateName}, Data: ${dataToSend}`);
            await sendCommand(command, commandOptions);
          }
          break;

        case 'cgPlay':
          // Riproduci il template specificando il nome
          if (typeof sendCommand === 'function') {
            const command = `CG ${channel}-${layer} PLAY ${cgLayer}`;
            console.log(`Invio comando CG PLAY: ${command} (Template: ${templateName})`);
            await sendCommand(command, commandOptions);
          }
          break;

        case 'cgUpdate':
          // Aggiorna il template con dati specifici
          if (typeof sendCommand === 'function') {
            const dataToSend = templateData ? JSON.stringify(templateData).replace(/"/g, '\\"') : '{}';
            const command = `CG ${channel}-${layer} UPDATE ${cgLayer} "${dataToSend}"`;
            console.log(`Invio comando CG UPDATE: ${command} (Template: ${templateName})`);
            await sendCommand(command, commandOptions);
          }
          break;

        case 'cgStop':
          // Ferma il template specificando il nome
          if (typeof sendCommand === 'function') {
            const command = `CG ${channel}-${layer} STOP ${cgLayer}`;
            console.log(`Invio comando CG STOP: ${command} (Template: ${templateName})`);
            await sendCommand(command, commandOptions);
          }
          break;

        case 'cgClear':
          // Rimuovi il template specificando il nome
          if (typeof sendCommand === 'function') {
            const command = `CG ${channel}-${layer} REMOVE ${cgLayer}`;
            console.log(`Invio comando CG REMOVE: ${command} (Template: ${templateName})`);
            await sendCommand(command, commandOptions);
          }
          break;

        default:
          console.error("Azione template non riconosciuta:", action);
          break;
      }
    } catch (error) {
      console.error(`Errore durante l'operazione template ${action}:`, error);
    }
  };

  // Funzione per gestire il controllo di riproduzione
  const handlePlaybackControl = (action) => {
    // Determina il canale e il layer da utilizzare
    const channel = actualPreviewChannel;
    const layer = actualPreviewLayer;

    // Opzioni per il comando
    const commandOptions = previewSessionId ?
      { isPreview: true, sessionId: previewSessionId } :
      {};

    switch (action) {
      case 'play':
        // Verifica che previewMedia sia definito
        if (previewMedia) {
          // Ottieni il path del media
          const mediaPath = typeof previewMedia === 'string' ? previewMedia : previewMedia.path;
          // Utilizziamo sempre il comando PLAY, anche se lo stato è PAUSED
          if (typeof sendCommand === 'function') {
            try {
              // Se c'è un punto IN specificato, usa il parametro SEEK
              const inPoint = document.getElementById('inPointField')?.value || '00:00:00:00';
              if (inPoint && inPoint !== '00:00:00:00') {
                const frames = timecodeToFrames(inPoint);
                if (frames > 0) {
                  sendCommand(`PLAY ${channel}-${layer} "${mediaPath}" SEEK ${frames}`, commandOptions)
                    .catch(error => {
                      console.error(`Errore durante la riproduzione con SEEK: ${error.message || JSON.stringify(error)}`);
                    });
                } else {
                  sendCommand(`PLAY ${channel}-${layer} "${mediaPath}"`, commandOptions)
                    .catch(error => {
                      console.error(`Errore durante la riproduzione: ${error.message || JSON.stringify(error)}`);
                    });
                }
              } else {
                sendCommand(`PLAY ${channel}-${layer} "${mediaPath}"`, commandOptions)
                  .catch(error => {
                    console.error(`Errore durante la riproduzione: ${error.message || JSON.stringify(error)}`);
                  });
              }
              setPlaybackStatus('PLAYING');
            } catch (error) {
              console.error(`Errore durante l'esecuzione del comando di riproduzione: ${error.message || JSON.stringify(error)}`);
            }
          }
        } else {
          console.error("Impossibile riprodurre: nessun media selezionato o media non valido");
        }
        break;

      case 'pause':
        // Utilizziamo il comando PAUSE di CasparCG
        if (playbackStatus === 'PLAYING') {
          if (typeof pause === 'function' && !previewSessionId) {
            // Usa la funzione pause dal contesto solo se non stiamo usando una sessione di preview
            pause(channel, layer)
              .catch(error => {
                console.error(`Errore durante la pausa: ${error.message || JSON.stringify(error)}`);
              });
            setPlaybackStatus('PAUSED');
          } else if (typeof sendCommand === 'function') {
            // Usa il comando diretto
            sendCommand(`PAUSE ${channel}-${layer}`, commandOptions)
              .catch(error => {
                console.error(`Errore durante la pausa: ${error.message || JSON.stringify(error)}`);
              });
            setPlaybackStatus('PAUSED');
          }
        }
        break;

      case 'resume':
        // Utilizziamo il comando RESUME di CasparCG
        console.log(`Tentativo di resume per ${channel}-${layer}, stato attuale: ${playbackStatus}`);

        if (typeof sendCommand === 'function') {
          // Usa sempre il comando diretto per maggiore affidabilità
          sendCommand(`RESUME ${channel}-${layer}`, commandOptions)
            .then(() => {
              console.log(`Comando RESUME inviato con successo per ${channel}-${layer}`);
              setPlaybackStatus('PLAYING');
            })
            .catch(error => {
              console.error(`Errore durante la ripresa: ${error.message || JSON.stringify(error)}`);

              // Fallback: se RESUME fallisce, prova con PLAY
              if (previewMedia) {
                const mediaPath = typeof previewMedia === 'string' ? previewMedia : previewMedia.path;
                console.log(`Fallback: tentativo PLAY per ${mediaPath}`);
                sendCommand(`PLAY ${channel}-${layer} "${mediaPath}"`, commandOptions)
                  .then(() => {
                    console.log(`Fallback PLAY riuscito per ${channel}-${layer}`);
                    setPlaybackStatus('PLAYING');
                  })
                  .catch(fallbackError => {
                    console.error(`Errore anche nel fallback PLAY: ${fallbackError.message || JSON.stringify(fallbackError)}`);
                  });
              }
            });
        } else {
          console.error("sendCommand non disponibile per il comando RESUME");
        }
        break;

      case 'stop':
        if (typeof stop === 'function' && !previewSessionId) {
          // Usa la funzione stop dal contesto solo se non stiamo usando una sessione di preview
          stop(channel, layer)
            .catch(error => {
              console.error(`Errore durante lo stop: ${error.message || JSON.stringify(error)}`);
            });
          setPlaybackStatus('STOPPED');
        } else if (typeof sendCommand === 'function') {
          // Usa il comando diretto
          sendCommand(`STOP ${channel}-${layer}`, commandOptions)
            .catch(error => {
              console.error(`Errore durante lo stop: ${error.message || JSON.stringify(error)}`);
            });
          setPlaybackStatus('STOPPED');
        }
        break;

      case 'seekToFrame':
        // Vai a un frame specifico
        if (typeof sendCommand === 'function') {
          const frameInput = document.getElementById('frameSeekInput');
          if (frameInput && frameInput.value) {
            const frame = parseInt(frameInput.value, 10);
            if (!isNaN(frame) && frame >= 0) {
              if (playbackStatus === 'PAUSED') {
                // Se il media è in pausa, usa CALL SEEK
                sendCommand(`CALL ${channel}-${layer} SEEK ${frame}`, commandOptions)
                  .catch(error => {
                    console.error(`Errore durante il seek: ${error.message || JSON.stringify(error)}`);
                  });
              } else {
                // Se il media è in riproduzione o fermo, usa PLAY con SEEK
                // Ottieni il path del media
                const mediaPath = typeof previewMedia === 'string' ? previewMedia : previewMedia.path;
                sendCommand(`PLAY ${channel}-${layer} "${mediaPath}" SEEK ${frame}`, commandOptions)
                  .catch(error => {
                    console.error(`Errore durante il play con seek: ${error.message || JSON.stringify(error)}`);
                  });
                setPlaybackStatus('PLAYING');
              }
            }
          }
        }
        break;

      case 'loop':
        // Attiva/disattiva il loop del media
        if (previewMedia && typeof sendCommand === 'function') {
          const mediaPath = typeof previewMedia === 'string' ? previewMedia : previewMedia.path;
          // Riproduci il media con il parametro LOOP
          sendCommand(`PLAY ${channel}-${layer} "${mediaPath}" LOOP`, commandOptions)
            .catch(error => {
              console.error(`Errore durante l'attivazione del loop: ${error.message || JSON.stringify(error)}`);
            });
          setPlaybackStatus('PLAYING');
          console.log(`Loop attivato per il media: ${mediaPath}`);
        }
        break;

      case 'advance10frames':
        // Avanza di 10 frame usando CALL SEEK per navigazione incrementale
        if (typeof sendCommand === 'function') {
          // Ottieni il frame corrente dai dati OSC
          const currentOscData = getOscData ? getOscData(`${actualPreviewChannel}-${actualPreviewLayer}`) : {};
          let currentFrame = 0;
          let totalFrames = 0;

          // Estrai frame corrente
          if (currentOscData && currentOscData.frame && currentOscData.frame.frame) {
            currentFrame = parseInt(currentOscData.frame.frame, 10) || 0;
          }

          // Estrai durata totale in frame (se disponibile)
          if (currentOscData && currentOscData.length && currentOscData.length.frame) {
            totalFrames = parseInt(currentOscData.length.frame, 10) || 0;
          }

          // Calcola il nuovo frame (corrente + 10)
          let newFrame = currentFrame + 10;

          // Assicurati che non superi la durata totale
          if (totalFrames > 0 && newFrame >= totalFrames) {
            newFrame = totalFrames - 1; // Vai all'ultimo frame
          }

          console.log(`Avanzamento da frame ${currentFrame} a frame ${newFrame} (totale: ${totalFrames})`);

          // Usa CALL SEEK per navigazione incrementale senza ricaricare
          sendCommand(`CALL ${channel}-${layer} SEEK ${newFrame}`, commandOptions)
            .catch(error => {
              console.error(`Errore durante l'avanzamento di 10 frame: ${error.message || JSON.stringify(error)}`);
            });
        }
        break;

      case 'rewind10frames':
        // Retrocedi di 10 frame usando CALL SEEK per navigazione incrementale
        if (typeof sendCommand === 'function') {
          // Ottieni il frame corrente dai dati OSC
          const currentOscData = getOscData ? getOscData(`${actualPreviewChannel}-${actualPreviewLayer}`) : {};
          let currentFrame = 0;

          // Estrai frame corrente
          if (currentOscData && currentOscData.frame && currentOscData.frame.frame) {
            currentFrame = parseInt(currentOscData.frame.frame, 10) || 0;
          }

          // Calcola il nuovo frame (corrente - 10)
          let newFrame = currentFrame - 10;

          // Assicurati che non vada sotto zero
          if (newFrame < 0) {
            newFrame = 0; // Vai al primo frame
          }

          console.log(`Retrocessione da frame ${currentFrame} a frame ${newFrame}`);

          // Usa CALL SEEK per navigazione incrementale senza ricaricare
          sendCommand(`CALL ${channel}-${layer} SEEK ${newFrame}`, commandOptions)
            .catch(error => {
              console.error(`Errore durante la retrocessione di 10 frame: ${error.message || JSON.stringify(error)}`);
            });
        }
        break;

      case 'clearChannel':
        // Pulisce tutto il canale (media e template)
        if (typeof sendCommand === 'function') {
          console.log(`Pulizia completa del canale ${channel}`);

          // Prima pulisce tutti i template CG
          sendCommand(`CG ${channel} CLEAR`, commandOptions)
            .then(() => {
              console.log(`Template CG puliti dal canale ${channel}`);
              // Poi pulisce tutti i layer del canale
              return sendCommand(`CLEAR ${channel}`, commandOptions);
            })
            .then(() => {
              console.log(`Canale ${channel} completamente pulito`);
              setPlaybackStatus('STOPPED');
            })
            .catch(error => {
              console.error(`Errore durante la pulizia del canale: ${error.message || JSON.stringify(error)}`);
            });
        }
        break;

      default:
        break;
    }
  };

  // Ottieni i dati OSC più recenti
  const currentOscData = getOscData ? getOscData(`${actualPreviewChannel}-${actualPreviewLayer}`) : {};

  // Log per debug
  console.log("usePreviewPlayer - Dati OSC:", {
    oscData,
    currentOscData,
    progress: oscData.progress,
    timecode: oscData.timecode,
    remainingTime: oscData.remainingTime,
    previewSession,
    actualPreviewChannel,
    actualPreviewLayer
  });

  return {
    previewMedia,
    previewTemplate,
    previewExpanded,
    playbackStatus,
    progressValue: oscData.progress,
    currentTimecode: oscData.timecode,
    remainingTime: oscData.remainingTime,
    previewOscData: currentOscData, // Assicuriamoci di passare i dati OSC più recenti
    previewSession, // Aggiungiamo le informazioni sulla sessione di preview
    previewChannel: actualPreviewChannel, // Canale di preview effettivo
    previewLayer: actualPreviewLayer, // Layer di preview effettivo
    setPreviewMedia,
    setPreviewTemplate,
    setPreviewExpanded,
    handleSelectMedia,
    handlePlaybackControl,
    handleTemplateControl // Aggiungiamo i controlli per i template grafici
  };
};

export default usePreviewPlayer;
