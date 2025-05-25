import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import './PreviewPlayer.css';

const PreviewPlayer = ({
  sourceUdpUrl = 'udp://127.0.0.1:5004?pkt_size=1316',
  webrtcSignalingUrl = 'http://127.0.0.1:8889',
  showLatency = true,
}) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [latency, setLatency] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Funzione per inizializzare il WebRTC reader
  const initializeWebRTC = () => {
    if (!window.MediaMTXWebRTCReader) {
      console.error('MediaMTXWebRTCReader non disponibile.');
      return;
    }

    // Chiudi il reader esistente se presente
    if (readerRef.current) {
      try {
        readerRef.current.close();
      } catch (error) {
        console.warn('Errore durante la chiusura del reader esistente:', error);
      }
      readerRef.current = null;
    }

    console.log(`[WebRTC] Inizializzazione reader (tentativo ${retryCount + 1}/${maxRetries + 1})`);

    try {
      readerRef.current = new window.MediaMTXWebRTCReader({
        url: new URL('/preview/whep', webrtcSignalingUrl),
        onTrack: (ev) => {
          console.log('[WebRTC] Track ricevuto, collegamento al video element');
          if (videoRef.current) {
            videoRef.current.srcObject = ev.streams[0];
            setIsConnected(true);
            setRetryCount(0); // Reset retry count on successful connection
          }
        },
        onLatency: (ms) => {
          setLatency(ms);
        },
        onError: (err) => {
          console.error('[WebRTC] Errore:', err);
          setIsConnected(false);

          // Retry logic
          if (retryCount < maxRetries) {
            console.log(`[WebRTC] Tentativo di riconnessione in 2 secondi... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          } else {
            console.error('[WebRTC] Raggiunto il numero massimo di tentativi di riconnessione');
          }
        },
        onClose: () => {
          console.log('[WebRTC] Connessione chiusa');
          setIsConnected(false);
        }
      });
    } catch (error) {
      console.error('[WebRTC] Errore durante l\'inizializzazione:', error);
      setIsConnected(false);
    }
  };

  // Effect per inizializzare/reinizializzare il WebRTC
  useEffect(() => {
    initializeWebRTC();

    // Cleanup function
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.close();
        } catch (error) {
          console.warn('[WebRTC] Errore durante la chiusura:', error);
        }
        readerRef.current = null;
      }
    };
  }, [webrtcSignalingUrl, retryCount]);

  // Effect per gestire la visibilità della pagina e eventi di reinizializzazione
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('[WebRTC] Pagina tornata visibile, tentativo di riconnessione...');
        setRetryCount(0);
        setTimeout(initializeWebRTC, 1000);
      }
    };

    const handleWebRTCReinit = () => {
      console.log('[WebRTC] Evento di reinizializzazione ricevuto');
      setRetryCount(0);
      setTimeout(initializeWebRTC, 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('webrtc-reinit', handleWebRTCReinit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('webrtc-reinit', handleWebRTCReinit);
    };
  }, [isConnected]);

  return (
    <div className="preview-player" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="preview-player-container" style={{ flexGrow: 1, position: 'relative' }}>
        <video
          ref={videoRef}
          className="preview-player-content"
          autoPlay
          muted
          playsInline
        />
      </div>

      {/* Indicatori di stato fuori dall'area video */}
      <div className="preview-status-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '28px'
      }}>
        {/* Indicatore connessione WebRTC */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'white'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4caf50' : '#f44336',
            display: 'inline-block'
          }} />
          <span>
            {isConnected ? 'WebRTC' : 'Disconnesso'}
            {retryCount > 0 && !isConnected && ` (${retryCount}/${maxRetries})`}
          </span>
        </div>

        {/* Indicatore latenza */}
        {showLatency && latency !== null && (
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {latency}ms
          </div>
        )}
      </div>
    </div>
  );
};

PreviewPlayer.propTypes = {
  sourceUdpUrl: PropTypes.string,
  webrtcSignalingUrl: PropTypes.string,
  showLatency: PropTypes.bool,
};

export default PreviewPlayer;
