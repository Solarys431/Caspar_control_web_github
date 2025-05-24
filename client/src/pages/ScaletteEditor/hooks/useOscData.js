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
      const channelLayerKey = `${channel}-${layer}`;
      const oscData = getOscData ? getOscData(channelLayerKey) : null;

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
      }

      if (mediaLength > 0) {
        setLength(mediaLength);
      }

      // Aggiorna lo stato di pausa
      if (oscData && oscData.paused !== undefined) {
        setPaused(oscData.paused);
      }

      // Aggiorna il progresso
      if (currentTimecode !== '00:00:00:00' && mediaLength > 0) {
        const currentFrames = timecodeToFrames(currentTimecode);
        const calculatedProgress = Math.min(100, (currentFrames / mediaLength) * 100);

        // Aggiorna solo se il progresso è cambiato significativamente (evita log eccessivi)
        if (Math.abs(calculatedProgress - progress) > 0.5) {
          setProgress(calculatedProgress);
          if (channel === 3 && layer === 1) {
            console.log(`useOscData (Preview ${channel}-${layer}) Progresso: ${calculatedProgress.toFixed(2)}% (${currentFrames}/${mediaLength})`);
          }
        } else {
          // Aggiorna comunque il valore anche se non logghiamo
          setProgress(calculatedProgress);
        }
      } else {
        // Reset del progresso se non abbiamo dati validi
        if (progress !== 0) {
          setProgress(0);
          if (channel === 3 && layer === 1) {
            console.log(`useOscData (Preview ${channel}-${layer}) Reset progresso a 0. Timecode: ${currentTimecode}, Length: ${mediaLength}`);
          }
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
