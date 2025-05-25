import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import MovieIcon from '@mui/icons-material/Movie';
import TemplateIcon from '@mui/icons-material/BrushOutlined';
import ArticleIcon from '@mui/icons-material/Article';
import SendIcon from '@mui/icons-material/Send';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableViewIcon from '@mui/icons-material/TableView';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import ViewModeToggle from './ViewModeToggle';
import { SelectAllCheckbox, SelectionStats } from './SelectionCheckbox';

/**
 * Componente per la barra degli strumenti della tabella scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {Function} props.onAddMedia - Funzione per aggiungere un media
 * @param {Function} props.onAddTemplate - Funzione per aggiungere un template
 * @param {Function} props.onAddStory - Funzione per aggiungere una storia vuota
 * @param {Function} props.onSearch - Funzione per la ricerca
 * @param {Function} props.onConfigureColumns - Funzione per configurare le colonne
 * @param {Array} props.columns - Array delle colonne disponibili
 * @param {Array} props.visibleColumns - Array delle colonne visibili
 * @param {Function} props.onColumnVisibilityChange - Funzione per cambiare la visibilità delle colonne
 * @param {string} props.userRole - Ruolo dell'utente per la scaletta
 * @param {Function} props.onSendToRundown - Funzione per inviare la scaletta al rundown
 * @param {Function} props.onSendToCalendar - Funzione per inviare la scaletta al calendario settimanale
 * @param {boolean} props.isPlayoutOperator - Se l'utente è un operatore di playout
 * @param {string} props.viewMode - Modalità di visualizzazione corrente ('table' | 'timeline')
 * @param {Function} props.onViewModeChange - Funzione per cambiare la modalità di visualizzazione
 * @param {string} props.tableViewMode - Modalità vista tabella ('compact' | 'detailed')
 * @param {Function} props.onTableViewModeChange - Funzione per cambiare modalità vista tabella
 * @param {number} props.itemCount - Numero di elementi nella scaletta
 * @param {string} props.selectAllState - Stato selezione tutti ('none' | 'partial' | 'all')
 * @param {Function} props.onSelectAllChange - Funzione per selezionare/deselezionare tutti
 * @param {Object} props.selectionStats - Statistiche selezione elementi
 * @param {boolean} props.hasSelection - Se ci sono elementi selezionati
 * @returns {JSX.Element} - Componente React
 */
