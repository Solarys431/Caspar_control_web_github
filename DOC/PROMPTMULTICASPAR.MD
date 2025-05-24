Obiettivo Principale:
Evolvere l'attuale applicazione React per includere un sistema di "Profili di Configurazione CasparCG" dinamici. Questi profili permetteranno di definire e selezionare diverse configurazioni di server CasparCG (main, backup, pool di preview) a cui il server backend Node.js si connetterà e che il client React utilizzerà. Questo risolverà il problema del collo di bottiglia con un singolo canale di preview condiviso e fornirà una gestione flessibile dei server CasparCG per differenti scenari di produzione (es. "Sport", "TG").

Contesto Attuale:

L'applicazione React comunica con un server backend Node.js tramite Socket.IO.
Il server Node.js fa da ponte ai comandi AMCP e ai dati OSC di un server CasparCG (attualmente configurato con un singolo host/porta nel CasparContext.js).
L'ScaletteEditor utilizza un canale di preview fisso (canale 3).
Supabase è usato per l'autenticazione e la gestione collaborativa delle scalette.
Fase 1: Definizione e Gestione dei Dati dei Profili CasparCG (Supabase e Interfaccia Admin)

Definizione Tabelle Supabase:

casparcg_servers:
id: uuid (PK, default uuid_generate_v4())
name: text (not null, univoco, es. "Caspar Playout A", "Caspar Preview Farm 1")
host: text (not null, IP o hostname)
port: integer (not null, es. 5250)
purpose: text (nullable, es. 'playout', 'preview', 'general_purpose')
is_enabled: boolean (default true)
created_at, updated_at
casparcg_profiles:
id: uuid (PK, default uuid_generate_v4())
name: text (not null, univoco, es. "Configurazione TG Serale", "Configurazione Evento Sportivo")
description: text (nullable)
is_default_profile: boolean (default false - solo un profilo può essere default)
created_at, updated_at
profile_server_assignments:
id: uuid (PK, default uuid_generate_v4())
profile_id: uuid (FK a casparcg_profiles.id, not null, on delete cascade)
server_id: uuid (FK a casparcg_servers.id, not null, on delete cascade)
server_role_in_profile: text (not null, es. 'MAIN_PLAYOUT', 'BACKUP_PLAYOUT', 'PREVIEW_POOL')
config_details: jsonb (nullable, per dettagli specifici del ruolo, es. per 'PREVIEW_POOL': {"preview_channel": 3, "preview_layer_start": 100, "num_preview_layers": 5, "udp_stream_port_start": 6250, "web_rtc_path_prefix": "previews/tg_serale/slot_"})
Constraint univoco su (profile_id, server_id, server_role_in_profile)
user_profile_preferences (Opzionale, per preferenze utente):
user_id: uuid (PK, FK a auth.users.id, not null, on delete cascade)
default_casparcg_profile_id: uuid (FK a casparcg_profiles.id, nullable)
Policy RLS per le Nuove Tabelle:

Definire policy RLS appropriate. Ad esempio:
Gli utenti autenticati possono leggere casparcg_profiles e casparcg_servers.
Solo un ruolo admin (gestito tramite metadati utente o una tabella user_roles) può fare CRUD su queste tabelle.
Interfaccia di Amministrazione Profili (in src/pages/Settings.js o nuova pagina):

Creare sezioni UI per:
Gestire (CRUD) i casparcg_servers (nome, host, porta, scopo, abilitato).
Gestire (CRUD) i casparcg_profiles (nome, descrizione, default).
Per ogni profilo, gestire le profile_server_assignments:
Associare server esistenti al profilo.
Assegnare un server_role_in_profile.
Se il ruolo è 'PREVIEW_POOL', permettere di specificare config_details (canale base, layer di inizio, numero di layer, porta UDP base per lo streaming a MediaMTX, prefisso per i path WebRTC).
Fase 2: Modifiche al Server Backend Node.js

L'obiettivo è trasformare il server Node.js in un gestore di connessioni CasparCG e un allocatore di risorse di preview.

