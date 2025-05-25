/**
 * Componente vista card per elementi della scaletta
 * Modalità Detailed View con layout a griglia e card ricche
 */
import React, { memo, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import ScalettaItemCard from './ScalettaItemCard';
import { getTypeColor } from './ItemTypeIcon';
import { ItemSelectionCheckbox } from './SelectionCheckbox';

/**
 * Opzioni di ordinamento
 */
const SORT_OPTIONS = [
  { value: 'index', label: 'Ordine Scaletta', icon: '📋' },
  { value: 'startTime', label: 'Orario Inizio', icon: '⏰' },
  { value: 'duration', label: 'Durata', icon: '⏱️' },
  { value: 'type', label: 'Tipo Elemento', icon: '🎭' },
  { value: 'name', label: 'Nome', icon: '📝' }
];

/**
 * Opzioni di filtro per tipo
 */
const TYPE_FILTERS = [
  { value: 'all', label: 'Tutti i Tipi', color: '#757575' },
  { value: 'MEDIA', label: 'Media', color: '#2196f3' },
  { value: 'TEMPLATE', label: 'Template', color: '#4caf50' },
  { value: 'STORY', label: 'Storie', color: '#ff9800' }
];

/**
 * Hook per filtri e ordinamento
 */
const useItemFiltering = (items, searchTerm, typeFilter, sortBy) => {
  return useMemo(() => {
    let filtered = [...items];

    // Filtro per ricerca testuale
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.data?.customName?.toLowerCase().includes(search) ||
        item.name?.toLowerCase().includes(search) ||
        item.data?.content?.toLowerCase().includes(search) ||
        item.data?.notes?.toLowerCase().includes(search)
      );
    }

    // Filtro per tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Ordinamento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          const timeA = a.data?.timing?.startTime || '00:00:00';
          const timeB = b.data?.timing?.startTime || '00:00:00';
          return timeA.localeCompare(timeB);

        case 'duration':
          const durA = a.data?.timing?.duration || '00:00:00';
          const durB = b.data?.timing?.duration || '00:00:00';
          return durA.localeCompare(durB);

        case 'type':
          return a.type.localeCompare(b.type);

        case 'name':
          const nameA = a.data?.customName || a.name || '';
          const nameB = b.data?.customName || b.name || '';
          return nameA.localeCompare(nameB);

        default: // 'index'
          return 0; // Mantieni ordine originale
      }
    });

    return filtered;
  }, [items, searchTerm, typeFilter, sortBy]);
};

/**
 * Componente per barra filtri e ricerca
 */
const FilterBar = memo(({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
  itemCount,
  filteredCount
}) => (
  <Box sx={{
    display: 'flex',
    gap: 2,
    mb: 3,
    p: 2,
    bgcolor: 'background.paper',
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider'
  }}>
    {/* Ricerca */}
    <TextField
      placeholder="Cerca elementi..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      size="small"
      sx={{ flexGrow: 1, maxWidth: 300 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        )
      }}
    />

    {/* Filtro tipo */}
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel>Tipo</InputLabel>
      <Select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        label="Tipo"
        startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1 }} />}
      >
        {TYPE_FILTERS.map(filter => (
          <MenuItem key={filter.value} value={filter.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: filter.color
              }} />
              {filter.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Ordinamento */}
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>Ordina per</InputLabel>
      <Select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        label="Ordina per"
        startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
      >
        {SORT_OPTIONS.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.icon} {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Contatore risultati */}
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      ml: 'auto'
    }}>
      <Chip
        label={`${filteredCount} di ${itemCount}`}
        size="small"
        variant="outlined"
        color={filteredCount < itemCount ? 'warning' : 'default'}
      />
    </Box>
  </Box>
));

FilterBar.displayName = 'FilterBar';

