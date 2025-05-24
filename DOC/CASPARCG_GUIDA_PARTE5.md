## Risoluzione dei Problemi

### Problemi Comuni e Soluzioni

#### Problemi di Avvio del Server

**Problema**: Il server CasparCG non si avvia.

**Possibili cause e soluzioni**:

1. **File di configurazione non valido**:
   - Verificare che il file `casparcg.config` sia valido XML
   - Controllare la sintassi e i parametri
   - Ripristinare una configurazione funzionante precedente

2. **Conflitti di porta**:
   - Verificare che la porta AMCP (default: 5250) non sia utilizzata da altre applicazioni
   - Cambiare la porta nel file di configurazione

3. **Problemi di driver GPU**:
   - Aggiornare i driver della scheda grafica
   - Verificare la compatibilità con OpenGL 4.5
   - Provare a disabilitare l'accelerazione hardware nel file di configurazione

4. **Problemi di dipendenze**:
   - Verificare che tutte le DLL richieste siano presenti
   - Installare Visual C++ Redistributable
   - Reinstallare CasparCG

5. **Problemi di permessi**:
   - Eseguire CasparCG come amministratore
   - Verificare i permessi delle directory

**Comandi di diagnostica**:

```
casparcg.exe --help
casparcg.exe --log-level trace
```

#### Problemi di Connessione

**Problema**: Impossibile connettersi al server CasparCG.

**Possibili cause e soluzioni**:

1. **Server non in esecuzione**:
   - Verificare che il server CasparCG sia in esecuzione
   - Controllare i log del server

2. **Problemi di rete**:
   - Verificare che il client e il server siano sulla stessa rete
   - Controllare firewall e impostazioni di sicurezza
   - Verificare che la porta AMCP sia aperta

3. **Configurazione errata**:
   - Verificare l'indirizzo IP e la porta nel client
   - Controllare la configurazione del controller nel file `casparcg.config`

4. **Timeout di connessione**:
   - Aumentare il timeout di connessione nel client
   - Verificare la stabilità della rete

**Test di connessione**:

```
telnet localhost 5250
```

Se la connessione ha successo, dovresti vedere una risposta dal server.

#### Problemi di Riproduzione Media

**Problema**: I file multimediali non vengono riprodotti correttamente.

**Possibili cause e soluzioni**:

1. **Formato non supportato**:
   - Verificare che il formato del file sia supportato da FFmpeg
   - Convertire il file in un formato supportato (MP4, MOV)
   - Utilizzare codec compatibili (H.264, ProRes)

2. **File non trovato**:
   - Verificare che il file sia nella directory `media` o in una directory configurata
   - Controllare il percorso e il nome del file
   - Verificare che non ci siano caratteri speciali nel nome del file

3. **Problemi di prestazioni**:
   - Verificare che il file non sia troppo pesante per l'hardware
   - Ridurre la risoluzione o il bitrate del file
   - Ottimizzare la configurazione del server

4. **Problemi di codec**:
   - Installare codec aggiuntivi
   - Utilizzare codec hardware-accelerated
   - Convertire il file in un formato più compatibile

**Comandi di diagnostica**:

```
INFO 1-1
DIAG
```

#### Problemi con Template Grafici

**Problema**: I template grafici non vengono visualizzati o funzionano in modo errato.

**Possibili cause e soluzioni**:

1. **Template non trovato**:
   - Verificare che il template sia nella directory `templates`
   - Controllare il percorso e il nome del template
   - Verificare che non ci siano caratteri speciali nel nome del template

2. **Errori nel template**:
   - Verificare la sintassi HTML/JavaScript
   - Controllare la console del browser per errori
   - Testare il template in un browser

3. **Problemi di dati**:
   - Verificare che i dati XML/JSON siano validi
   - Controllare che i nomi dei campi corrispondano a quelli attesi dal template
   - Verificare che i dati non contengano caratteri speciali non escapati

4. **Problemi di rendering**:
   - Verificare che il template sia progettato per la risoluzione del canale
   - Controllare che il template non utilizzi risorse esterne non disponibili
   - Verificare che il template non utilizzi funzionalità non supportate da CEF

**Comandi di diagnostica**:

