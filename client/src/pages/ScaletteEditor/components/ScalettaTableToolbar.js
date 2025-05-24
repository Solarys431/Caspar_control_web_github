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
  isPlayoutOperator = false
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
      {/* Sezione sinistra: Pulsanti di aggiunta */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        <Tooltip title="Invia al Rundown">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlaylistPlayIcon />}
              onClick={onSendToRundown}
              disabled={!canSendToRundown}
              sx={{ mr: 1 }}
            >
              Rundown
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