/**
 * Componente principale vista card
 *
 * @param {Object} props - Proprietà del componente
 * @param {Array} props.items - Array degli elementi della scaletta
 * @param {number} props.selectedItemIndex - Indice elemento selezionato
 * @param {Function} props.onSelectItem - Callback per selezione elemento
 * @param {Function} props.onEditItem - Callback per modifica elemento
 * @param {Function} props.onPlayItem - Callback per riproduzione elemento
 * @param {Function} props.onRemoveItem - Callback per rimozione elemento
 * @param {Function} props.onUpdateItem - Callback per aggiornamento elemento
 * @param {Object} props.editingStatusByItemId - Stato editing elementi
 * @param {boolean} props.canEdit - Se l'utente può modificare
 * @param {boolean} props.loading - Se in caricamento
 * @param {Set} props.selectedItemsSet - Set degli ID elementi selezionati
 * @param {Function} props.onItemSelectionChange - Callback per cambio selezione elemento
 * @returns {JSX.Element} - Componente React
 */
const ScalettaCardView = memo(({
  items = [],
  selectedItemIndex = -1,
  onSelectItem,
  onEditItem,
  onPlayItem,
  onRemoveItem,
  onUpdateItem,
  editingStatusByItemId = {},
  canEdit = true,
  loading = false,
  selectedItemsSet = new Set(),
  onItemSelectionChange,
  ...props
}) => {
  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('index');

  // Elementi filtrati e ordinati
  const filteredItems = useItemFiltering(items, searchTerm, typeFilter, sortBy);

  // Trova l'indice dell'elemento selezionato nei risultati filtrati
  const selectedItem = selectedItemIndex >= 0 ? items[selectedItemIndex] : null;
  const selectedFilteredIndex = selectedItem
    ? filteredItems.findIndex(item => item.id === selectedItem.id)
    : -1;

  // Loading skeleton
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 1 }} />
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Nessun elemento
  if (items.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        textAlign: 'center',
        color: 'text.secondary'
      }}>
        <Typography variant="h6" gutterBottom>
          📋 Nessun elemento nella scaletta
        </Typography>
        <Typography variant="body2">
          Aggiungi elementi utilizzando i pulsanti nella barra degli strumenti
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Barra filtri */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        itemCount={items.length}
        filteredCount={filteredItems.length}
      />

      {/* Nessun risultato filtrato */}
      {filteredItems.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          textAlign: 'center',
          color: 'text.secondary'
        }}>
          <Typography variant="h6" gutterBottom>
            🔍 Nessun risultato trovato
          </Typography>
          <Typography variant="body2">
            Prova a modificare i filtri di ricerca
          </Typography>
        </Box>
      ) : (
        /* Griglia card */
        <Fade in timeout={300}>
          <Grid container spacing={2}>
            {filteredItems.map((item, filteredIndex) => {
              // Trova l'indice originale dell'elemento
              const originalIndex = items.findIndex(originalItem => originalItem.id === item.id);
              const isSelected = selectedFilteredIndex === filteredIndex;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <ScalettaItemCard
                    item={item}
                    index={originalIndex}
                    selected={isSelected}
                    editingStatus={editingStatusByItemId}
                    onSelect={() => onSelectItem && onSelectItem(originalIndex)}
                    onEdit={onEditItem}
                    onPlay={onPlayItem}
                    onDelete={onRemoveItem}
                    onUpdateItem={onUpdateItem}
                    canEdit={canEdit}
                    isSelected={selectedItemsSet.has(item.id)}
                    onSelectionChange={(checked) => onItemSelectionChange && onItemSelectionChange(item.id, checked)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Fade>
      )}

      {/* Info filtri attivi */}
      {(searchTerm || typeFilter !== 'all' || sortBy !== 'index') && (
        <Box sx={{
          mt: 3,
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            Filtri attivi:
            {searchTerm && ` Ricerca: "${searchTerm}"`}
            {typeFilter !== 'all' && ` • Tipo: ${TYPE_FILTERS.find(f => f.value === typeFilter)?.label}`}
            {sortBy !== 'index' && ` • Ordinamento: ${SORT_OPTIONS.find(s => s.value === sortBy)?.label}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

ScalettaCardView.displayName = 'ScalettaCardView';

export default ScalettaCardView;
