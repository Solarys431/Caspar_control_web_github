import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MovieIcon from '@mui/icons-material/Movie';
import BrushIcon from '@mui/icons-material/Brush';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Componente per il dialogo di anteprima degli elementi da esplodere
 *
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Funzione per chiudere il dialogo
 * @param {Array} props.items - Elementi da esplodere
 * @param {Function} props.onConfirm - Funzione chiamata quando l'utente conferma l'esplosione
 * @param {string} props.scalettaName - Nome della scaletta da esplodere
 * @param {string} props.day - Giorno della scaletta
 * @returns {JSX.Element} - Componente React
 */
const ExplodePreviewDialog = ({ open, onClose, items = [], onConfirm, scalettaName, day }) => {
  // Stato per gli elementi selezionati
  const [selectedItems, setSelectedItems] = useState([]);

  // Stato per le opzioni di esplosione
  const [explodeOptions, setExplodeOptions] = useState({
    replaceRundown: true,
    preserveSourceInfo: true,
    avoidDuplicates: true,
    recalculateStartTimes: false,
    startTimeOffset: '00:00:00'
  });

  // Stato per il filtro
  const [filter, setFilter] = useState({
    type: 'all',
    search: ''
  });

  // Stato per l'ordinamento
  const [sortBy, setSortBy] = useState('startTime');

  // Resetta gli elementi selezionati quando il dialogo viene aperto
  useEffect(() => {
    if (open) {
      // CORREZIONE: Rimuovi duplicati e assicurati che ogni ID sia unico
      const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(i => i.id === item.id)
      );

      if (uniqueItems.length !== items.length) {
        console.warn('⚠️ [EXPLODE PREVIEW] Elementi duplicati rilevati e rimossi:', {
          originalCount: items.length,
          uniqueCount: uniqueItems.length,
          duplicates: items.length - uniqueItems.length
        });
      }

      setSelectedItems(uniqueItems.map(item => item.id));
    }
  }, [open, items]);

  // CORREZIONE: Crea lista di elementi unici per evitare chiavi duplicate
  const uniqueItems = React.useMemo(() => {
    return items.filter((item, index, self) =>
      index === self.findIndex(i => i.id === item.id)
    );
  }, [items]);

  // Filtra gli elementi in base al filtro
  const filteredItems = uniqueItems.filter(item => {
    // Filtra per tipo
    if (filter.type !== 'all' && item.type !== filter.type) {
      return false;
    }

    // Filtra per testo di ricerca
    if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Ordina gli elementi in base all'ordinamento selezionato
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'startTime':
        return (a.data.startTime || '00:00:00').localeCompare(b.data.startTime || '00:00:00');
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'duration':
        return (a.data.duration || '').localeCompare(b.data.duration || '');
      default:
        return 0;
    }
  });

  // Gestisce la selezione/deselezione di tutti gli elementi
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Gestisce la selezione/deselezione di un singolo elemento
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Gestisce il cambio delle opzioni di esplosione
  const handleOptionChange = (option, value) => {
    setExplodeOptions({
      ...explodeOptions,
      [option]: value
    });
  };

  // Gestisce la conferma dell'esplosione
  const handleConfirm = () => {
    // CORREZIONE: Filtra gli elementi selezionati usando uniqueItems per evitare duplicati
    const itemsToExplode = uniqueItems.filter(item => selectedItems.includes(item.id));

    console.log('🚀 [EXPLODE PREVIEW] Conferma esplosione:', {
      totalItems: uniqueItems.length,
      selectedItems: selectedItems.length,
      itemsToExplode: itemsToExplode.length
    });

    // Chiama la funzione di conferma con gli elementi selezionati e le opzioni
    onConfirm(itemsToExplode, explodeOptions);

    // Chiude il dialogo
    onClose();
  };

  // Restituisce l'icona appropriata per il tipo di elemento
  const getItemIcon = (type) => {
    switch (type) {
      case 'MEDIA':
        return <MovieIcon fontSize="small" />;
      case 'TEMPLATE':
        return <BrushIcon fontSize="small" />;
      case 'STORY':
        return <TextFieldsIcon fontSize="small" />;
      default:
        return <PlayArrowIcon fontSize="small" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Anteprima Esplosione Scaletta: {scalettaName}
          </Typography>
          <Chip
            label={day ? format(new Date(day), 'EEEE d MMMM', { locale: it }) : 'Giorno non specificato'}
            color="primary"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Opzioni di Esplosione
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={explodeOptions.replaceRundown}
                    onChange={(e) => handleOptionChange('replaceRundown', e.target.checked)}
                    color="primary"
                  />
                }
                label="Sostituisci rundown attuale"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={explodeOptions.preserveSourceInfo}
                    onChange={(e) => handleOptionChange('preserveSourceInfo', e.target.checked)}
                    color="primary"
                  />
                }
                label="Preserva informazioni di origine"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={explodeOptions.avoidDuplicates}
                    onChange={(e) => handleOptionChange('avoidDuplicates', e.target.checked)}
                    color="primary"
                  />
                }
                label="Evita duplicati"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={explodeOptions.recalculateStartTimes}
                    onChange={(e) => handleOptionChange('recalculateStartTimes', e.target.checked)}
                    color="primary"
                  />
                }
                label="Ricalcola orari di inizio"
              />
            </Grid>
            {explodeOptions.recalculateStartTimes && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Orario di inizio"
                  type="time"
                  value={explodeOptions.startTimeOffset.substring(0, 5)}
                  onChange={(e) => handleOptionChange('startTimeOffset', `${e.target.value}:00`)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 minuti
                  }}
                  fullWidth
                  helperText="Imposta l'orario di inizio per il primo elemento"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Elementi da Esplodere ({selectedItems.length}/{items.length})
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length}
                  onChange={handleSelectAll}
                />
              }
              label="Seleziona tutti"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel id="filter-type-label">Filtra per tipo</InputLabel>
              <Select
                labelId="filter-type-label"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                label="Filtra per tipo"
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="MEDIA">Media</MenuItem>
                <MenuItem value="TEMPLATE">Template</MenuItem>
                <MenuItem value="STORY">Storia</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Cerca"
              variant="outlined"
              size="small"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              sx={{ mr: 2 }}
            />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="sort-by-label">Ordina per</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Ordina per"
              >
                <MenuItem value="startTime">Orario di inizio</MenuItem>
                <MenuItem value="name">Nome</MenuItem>
                <MenuItem value="type">Tipo</MenuItem>
                <MenuItem value="duration">Durata</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Orario di inizio</TableCell>
                <TableCell>Durata</TableCell>
                <TableCell>Dettagli</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  selected={selectedItems.includes(item.id)}
                  onClick={() => handleSelectItem(item.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item.id);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getItemIcon(item.type)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {item.type}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.data.startTime || '00:00:00'}</TableCell>
                  <TableCell>{item.data.duration || '-'}</TableCell>
                  <TableCell>
                    {item.type === 'MEDIA' && item.data.clip && (
                      <Chip size="small" label={item.data.clip.split('/').pop()} />
                    )}
                    {item.type === 'TEMPLATE' && item.data.template && (
                      <Chip size="small" label={item.data.template.split('/').pop()} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sortedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nessun elemento trovato
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={selectedItems.length === 0}
        >
          Esplodi {selectedItems.length} elementi nel Rundown
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExplodePreviewDialog;
