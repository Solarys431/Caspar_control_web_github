# Streaming UDP basso‐livello da CasparCG a Web App via WebRTC

Questo documento descrive in modo tecnico, dettagliato e “senza giri di parole” come abbiamo realizzato una pipeline di streaming ultra‐basso ritardo (sub-secondo) che prende un flusso MPEG-TS in UDP generato da CasparCG e lo rende disponibile in una semplice web-app via WebRTC. Seguire passo-passo per replicare esattamente la stessa configurazione.

---

## Architettura di massima

CasparCG (NDI → FFmpeg UDP) ──► MediaMTX (UDP in → WebRTC out) ──► Browser/Web App

php-template
Copia
Modifica

- **CasparCG Server**: consumer FFmpeg che incapsula il playout in UDP MPEG-TS.
- **MediaMTX**: riceve il flusso UDP e lo pubblica in tempo reale via WebRTC (WHEP/WS).
- **Web App**: pagina HTML/JS minimale che utilizza `reader.js` di MediaMTX per ricevere il flusso e mostrarlo in un `<video>` HTML5.

---

## 1. Configurazione di CasparCG Server

Nel file `casparcg.config`, nel `<channels>` dedicato alla preview, aggiungere un consumer FFmpeg:

```xml
<channel>
  <video-mode>1080i5000</video-mode>
  <channel-layout>stereo</channel-layout>
  <consumers>
    <!-- Consumer NDI già presente… -->

    <!-- Consumer FFmpeg → invio UDP -->
    <ffmpeg>
      <path>udp://127.0.0.1:5004?pkt_size=1316</path>
      <args>
        -codec:v libx264
        -tune:v zerolatency
        -preset:v ultrafast
        -crf:v 25
        -format mpegts
      </args>
      <separate-key>false</separate-key>
      <mono-streams>false</mono-streams>
    </ffmpeg>
  </consumers>
</channel>
path: indirizzo UDP di destinazione (127.0.0.1:5004).

pkt_size=1316: ottimizza il payload UDP per evitare frammentazione.

args: encode H.264 a bassa latenza in MPEG-TS.

Test rapido con VLC o ffplay:

bash
Copia
Modifica
vlc udp://@127.0.0.1:5004?pkt_size=1316
# oppure
ffplay -fflags nobuffer -flags low_delay "udp://@:5004?pkt_size=1316"
2. Ricezione e rilancio con MediaMTX
2.1 File mediamtx.yml
yaml
Copia
Modifica
# Global settings
logLevel: info
logDestinations: [stdout]
readTimeout: 10s
writeTimeout: 10s
writeQueueSize: 512
udpMaxPayloadSize: 1472

# Disabilitiamo protocolli non necessari
rtsp: no
rtmp: no
hls:  no

# Abilitazione WebRTC
webrtc:               yes
webrtcAddress:       :8889     # HTTP signalling
webrtcEncryption:    no
webrtcLocalUDPAddress: :8189   # ICE/UDP

# Path definitions
paths:
  preview:
    source: udp://127.0.0.1:5004?pkt_size=1316
webrtcAddress: :8889 → porta HTTP per POST SDP e WS ICE.

paths.preview.source → prende il flusso UDP da CasparCG.

2.2 Avvio di MediaMTX
powershell
Copia
Modifica
cd E:\progetti AI\testcasparcg\mediamtx
.\mediamtx.exe
Nei log dovresti vedere:

less
Copia
Modifica
[INF] [path preview] [UDP source] ready: 2 tracks (H264, MPEG-1/2 Audio)
[INF] [WebRTC] listener opened on :8889 (HTTP), :8189 (ICE/UDP)
3. Client WebRTC: Pagina HTML/JS
3.1 File index.html
Salva questo file nella stessa cartella di mediamtx.exe e servilo via HTTP (es. npx http-server -p 8080).

html
Copia
Modifica
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Anteprima WebRTC</title>
  <style>
    body, html {
      margin: 0; padding: 0;
      background: #000; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    video {
      width: 80%; max-width: 800px;
      border: 3px solid #444;
    }
  </style>
  <!-- reader.js fornito da MediaMTX -->
  <script defer src="http://127.0.0.1:8889/preview/reader.js"></script>
</head>
<body>
  <video id="video" autoplay playsinline controls muted></video>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const video = document.getElementById('video');

      new MediaMTXWebRTCReader({
        // Endpoint di signalling WebRTC di MediaMTX
        url: new URL('http://127.0.0.1:8889/preview/whep'),
        onTrack(event) {
          video.srcObject = event.streams[0];
        },
        onError(err) {
          console.error('Errore WebRTC:', err);
          alert('Errore WebRTC: ' + err);
        }
      });
    });
  </script>
</body>
</html>
reader.js contiene già la logica per:

POST SDP a /preview/whep

WebSocket ICE su /preview/ws

Il <video> HTML5 riceve lo stream in tempo reale.

3.2 Avvio del web server
bash
Copia
Modifica
npx http-server -p 8080
Apri → http://127.0.0.1:8080/index.html

4. Flusso end-to-end
CasparCG: PLAY su canale 3 → FFmpeg consumer UDP a 127.0.0.1:5004.

MediaMTX: legge da udp://127.0.0.1:5004 → WebRTC (/preview/whep + /preview/ws).

Browser: index.html richiama reader.js → handshake WebRTC → preview video in <video>.

Latency misurata: 4 ms nel log di CasparCG e percepita sotto 500 ms in ambiente LAN.

5. Conclusioni e note future
Semplicità: zero container, zero server Linux dedicati, tutto su Windows 11 Pro.

Scalabilità: MediaMTX può gestire più path e protocolli; in futuro si può aggiungere SRT o RTMP read-back.

Affidabilità: back-off automatico di AMCP nel Node.js backend (se ne avete bisogno) per ricostruire la connessione a CasparCG in caso di reset.

Evoluzione: integrare autentificazione JWT, metriche Prometheus e orchestration su Kubernetes per deployment enterprise.

Con questa guida tecnica hai tutte le carte in regola per mettere in piedi una preview WebRTC ultra-bassa latenza da CasparCG a qualunque browser moderno. Buon streaming! 🚀