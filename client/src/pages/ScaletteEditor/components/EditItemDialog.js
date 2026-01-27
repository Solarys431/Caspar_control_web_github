import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Alert, CircularProgress, Box
} from '@mui/material';

/**
 * Componente per il dialogo di modifica degli elementi
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Object} props.item - Elemento da modificare
 * @param {Function} props.onSave - Funzione per salvare le modifiche
 * @param {Function} props.onChange - Funzione per gestire i cambiamenti nei campi
 * @param {Function} props.onBrowseMedia - Funzione per aprire il selettore media
 * @param {Function} props.onBrowseTemplate - Funzione per aprire il selettore template
 * @param {Function} props.startEditingItem - Funzione per iniziare la modifica di un elemento
 * @param {Function} props.stopEditingItem - Funzione per terminare la modifica di un elemento
 * @param {string} props.userRole - Ruolo dell'utente per la scaletta corrente
 * @returns {JSX.Element} - Componente React
 */
const EditItemDialog = ({
  open,
  onClose,
  item,
  onSave,
  onChange,
  onBrowseMedia,
  onBrowseTemplate,
  startEditingItem,
  stopEditingItem,
  userRole = ''
}) => {
  // Stati per la gestione dei conflitti
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalVersion, setOriginalVersion] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  // Stato locale per memorizzare l'item corrente
  // Questo ci permette di mantenere l'item anche se props.item diventa undefined
  const [localItem, setLocalItem] = useState(null);

  // Riferimento per tenere traccia dello stato di editing
  const editingStartedRef = useRef(false);

  // Riferimento per tenere traccia dell'ID dell'item in modifica
  const editingItemIdRef = useRef(null);

  // Verifica se l'utente può modificare la scaletta
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Aggiorna lo stato locale quando l'item cambia
  useEffect(() => {
    if (item) {
      console.log(`[DIALOG] Item aggiornato:`, { id: item.id, version: item.version });
      setLocalItem(item);
    }
  }, [item]);

  // Effetto per monitorare lo stato di props.item
  useEffect(() => {
    console.log(`[DIALOG] Stato del dialogo:`, {
      open,
      hasItem: !!item,
      hasLocalItem: !!localItem,
      editingStarted: editingStartedRef.current,
      editingItemId: editingItemIdRef.current
    });

    // Se il dialogo è aperto ma props.item è undefined mentre abbiamo un localItem,
    // mostriamo un avviso ma non chiudiamo il dialogo
    if (open && !item && localItem && editingStartedRef.current) {
      console.warn(`[DIALOG] Il dialogo è aperto ma props.item è undefined. Usando localItem.`);
      setError('Attenzione: si è verificato un problema di sincronizzazione. I dati potrebbero non essere aggiornati.');
    }
  }, [open, item, localItem]);

  // Effetto per iniziare la modifica dell'elemento quando il dialogo viene aperto
  useEffect(() => {
    let isMounted = true; // Flag per evitare aggiornamenti di stato dopo lo smontaggio

    // Funzione per iniziare la modifica
    const startEditing = async () => {
      // Utilizziamo localItem se disponibile, altrimenti props.item
      const currentItem = localItem || item;

      if (!open || !currentItem || !currentItem.id || !startEditingItem) {
        console.log(`[DIALOG] Impossibile iniziare la modifica:`, {
          open,
          hasCurrentItem: !!currentItem,
          itemId: currentItem?.id,
          hasStartEditingItem: !!startEditingItem
        });
        return;
      }

      // Evitiamo di iniziare la modifica più volte per lo stesso item
      if (editingStartedRef.current && editingItemIdRef.current === currentItem.id) {
        console.log(`[DIALOG] Modifica già iniziata per item ${currentItem.id}, ignoro`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`[DIALOG] Inizializzazione modifica per item ${currentItem.id}`);

        // Salva la versione originale dell'elemento
        setOriginalVersion(currentItem.version);

        // Salva l'ID dell'item in modifica
        editingItemIdRef.current = currentItem.id;

        // Inizia la modifica dell'elemento
        const success = await startEditingItem(currentItem.id);

        if (!isMounted) return; // Evita aggiornamenti di stato se il componente è stato smontato

        if (success) {
          // Imposta il flag di modifica iniziata
          editingStartedRef.current = true;
          console.log(`[DIALOG] Modifica iniziata con successo per item ${currentItem.id}`);
        } else {
          setError('Non è possibile modificare questo elemento al momento.');
          console.error(`[DIALOG] Impossibile iniziare la modifica per item ${currentItem.id}`);
        }
      } catch (error) {
        console.error('[DIALOG] Errore nell\'iniziare la modifica dell\'elemento:', error);
        if (isMounted) {
          setError('Errore nell\'iniziare la modifica dell\'elemento: ' + error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Se il dialogo è aperto, inizia la modifica
    if (open) {
      startEditing();
    } else {
      // Reset dello stato quando il dialogo viene chiuso
      editingStartedRef.current = false;
      editingItemIdRef.current = null;
    }

    // Pulizia quando il dialogo viene chiuso o il componente viene smontato
    return () => {
      isMounted = false;

      // Termina la modifica solo se il dialogo viene chiuso
      // (non quando il componente viene smontato per altri motivi)
      if (!open && stopEditingItem && editingStartedRef.current) {
        console.log(`[DIALOG] Terminazione modifica per item ${editingItemIdRef.current || 'sconosciuto'}`);

        // Utilizziamo setTimeout per assicurarci che questa operazione avvenga dopo
        // che il componente è stato smontato, evitando problemi di race condition
        setTimeout(() => {
          stopEditingItem().then(() => {
            console.log('[DIALOG] Modifica terminata con successo');
            // Reset dei flag solo dopo il completamento con successo
            editingStartedRef.current = false;
            editingItemIdRef.current = null;
          }).catch(error => {
            console.error('[DIALOG] Errore nel terminare la modifica dell\'elemento:', error);
            // Reset dei flag anche in caso di errore
            editingStartedRef.current = false;
            editingItemIdRef.current = null;
          });
        }, 0);
      }
    };
  }, [open, item, localItem, startEditingItem, stopEditingItem]);

  // Utilizziamo localItem se disponibile, altrimenti props.item
  const currentItem = localItem || item;

  // Se non abbiamo né props.item né localItem, non possiamo mostrare il dialogo
  if (!currentItem) {
    console.error('[DIALOG] Impossibile mostrare il dialogo: nessun item disponibile');
    return null;
  }

  const handleChange = (field, value) => {
    // Utilizziamo currentItem (che è localItem || item)
    const updatedItem = {
      ...currentItem,
      data: {
        ...currentItem.data,
        [field]: value
      }
    };

    // Aggiorniamo sia lo stato locale che lo stato del parent
    setLocalItem(updatedItem);
    onChange(updatedItem);
  };

  const handleNameChange = (value) => {
    // Utilizziamo currentItem (che è localItem || item)
    const updatedItem = {
      ...currentItem,
      name: value, // Aggiorna anche il campo name
      data: {
        ...currentItem.data,
        customName: value
      }
    };

    // Aggiorniamo sia lo stato locale che lo stato del parent
    setLocalItem(updatedItem);
    onChange(updatedItem);
  };

  const handleJsonDataChange = (value) => {
    try {
      const newData = JSON.parse(value);

      // Utilizziamo currentItem (che è localItem || item)
      const updatedItem = {
        ...currentItem,
        data: {
          ...currentItem.data,
          data: newData
        }
      };

      // Aggiorniamo sia lo stato locale che lo stato del parent
      setLocalItem(updatedItem);
      onChange(updatedItem);
    } catch (error) {
      // Non aggiornare se il JSON non è valido
      console.error('[DIALOG] JSON non valido:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Modifica Elemento</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {conflictData && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Questo elemento è stato modificato da un altro utente. Scegli come procedere:
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  console.log(`[DIALOG] Caricamento versione recente dell'item:`, conflictData.latestData);
                  // Carica i dati più recenti sia nello stato locale che nel parent
                  setLocalItem(conflictData.latestData);
                  onChange(conflictData.latestData);
                  setOriginalVersion(conflictData.latestData.version);
                  setConflictData(null);
                }}
              >
                Carica Versione Recente
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => {
                  console.log(`[DIALOG] Continuazione con la modifica corrente nonostante il conflitto`);
                  // Continua con la modifica corrente
                  setConflictData(null);
                }}
              >
                Continua Modifica
              </Button>
            </Box>
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nome"
              fullWidth
              value={currentItem.data.customName || currentItem.name}
              onChange={(e) => handleNameChange(e.target.value)}
              margin="normal"
              disabled={!canEdit || loading}
            />
          </Grid>

          {/* Campo per modificare il media o template */}
          <Grid item xs={12}>
            <TextField
              label={currentItem.type === 'MEDIA' ? "File Media" : "Template"}
              fullWidth
              value={currentItem.type === 'MEDIA' ? currentItem.data.clip : currentItem.data.template}
              onChange={(e) => {
                if (currentItem.type === 'MEDIA') {
                  // Creiamo un nuovo oggetto con i dati aggiornati
                  const updatedItem = {
                    ...currentItem,
                    name: e.target.value,
                    data: {
                      ...currentItem.data,
                      clip: e.target.value
                    }
                  };
                  // Aggiorniamo sia lo stato locale che lo stato del parent
                  setLocalItem(updatedItem);
                  onChange(updatedItem);
                } else {
                  // Creiamo un nuovo oggetto con i dati aggiornati
                  const updatedItem = {
                    ...currentItem,
                    name: e.target.value,
                    data: {
                      ...currentItem.data,
                      template: e.target.value
                    }
                  };
                  // Aggiorniamo sia lo stato locale che lo stato del parent
                  setLocalItem(updatedItem);
                  onChange(updatedItem);
                }
              }}
              margin="normal"
              disabled={!canEdit || loading}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => currentItem.type === 'MEDIA' ? onBrowseMedia(currentItem) : onBrowseTemplate(currentItem)}
              sx={{ mt: 1 }}
              disabled={!canEdit || loading}
            >
              Sfoglia...
            </Button>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Canale"
              type="number"
              fullWidth
              value={currentItem.data.channel || 1}
              onChange={(e) => handleChange('channel', parseInt(e.target.value) || 1)}
              margin="normal"
              disabled={!canEdit || loading}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Layer"
              type="number"
              fullWidth
              value={currentItem.data.layer || 10}
              onChange={(e) => handleChange('layer', parseInt(e.target.value) || 10)}
              margin="normal"
              disabled={!canEdit || loading}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label="Orario di Start"
              fullWidth
              value={currentItem.data.startTime || '00:00:00'}
              onChange={(e) => handleChange('startTime', e.target.value)}
              margin="normal"
              placeholder="00:00:00"
              disabled={!canEdit || loading}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label="Punto IN"
              fullWidth
              value={currentItem.data.inPoint || '00:00:00:00'}
              onChange={(e) => handleChange('inPoint', e.target.value)}
              margin="normal"
              placeholder="00:00:00:00"
              disabled={!canEdit || loading}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label="Punto OUT"
              fullWidth
              value={currentItem.data.outPoint || '00:00:00:00'}
              onChange={(e) => handleChange('outPoint', e.target.value)}
              margin="normal"
              placeholder="00:00:00:00"
              disabled={!canEdit || loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Note"
              fullWidth
              multiline
              rows={2}
              value={currentItem.data.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              margin="normal"
              disabled={!canEdit || loading}
            />
          </Grid>

          {currentItem.type === 'TEMPLATE' && (
            <Grid item xs={12}>
              <TextField
                label="Dati Template (JSON)"
                fullWidth
                multiline
                rows={4}
                value={JSON.stringify(currentItem.data.data || {}, null, 2)}
                onChange={(e) => handleJsonDataChange(e.target.value)}
                margin="normal"
                disabled={!canEdit || loading}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          onClick={async () => {
            if (!canEdit) {
              return;
            }

            setLoading(true);
            setError(null);

            try {
              console.log(`[DIALOG] Tentativo di salvare le modifiche per item ${currentItem.id}`);

              // Chiamiamo onSave con l'elemento corrente (localItem || item) e la versione originale
              const result = await onSave(currentItem, originalVersion);

              // Se c'è un conflitto, mostriamo l'avviso
              if (result && result.conflict) {
                console.log(`[DIALOG] Rilevato conflitto durante il salvataggio:`, result);
                setConflictData(result);
                setLoading(false);
                return;
              }

              console.log(`[DIALOG] Salvataggio completato con successo:`, result);

              // Se tutto va bene, chiudiamo il dialogo
              // Impostiamo editingStartedRef.current = false prima di chiudere il dialogo
              // per evitare che stopEditingItem venga chiamato due volte
              editingStartedRef.current = false;
              onClose();
            } catch (error) {
              console.error('[DIALOG] Errore durante il salvataggio:', error);
              setError('Errore durante il salvataggio: ' + error.message);
              setLoading(false);
            }
          }}
          disabled={!canEdit || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Salva Modifiche'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