const ScalettaTableToolbar = ({
  onAddMedia,
  onAddTemplate,
  onAddStory,
  onSearch,
  onConfigureColumns,
  columns = [],
  visibleColumns = [],
  onColumnVisibilityChange,
  userRole = '',
  onSendToRundown,
  onSendToCalendar,
  isPlayoutOperator = false,
  viewMode = 'table',
  onViewModeChange,
  tableViewMode = 'compact',
  onTableViewModeChange,
  itemCount = 0,
  selectAllState = 'none',
  onSelectAllChange,
  selectionStats = { total: 0, byType: {}, percentage: 0 },
  hasSelection = false
}) => {
  // Stati per i menu
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [columnsPopoverAnchor, setColumnsPopoverAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // Verifica se l'utente può modificare la scaletta
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Verifica se l'utente può inviare la scaletta al rundown
  const canSendToRundown = userRole === 'owner' || userRole === 'playout_operator' || isPlayoutOperator;

  // Gestione del menu "Aggiungi"
  const handleAddMenuOpen = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  // Gestione del popover delle colonne
  const handleColumnsPopoverOpen = (event) => {
    setColumnsPopoverAnchor(event.currentTarget);
  };

  const handleColumnsPopoverClose = () => {
    setColumnsPopoverAnchor(null);
  };

  // Gestione della ricerca
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Gestione del cambio di visibilità delle colonne
  const handleColumnToggle = (columnId) => {
    if (onColumnVisibilityChange) {
      const newVisibleColumns = visibleColumns.includes(columnId)
        ? visibleColumns.filter(id => id !== columnId)
        : [...visibleColumns, columnId];
      onColumnVisibilityChange(newVisibleColumns);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Sezione sinistra: Checkbox Seleziona Tutti e Pulsanti di aggiunta */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Checkbox Seleziona Tutti (solo in modalità table) */}
        {viewMode === 'table' && (
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SelectAllCheckbox
              state={selectAllState}
              onChange={onSelectAllChange}
              totalItems={itemCount}
              selectedItems={selectionStats.total}
              showLabel={false}
              size="small"
            />
            {hasSelection && (
              <SelectionStats
                stats={selectionStats}
                showDetails={false}
                variant="text"
              />
            )}
          </Box>
        )}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddMenuOpen}
          disabled={!canEdit}
          size="small"
          sx={{ mr: 1 }}
        >
          Aggiungi
        </Button>
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={handleAddMenuClose}
        >
          <MenuItem onClick={() => { onAddStory(); handleAddMenuClose(); }}>
            <ArticleIcon fontSize="small" sx={{ mr: 1 }} />
            Nuova Storia
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onAddMedia(); handleAddMenuClose(); }}>
            <MovieIcon fontSize="small" sx={{ mr: 1 }} />
            Media
          </MenuItem>
          <MenuItem onClick={() => { onAddTemplate(); handleAddMenuClose(); }}>
            <TemplateIcon fontSize="small" sx={{ mr: 1 }} />
            Template
          </MenuItem>
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Toggle modalità visualizzazione principale */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(event, newViewMode) => {
            if (newViewMode !== null && onViewModeChange) {
              onViewModeChange(newViewMode);
            }
          }}
          size="small"
          sx={{ mr: 2 }}
        >
          <ToggleButton value="table">
            <Tooltip title="Vista Tabella/Card">
              <TableViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="timeline">
            <Tooltip title="Vista Timeline">
              <TimelineIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Toggle modalità vista tabella (solo se in modalità table) */}
        {viewMode === 'table' && (
          <ViewModeToggle
            value={tableViewMode}
            onChange={onTableViewModeChange}
            itemCount={itemCount}
            size="small"
            showRecommendation={true}
          />
        )}

        <TextField
          placeholder="Cerca..."
          size="small"
          value={searchValue}
          onChange={handleSearchChange}
          sx={{ width: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Sezione destra: Bottoni per inviare al rundown e al calendario, filtri e configurazione colonne */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Bottone per inviare al rundown */}
        <Tooltip title={hasSelection ? `Invia ${selectionStats.total} elementi selezionati al Rundown` : "Invia al Rundown"}>
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlaylistPlayIcon />}
              onClick={onSendToRundown}
              disabled={!canSendToRundown}
              sx={{ mr: 1 }}
            >
              Rundown{hasSelection ? ` (${selectionStats.total})` : ''}
            </Button>
          </span>
        </Tooltip>

        {/* Bottone per inviare al calendario */}
        <Tooltip title="Invia al Calendario">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarMonthIcon />}
              onClick={onSendToCalendar}
              disabled={!canEdit}
              sx={{ mr: 1 }}
            >
              Calendario
            </Button>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Tooltip title="Filtra elementi">
          <IconButton
            size="small"
            onClick={() => {
              // Apre un dialogo di filtro o mostra un menu di filtro
              alert('Funzionalità di filtro in fase di sviluppo');
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Configura colonne">
          <IconButton size="small" onClick={handleColumnsPopoverOpen}>
            <ViewColumnIcon />
          </IconButton>
        </Tooltip>

        <Popover
          open={Boolean(columnsPopoverAnchor)}
          anchorEl={columnsPopoverAnchor}
          onClose={handleColumnsPopoverClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 250 }}>
            <Typography variant="subtitle1" gutterBottom>
              Colonne Visibili
            </Typography>
            <FormGroup>
              {columns.map((column) => (
                <FormControlLabel
                  key={column.id}
                  control={
                    <Checkbox
                      checked={visibleColumns.includes(column.id)}
                      onChange={() => handleColumnToggle(column.id)}
                      size="small"
                    />
                  }
                  label={column.label}
                />
              ))}
            </FormGroup>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default ScalettaTableToolbar;