Caricamento Configurazione Dinamica:
All'avvio, il server Node.js deve connettersi a Supabase (usando la service_role_key per leggere la configurazione) e caricare tutti i record da casparcg_servers.
Deve stabilire e mantenere connessioni AMCP (e listener OSC) per tutti i server CasparCG abilitati. Conservare queste connessioni in una mappa (es. Map<serverId, CasparCGConnectionInstance>).
Gestione Stato Risorse di Preview:
Mantenere una struttura dati interna (es. previewSlotsManager) che, basandosi sui dati caricati da profile_server_assignments e casparcg_servers, tracci lo stato (libero/occupato) di ogni slot di preview (canale/layer su un server specifico) per ogni pool definito.
previewSlotsManager dovrà inizializzare gli slot disponibili leggendo le configurazioni dei profili da Supabase (tramite profile_server_assignments con server_role_in_profile = 'PREVIEW_POOL' e le loro config_details).
Nuovi Eventi Socket.IO (Client <-> Server Node.js):
Client -> Server: REQUEST_PREVIEW_SESSION
Payload: { requestedProfileId: 'uuid_del_profilo' } (o il server determina il profilo in base all'utente).
Logica Server:
Carica la configurazione del requestedProfileId da Supabase (se non già in cache).
Trova un server CasparCG assegnato come 'PREVIEW_POOL' in quel profilo.
Utilizza previewSlotsManager per trovare uno slot (channel, layer) libero su quel server.
Se trovato:
Marca lo slot come occupato (associandolo a socket.id o userId).
Genera un webRtcPath univoco (es. usando config_details.web_rtc_path_prefix + un numero di slot o ID univoco).
Interazione con MediaMTX (Avanzato, opzionale per v1): Tramite l'API HTTP di MediaMTX (definita in mediaMtxConfig.httpApiUrl), crea dinamicamente il webRtcPath e configuralo per ricevere uno stream UDP dalla porta X (calcolata da config_details.udp_stream_port_start + offset dello slot).
Invia un comando AMCP al server CasparCG allocato per fare ADD <channel>-<layer> STREAM udp://<IP_MEDIANTX>:<PORTA_X> <parametri_streaming>.
Rispondi al client con PREVIEW_SESSION_ASSIGNED.
Se non trovato: Rispondi con PREVIEW_SESSION_UNAVAILABLE.
Server -> Client: PREVIEW_SESSION_ASSIGNED
Payload: { sessionId: 'string', previewChannel: number, previewLayer: number, targetCasparServerId: 'uuid', webRtcUrl: 'string_url_webrtc' }.
Server -> Client: PREVIEW_SESSION_UNAVAILABLE
Payload: { requestedProfileId: 'uuid', message: 'string' }.
Client -> Server: PREVIEW_COMMAND
Payload: { sessionId: 'string', commandType: 'PLAY' | 'LOADBG' | 'STOP' | 'CG_ADD' ..., commandParams: { clip, templateFile, data, etc. } }.
Logica Server: Usa sessionId per trovare la sessione attiva (activePreviewSessions), recuperare targetCasparServerId, previewChannel, previewLayer. Inoltra il comando AMCP corrispondente all'istanza CasparCG corretta.
Server -> Client: PREVIEW_OSC_DATA (instradato)
Payload: { sessionId: 'string', oscDataType: 'timecode' | 'status' ..., oscData: { ... } }.
Logica Server: Quando il server Node.js riceve dati OSC da un canale/layer di un server CasparCG usato per una preview, li inoltra tramite Socket.IO solo al client la cui sessionId è associata a quel canale/layer. Usare stanze (rooms) Socket.IO per sessionId.
Client -> Server: RELEASE_PREVIEW_SESSION
Payload: { sessionId: 'string' }.
Logica Server: Marca lo slot come libero, ferma lo stream CasparCG (REMOVE <channel>-<layer> STREAM), e (opzionale) rimuovi il path da MediaMTX.
Routing Comandi di Playout Effettivo:
Quando il client invia un comando per il playout principale (dal RundownContext):
Il client deve specificare il profile_id attivo.
Il server Node.js usa il profile_id per trovare i server CasparCG con ruoli 'MAIN_PLAYOUT' e 'BACKUP_PLAYOUT' da profile_server_assignments.
Inoltra il comando AMCP al server main (e gestisce il backup come definito).
Fase 3: Modifiche al Client React

src/contexts/CasparContext.js:
Rimuovere la gestione diretta di host e port fissi per la connessione AMCP.
La connessione e l'invio dei comandi CasparCG (sia per playout che per preview) avverranno ora tramite eventi Socket.IO inviati al server Node.js. Il CasparContext si concentrerà sull'interfaccia Socket.IO.
Le funzioni play, stop, cgAdd, ecc. del context ora invieranno eventi Socket.IO strutturati (come PLAYOUT_COMMAND o PREVIEW_COMMAND) al server Node.js, specificando il profilo attivo o la sessione di preview.
Riceverà gli PREVIEW_OSC_DATA e altri feedback dal server Node.js.
Nuovo Stato Globale o Context per il Profilo CasparCG Attivo:
L'utente deve poter selezionare un "Profilo di Configurazione CasparCG" attivo. Questo ID profilo verrà usato per le richieste al backend.
src/pages/ScaletteEditor/index.js:
All'apertura (o al cambio di profilo attivo):
Invia REQUEST_PREVIEW_SESSION al backend Node.js con l'ID del profilo CasparCG attivo.
In un useEffect, ascolta PREVIEW_SESSION_ASSIGNED e PREVIEW_SESSION_UNAVAILABLE.
Se la sessione è assegnata, memorizza sessionId, previewChannel, previewLayer, targetCasparServerId, webRtcUrl nello stato del componente.
Passa webRtcUrl a PreviewPlayer.js.
Le funzioni handlePlayItem, handlePlayTemplate, ecc., ora invieranno un evento PREVIEW_COMMAND al server Node.js, includendo sessionId e i parametri del comando (il server Node.js saprà a quale CasparCG e canale/layer inoltrarlo).
Alla chiusura, invia RELEASE_PREVIEW_SESSION.
src/pages/ScaletteEditor/hooks/usePreviewPlayer.js:
Non userà più previewChannel fisso. Riceverà previewChannel e previewLayer dinamicamente dalla props (passate da ScaletteEditor/index.js dopo l'assegnazione della sessione).
L'ascolto dei dati OSC avverrà tramite il CasparContext che ora riceve dati OSC instradati dal server Node.js per la sessionId corrente.
src/pages/Rundown/RundownPage.js (e RundownContext.js):
Quando si esegue il playout dal rundown principale, i comandi verranno inviati al server Node.js specificando il profilo CasparCG attivo, e il Node.js li instraderà al server CasparCG 'MAIN_PLAYOUT' (e 'BACKUP_PLAYOUT') di quel profilo.