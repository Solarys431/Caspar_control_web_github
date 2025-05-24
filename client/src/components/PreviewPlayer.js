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
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    if (!window.MediaMTXWebRTCReader) {
      console.error('MediaMTXWebRTCReader non disponibile.');
      return;
    }
    const reader = new window.MediaMTXWebRTCReader({
      url: new URL('/preview/whep', webrtcSignalingUrl),
      onTrack: (ev) => {
        videoRef.current.srcObject = ev.streams[0];
      },
      onLatency: (ms) => {
        setLatency(ms);
      },
      onError: (err) => {
        console.error('Errore WebRTC:', err);
      },
    });
    return () => reader.close();
  }, [webrtcSignalingUrl]);

  return (
    <div className="preview-player">
     
      <div className="preview-player-container">
        <video
          ref={videoRef}
          className="preview-player-content"
          autoPlay
          muted
          playsInline
        />
        {showLatency && latency !== null && (
          <div className="preview-latency-indicator">
            Latency: {latency} ms
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