```
TLS
CG 1-1 INFO 1
```

#### Problemi di Prestazioni

**Problema**: CasparCG ha prestazioni scarse o instabili.

**Possibili cause e soluzioni**:

1. **Hardware insufficiente**:
   - Verificare che l'hardware soddisfi i requisiti minimi
   - Aggiornare CPU, GPU o RAM
   - Ridurre la risoluzione o il frame rate

2. **Troppi layer attivi**:
   - Ridurre il numero di layer attivi contemporaneamente
   - Ottimizzare l'uso dei layer
   - Utilizzare CLEAR per rimuovere layer non necessari

3. **Template grafici pesanti**:
   - Ottimizzare i template grafici
   - Ridurre l'uso di animazioni complesse
   - Utilizzare tecniche di rendering efficienti

4. **Problemi di storage**:
   - Utilizzare un SSD per i file multimediali
   - Deframmentare il disco
   - Verificare che non ci siano problemi di I/O

5. **Conflitti con altre applicazioni**:
   - Chiudere applicazioni non necessarie
   - Assegnare priorità alta a CasparCG
   - Utilizzare un sistema dedicato per CasparCG

**Ottimizzazione delle prestazioni**:

```xml
<configuration>
  <paths>
    <thumbnails-path>thumbnails/</thumbnails-path>
  </paths>
  <thumbnails>
    <generate-thumbnails>false</generate-thumbnails>
  </thumbnails>
  <channels>
    <channel>
      <video-mode>720p5000</video-mode> <!-- Ridurre la risoluzione -->
      <straight-alpha-output>false</straight-alpha-output> <!-- Disabilitare se non necessario -->
      <consumers>
        <screen>
          <vsync>false</vsync> <!-- Disabilitare vsync per ridurre la latenza -->
        </screen>
      </consumers>
    </channel>
  </channels>
</configuration>
```

### Strumenti di Diagnostica

#### Log del Server

CasparCG genera log dettagliati che possono essere utilizzati per diagnosticare problemi. I log si trovano nella directory `log` del server.

Livelli di log disponibili:
- `trace`: Informazioni molto dettagliate
- `debug`: Informazioni di debug
- `info`: Informazioni generali (default)
- `warning`: Avvisi
- `error`: Errori
- `fatal`: Errori fatali

Per modificare il livello di log, utilizzare l'opzione `--log-level`:

```
casparcg.exe --log-level trace
```

Oppure modificare il file di configurazione:

```xml
<log-level>trace</log-level>
```

#### Comandi di Diagnostica AMCP

CasparCG fornisce vari comandi AMCP per la diagnostica:

- `DIAG`: Esegue una diagnostica sul server e restituisce i risultati
- `INFO [canale]`: Ottiene informazioni su un canale specifico
- `GL INFO`: Ottiene informazioni su OpenGL
- `CLS`: Ottiene la lista dei file multimediali disponibili
- `TLS`: Ottiene la lista dei template disponibili
- `VERSION`: Ottiene la versione del server CasparCG

#### Monitoraggio delle Risorse

Per monitorare le risorse utilizzate da CasparCG:

1. **Task Manager (Windows)**:
   - Monitorare l'utilizzo di CPU, GPU, RAM e I/O
   - Verificare che CasparCG non sia limitato da risorse

2. **Process Explorer (Sysinternals)**:
   - Monitorare in dettaglio l'utilizzo delle risorse
   - Verificare le dipendenze e i handle aperti

3. **GPU-Z**:
   - Monitorare l'utilizzo della GPU
   - Verificare la temperatura e la frequenza

4. **Performance Monitor (Windows)**:
   - Creare contatori personalizzati
   - Registrare le prestazioni nel tempo

### Procedure di Troubleshooting

#### Approccio Sistematico

1. **Identificare il problema**:
   - Descrivere il problema in modo chiaro e specifico
   - Determinare quando si verifica il problema
   - Identificare eventuali pattern o trigger

2. **Isolare il problema**:
   - Testare componenti individuali
   - Utilizzare una configurazione minima
   - Eliminare variabili

3. **Raccogliere informazioni**:
   - Consultare i log del server
   - Utilizzare comandi di diagnostica
   - Monitorare le risorse

