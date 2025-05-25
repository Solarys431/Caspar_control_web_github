import { useState, useEffect } from 'react';
import { useCaspar } from '../../../contexts/CasparContext';
import { timecodeToFrames } from '../utils/timecodeUtils';

/**
 * Hook per gestire i dati OSC
 *
 * @param {number} channel - Canale CasparCG
 * @param {number} layer - Layer CasparCG
 * @returns {Object} - Dati OSC e funzioni per gestirli
 */
const useOscData = (channel, layer) => {
  // Stati per le informazioni OSC
  const [timecode, setTimecode] = useState('00:00:00:00');
  const [duration, setDuration] = useState('00:00:00:00');
  const [length, setLength] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fps, setFps] = useState(25);

  // Ottieni i dati OSC dal context
  const { oscConnected, getTimecode, getOscData, getMediaDuration, getMediaLength } = useCaspar();

  // Aggiorna i dati OSC
  useEffect(() => {
    if (!oscConnected) return;

    // Funzione per aggiornare i dati OSC
    const updateOscData = () => {
      const oscData = getOscData ? getOscData(channel, layer) : null;

      // Aggiorna il timecode
      const currentTimecode = getTimecode ? getTimecode(channel, layer) : '00:00:00:00';
      if (currentTimecode && currentTimecode !== '00:00:00:00') {
        setTimecode(currentTimecode);
      }

      // Aggiorna la durata
      const mediaDuration = getMediaDuration ? getMediaDuration(channel, layer) : '00:00:00:00';
      if (mediaDuration && mediaDuration !== '00:00:00:00') {
        setDuration(mediaDuration);
      }

      // Aggiorna la lunghezza in frame
      const mediaLength = getMediaLength ? getMediaLength(channel, layer) : 0;

      // Log dettagliato per il canale di preview (3-1)
      if (channel === 3 && layer === 1) {
        console.log(`useOscData (Preview ${channel}-${layer}): Timecode: ${currentTimecode}, MediaLength (frames): ${mediaLength}, Duration (TC): ${mediaDuration}`);

        // Log dello stato OSC completo per debug
        console.log(`useOscData (Preview ${channel}-${layer}): Stato OSC completo:`, oscData);

        // Log dettagliato delle proprietà OSC
        if (oscData) {
          console.log(`useOscData (Preview ${channel}-${layer}): OSC Properties:`, {
            paused: oscData.paused,
            frame: oscData.frame,
            length: oscData.length,
            timecode: oscData.timecode,
            keys: Object.keys(oscData)
          });
        }
      }

      if (mediaLength > 0) {
        setLength(mediaLength);
      }

      // Aggiorna lo stato di pausa con logica migliorata
      if (oscData && typeof oscData.paused === 'boolean') {
        setPaused(oscData.paused);
        if (channel === 3 && layer === 1) {
          console.log(`useOscData (Preview ${channel}-${layer}): Stato pausa da OSC: ${oscData.paused}`);
        }
      } else {
        // Logica di fallback: se non abbiamo dati di pausa espliciti
        // Considera in pausa se il timecode è fermo a 00:00:00:00
        const inferredPaused = currentTimecode === '00:00:00:00';
        setPaused(inferredPaused);
        if (channel === 3 && layer === 1) {
          console.log(`useOscData (Preview ${channel}-${layer}): Stato pausa inferito: ${inferredPaused} (TC: ${currentTimecode})`);
        }
      }

      // Aggiorna il progresso con calcolo più robusto
      if (currentTimecode !== '00:00:00:00') {
        const currentFrames = timecodeToFrames(currentTimecode);

        if (mediaLength > 0) {
          // Calcolo normale con durata nota
          const calculatedProgress = Math.min(100, Math.max(0, (currentFrames / mediaLength) * 100));
          setProgress(calculatedProgress);

          // Log dettagliato per debug del canale preview
          if (channel === 3 && layer === 1) {
            console.log(`[useOscData] Progresso aggiornato: ${calculatedProgress.toFixed(2)}% (Frame: ${currentFrames}/${mediaLength}, TC: ${currentTimecode})`);
          }
        } else {
          // Durata sconosciuta: mostra progresso simbolico per indicare riproduzione attiva
          // Usa un progresso basato sui frame correnti con un massimo del 50%
          const symbolicProgress = currentFrames > 0 ? Math.min(50, (currentFrames / 1000) * 100) : 5;
          setProgress(symbolicProgress);

          // Log per durata sconosciuta
          if (channel === 3 && layer === 1) {
            console.log(`[useOscData] Durata sconosciuta - progresso simbolico: ${symbolicProgress.toFixed(2)}% (Frame: ${currentFrames}, TC: ${currentTimecode})`);
          }
        }
      } else {
        // Nessun timecode valido - reset progresso
        setProgress(0);
        if (channel === 3 && layer === 1) {
          console.log(`[useOscData] Reset progresso - TC: ${currentTimecode}, Length: ${mediaLength}`);
        }
      }

      // Aggiorna il frame rate
      if (oscData && oscData.fps) {
        setFps(oscData.fps);
      }
    };

    // Aggiorna i dati OSC immediatamente
    updateOscData();

    // Aggiorna i dati OSC ogni 100ms
    const interval = setInterval(updateOscData, 100);

    // Pulisci l'intervallo quando il componente viene smontato
    return () => clearInterval(interval);
  }, [oscConnected, channel, layer, getTimecode, getOscData, getMediaDuration, getMediaLength, progress]);

  // Funzione per calcolare il tempo rimanente
  const calculateRemainingTime = () => {
    if (length > 0 && timecode !== '00:00:00:00') {
      const currentFrames = timecodeToFrames(timecode);
      const remainingFrames = Math.max(0, length - currentFrames);

      const remainingHours = Math.floor(remainingFrames / (fps * 60 * 60));
      const remainingMinutes = Math.floor((remainingFrames % (fps * 60 * 60)) / (fps * 60));
      const remainingSeconds = Math.floor((remainingFrames % (fps * 60)) / fps);
      const remainingFramesCount = remainingFrames % fps;

      return `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:${remainingFramesCount.toString().padStart(2, '0')}`;
    } else if (timecode !== '00:00:00:00' && length === 0) {
      // Durata sconosciuta ma media in riproduzione
      return '--:--:--:--';
    }
    return '00:00:00:00';
  };

  return {
    timecode,
    duration,
    length,
    paused,
    progress,
    fps,
    remainingTime: calculateRemainingTime(),
    isConnected: oscConnected
  };
};

export default useOscData;