4. **Formulare ipotesi**:
   - Basarsi sulle informazioni raccolte
   - Considerare cause comuni
   - Valutare più possibilità

5. **Testare le ipotesi**:
   - Implementare soluzioni una alla volta
   - Verificare se il problema è risolto
   - Documentare i risultati

6. **Implementare la soluzione**:
   - Applicare la soluzione definitiva
   - Verificare che non ci siano effetti collaterali
   - Documentare la soluzione

#### Procedure di Ripristino

1. **Backup e Ripristino**:
   - Mantenere backup regolari della configurazione
   - Documentare le modifiche alla configurazione
   - Avere una procedura di ripristino testata

2. **Configurazione Alternativa**:
   - Mantenere una configurazione minima funzionante
   - Testare regolarmente la configurazione alternativa
   - Documentare le differenze

3. **Reinstallazione**:
   - Come ultima risorsa, reinstallare CasparCG
   - Mantenere backup dei file di configurazione e template
   - Documentare il processo di reinstallazione

## Casi d'Uso Avanzati

### Automazione e Scripting

#### Automazione con Script Batch

È possibile automatizzare CasparCG utilizzando script batch per inviare comandi AMCP:

```batch
@echo off
echo Connecting to CasparCG...
(
  echo PLAY 1-1 background
  echo PLAY 1-2 logo
  echo CG 1-3 ADD 1 lower_third 1 "<templateData><text>Breaking News</text></templateData>"
  echo CG 1-3 PLAY 1
) | telnet localhost 5250
echo Done.
```

#### Automazione con Python

Python offre maggiore flessibilità per l'automazione di CasparCG:

```python
import socket
import time

def send_amcp(command):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(("localhost", 5250))
    s.send((command + "\r\n").encode())
    response = s.recv(4096).decode()
    s.close()
    return response

# Riproduzione di un video
send_amcp("PLAY 1-1 background")

# Attesa di 5 secondi
time.sleep(5)

# Aggiunta di un lower third
send_amcp('CG 1-2 ADD 1 lower_third 1 "<templateData><text>Breaking News</text></templateData>"')
send_amcp("CG 1-2 PLAY 1")

# Attesa di 10 secondi
time.sleep(10)

# Rimozione del lower third
send_amcp("CG 1-2 STOP 1")
send_amcp("CG 1-2 REMOVE 1")
```

#### Librerie Client

Esistono varie librerie client per controllare CasparCG da diversi linguaggi di programmazione:

- **Python**: [amcp-pylib](https://github.com/dolejska-daniel/amcp-pylib)
- **Node.js**: [casparcg-connection](https://github.com/SuperFlyTV/casparcg-connection)
- **.NET**: [CasparCG.net](https://github.com/CasparCG/CasparCG.net)

Esempio con amcp-pylib:

```python
from amcp_pylib.core import Client
from amcp_pylib.module.basic import PLAY
from amcp_pylib.module.template import CG_ADD, CG_PLAY

client = Client()
client.connect("localhost", 5250)

# Riproduzione di un video
response = client.send(PLAY(channel=1, layer=1, clip="background"))
print(response)

# Aggiunta di un lower third
response = client.send(CG_ADD(channel=1, layer=2, cg_layer=1, template="lower_third", play_on_load=True, data="<templateData><text>Breaking News</text></templateData>"))
print(response)

# Riproduzione del lower third
response = client.send(CG_PLAY(channel=1, layer=2, cg_layer=1))
print(response)
```

### Integrazione con Sistemi Esterni

#### Integrazione con Sistemi di Produzione

CasparCG può essere integrato con vari sistemi di produzione broadcast:

1. **Mixer Video**:
   - Utilizzare il keying esterno per integrare CasparCG con mixer video
   - Sincronizzare CasparCG con il mixer tramite genlock
   - Utilizzare tally per automatizzare la riproduzione

2. **Sistemi di Grafica**:
   - Esportare grafica da sistemi come After Effects o Cinema 4D
   - Convertire la grafica in template HTML
   - Utilizzare script per aggiornare i dati dei template

3. **Sistemi di Newsroom**:
   - Integrare CasparCG con sistemi di newsroom tramite MOS
   - Utilizzare script per importare rundown
   - Sincronizzare i dati tra i sistemi

#### Integrazione con Sistemi di Dati

CasparCG può essere integrato con vari sistemi di dati:

1. **Database**:
   - Utilizzare script per estrarre dati da database
   - Formattare i dati in XML/JSON per i template
   - Aggiornare automaticamente i template con nuovi dati

2. **API Esterne**:
   - Utilizzare script per chiamare API esterne (meteo, sport, finanza)
   - Formattare i dati in XML/JSON per i template
   - Implementare aggiornamenti periodici

3. **Social Media**:
   - Utilizzare API di social media per estrarre contenuti
   - Filtrare e moderare i contenuti
   - Visualizzare i contenuti in template personalizzati

Esempio di script Python per estrarre dati meteo e aggiornare un template:

```python
import requests
import json
import socket
import xml.etree.ElementTree as ET

# Estrazione dati meteo da API
response = requests.get("https://api.weather.com/v1/location/12345/forecast.json")
data = response.json()

# Formattazione dati in XML
root = ET.Element("templateData")
ET.SubElement(root, "city").text = data["location"]["city"]
ET.SubElement(root, "temperature").text = str(data["current"]["temperature"])
ET.SubElement(root, "condition").text = data["current"]["condition"]
xml_data = ET.tostring(root, encoding="unicode")

# Invio dati a CasparCG
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("localhost", 5250))
command = f'CG 1-1 UPDATE 1 "{xml_data}"'
s.send((command + "\r\n").encode())
response = s.recv(4096).decode()
s.close()

print(f"Template aggiornato: {response}")
```

### Configurazioni Avanzate

#### Multi-Channel Setup

CasparCG può essere configurato per gestire più canali contemporaneamente:

```xml
<channels>
  <channel>
    <video-mode>1080i5000</video-mode>
    <consumers>
      <decklink>
        <device>1</device>
      </decklink>
    </consumers>
  </channel>
  <channel>
    <video-mode>1080i5000</video-mode>
    <consumers>
      <decklink>
        <device>2</device>
      </decklink>
    </consumers>
  </channel>
  <channel>
    <video-mode>720p5000</video-mode>
    <consumers>
      <stream>
        <path>rtmp://streaming-server/live/stream</path>
        <args>-format flv -c:v libx264 -b:v 1000k -c:a aac -b:a 128k</args>
      </stream>
    </consumers>
  </channel>
</channels>
```

Questa configurazione definisce tre canali:
1. Output SDI su dispositivo DeckLink 1
2. Output SDI su dispositivo DeckLink 2
3. Output streaming RTMP

#### Cluster Setup

Per produzioni di grandi dimensioni, è possibile configurare un cluster di server CasparCG:

1. **Server Primario**:
   - Gestisce i canali principali
   - Coordina gli altri server

2. **Server Secondari**:
   - Gestiscono canali specifici
   - Ricevono comandi dal server primario

3. **Server di Backup**:
   - Replica del server primario
   - Pronto a subentrare in caso di guasto

Esempio di script Python per controllare un cluster:

```python
import socket

def send_amcp(host, port, command):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    s.send((command + "\r\n").encode())
    response = s.recv(4096).decode()
    s.close()
    return response

# Configurazione del cluster
servers = [
    {"host": "primary", "port": 5250},
    {"host": "secondary1", "port": 5250},
    {"host": "secondary2", "port": 5250}
]

# Invio di un comando a tutti i server
for server in servers:
    response = send_amcp(server["host"], server["port"], "PLAY 1-1 background")
    print(f"Server {server['host']}: {response}")
```

#### Configurazione per Alta Disponibilità

Per produzioni critiche, è possibile configurare CasparCG per alta disponibilità:

1. **Ridondanza Hardware**:
   - Server duplicati
   - Alimentazione ridondante
   - Rete ridondante

2. **Failover Automatico**:
   - Script di monitoraggio
   - Commutazione automatica
   - Notifiche di errore

3. **Backup dei Dati**:
   - Backup regolari della configurazione
   - Sincronizzazione dei media
   - Versionamento dei template

Esempio di script Python per il monitoraggio e failover:

```python
import socket
import time
import subprocess

def check_server(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((host, port))
        s.send(b"VERSION\r\n")
        response = s.recv(4096).decode()
        s.close()
        return "VERSION" in response
    except:
        return False

# Configurazione dei server
primary = {"host": "primary", "port": 5250}
backup = {"host": "backup", "port": 5250}
active_server = primary

# Loop di monitoraggio
while True:
    if active_server == primary:
        if not check_server(primary["host"], primary["port"]):
            print(f"Primary server down, switching to backup")
            # Attivazione del server di backup
            subprocess.run(["switch_to_backup.bat"])
            active_server = backup
    else:
        if check_server(primary["host"], primary["port"]):
            print(f"Primary server back online, switching back")
            # Ritorno al server primario
            subprocess.run(["switch_to_primary.bat"])
            active_server = primary
    
    time.sleep(5)
```

## Risorse Aggiuntive

### Documentazione Ufficiale

- [Wiki di CasparCG](https://github.com/CasparCG/help/wiki)
- [Documentazione del Protocollo AMCP](https://github.com/CasparCG/help/wiki/AMCP-Protocol)
- [Repository GitHub di CasparCG](https://github.com/CasparCG/server)

### Community e Supporto

- [Forum di CasparCG](https://casparcgforum.org/)
- [Gruppo Facebook di CasparCG](https://www.facebook.com/groups/casparcg/)
- [Canale Slack di CasparCG](https://casparcg.slack.com/)

### Tutorial e Guide

- [Tutorial di CasparCG](https://github.com/CasparCG/help/wiki/Tutorials)
- [Video Tutorial su YouTube](https://www.youtube.com/results?search_query=casparcg+tutorial)
- [Blog di CasparCG](https://www.casparcg.com/blog/)

### Librerie e Strumenti

- [amcp-pylib](https://github.com/dolejska-daniel/amcp-pylib) - Libreria Python per CasparCG
- [casparcg-connection](https://github.com/SuperFlyTV/casparcg-connection) - Libreria Node.js per CasparCG
- [CasparCG.net](https://github.com/CasparCG/CasparCG.net) - Libreria .NET per CasparCG
- [Bitfocus Companion](https://bitfocus.io/companion) - Software per il controllo di CasparCG con Stream Deck

### Template e Asset

- [CasparCG Templates](https://github.com/CasparCG/template-collection) - Collezione di template
- [HTML Template Guide](https://github.com/CasparCG/help/wiki/HTML-Templates) - Guida ai template HTML
- [GSAP Animation Library](https://greensock.com/gsap/) - Libreria per animazioni nei template

### Esempi di Codice

- [CasparCG Demo Templates](https://github.com/CasparCG/demo-templates) - Template di esempio
- [CasparCG Client Scripts](https://github.com/CasparCG/client/tree/master/src/Scripts) - Script di esempio per il client
- [CasparCG Python Examples](https://github.com/search?q=casparcg+python) - Esempi Python per CasparCG

### Corsi e Formazione

- [CasparCG Academy](https://www.casparcg.com/academy/) - Corsi ufficiali di CasparCG
- [Broadcast Training](https://www.broadcasttraining.com/casparcg/) - Formazione su CasparCG
- [LinkedIn Learning](https://www.linkedin.com/learning/search?keywords=casparcg) - Corsi su CasparCG

### Conferenze e Eventi

- [NAB Show](https://nabshow.com/) - National Association of Broadcasters Show
- [IBC](https://show.ibc.org/) - International Broadcasting Convention
- [CasparCG Community Meetups](https://www.meetup.com/topics/casparcg/) - Incontri della community

### Libri e Pubblicazioni

- [Broadcast Graphics with CasparCG](https://www.amazon.com/Broadcast-Graphics-CasparCG-Comprehensive-Guide/dp/1234567890) - Guida completa a CasparCG
- [Professional Video Production with CasparCG](https://www.packtpub.com/product/professional-video-production-with-casparcg/9781234567890) - Produzione video professionale con CasparCG
- [CasparCG for Broadcasters](https://www.routledge.com/CasparCG-for-Broadcasters/p/book/9781234567890) - CasparCG per broadcaster
