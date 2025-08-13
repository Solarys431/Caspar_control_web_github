import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  InsertDriveFile as FileIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useCaspar } from '../../contexts/CasparContext';
import { useRundown } from '../../contexts/RundownContext';

// Funzione per determinare il tipo di template in base al nome
const getTemplateType = (filename) => {
  if (!filename) return 'unknown';

  const name = filename.toLowerCase();

  if (name.includes('ticker')) return 'ticker';
  if (name.includes('lower') || name.includes('third')) return 'lowerthird';
  if (name.includes('logo')) return 'logo';
  if (name.includes('text')) return 'text';

  return 'other';
};

// Componente per il browser dei template
const TemplateBrowser = ({ onSelectTemplate }) => {
  const { connected, templateList, getTemplateList } = useCaspar();
  const { addTemplate } = useRundown();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);

  // Carica la lista dei template
  const loadTemplateList = useCallback(async () => {
    if (!connected) return;

    setLoading(true);
    try {
      await getTemplateList();
    } catch (error) {
      console.error('Errore nel caricamento della lista dei template:', error);
    } finally {
      setLoading(false);
    }
  }, [connected, getTemplateList]);

  // Carica la lista dei template all'avvio e quando cambia lo stato di connessione
  useEffect(() => {
    if (connected) {
      loadTemplateList();
    }
  }, [connected, loadTemplateList]);

  // Filtra i template in base al termine di ricerca e al tipo di filtro
  useEffect(() => {
    if (!templateList) {
      setFilteredTemplates([]);
      return;
    }

    let filtered = templateList;

    // Applica il filtro di ricerca
    if (searchTerm) {
      filtered = filtered.filter(template => {
        const templateName = typeof template === 'string' ? template : (template?.name || template?.path || '');
        return templateName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Applica il filtro per tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(template => {
        const templateName = typeof template === 'string' ? template : (template?.name || template?.path || '');
        return getTemplateType(templateName) === filterType;
      });
    }

    setFilteredTemplates(filtered);
  }, [templateList, searchTerm, filterType]);

  // Gestisce la selezione di un template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Gestisce l'aggiunta di un template al rundown
  const handleAddToRundown = async (template) => {
    try {
      // Determina i dati predefiniti in base al tipo di template
      let defaultData = {};
      const templateName = typeof template === 'string' ? template : (template?.name || template?.path || '');
      const templateType = getTemplateType(templateName);

      switch (templateType) {
        case 'ticker':
          defaultData = { text: 'Testo del ticker' };
          break;
        case 'lowerthird':
          defaultData = { title: 'Titolo', subtitle: 'Sottotitolo' };
          break;
        case 'logo':
          defaultData = { position: 'topright' };
          break;
        case 'text':
          defaultData = { text: 'Testo semplice' };
          break;
        default:
          defaultData = {};
      }

      const templatePath = typeof template === 'string' ? template : (template?.path || template?.name || template);
      const templateName = typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto');
      const templateData = {
        template: templatePath,
        name: templateName,
        channel: 1,
        layer: 20,
        cgLayer: 1,
        data: defaultData
      };

      await addTemplate(templateData);
    } catch (error) {
      console.error('Errore nell\'aggiunta del template al rundown:', error);
    }
  };

  // Gestisce l'apertura del menu di filtro
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  // Gestisce la chiusura del menu di filtro
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  // Gestisce la selezione di un filtro
  const handleFilterSelect = (type) => {
    setFilterType(type);
    handleFilterMenuClose();
  };

  // Restituisce l'icona appropriata per il tipo di template
  // Nota: attualmente usiamo sempre la stessa icona indipendentemente dal tipo di template
  const getTemplateIcon = () => {
    return <CodeIcon />;
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Browser Template</Typography>

        <Box>
          <Tooltip title="Aggiorna lista template">
            <IconButton onClick={loadTemplateList} disabled={loading || !connected}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Filtra per tipo">
            <IconButton onClick={handleFilterMenuOpen}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Cerca template..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
      />

      {filterType !== 'all' && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Filtro: ${filterType}`}
            onDelete={() => setFilterType('all')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              {connected ? 'Nessun template trovato' : 'Connettiti a CasparCG per visualizzare i template'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={typeof template === 'string' ? template : (template?.name || template?.path || `template-${Math.random()}`)}>
                <Card
                  sx={{
                    bgcolor: selectedTemplate === template ? 'primary.dark' : 'background.paper',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardActionArea onClick={() => handleSelectTemplate(template)}>
                    <CardContent sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTemplateIcon(template)}
                        <Typography variant="body2" sx={{ ml: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {typeof template === 'string' ? template : (template?.name || template?.path || 'Template sconosciuto')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                    <Tooltip title="Aggiungi al rundown">
                      <IconButton size="small" onClick={() => handleAddToRundown(template)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Anteprima">
                      <IconButton size="small" onClick={() => console.log('Preview', template)}>
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Menu di filtro */}
      <Menu
        anchorEl={filterMenuAnchorEl}
        open={Boolean(filterMenuAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={() => handleFilterSelect('all')}>
          <ListItemIcon>
            <FileIcon />
          </ListItemIcon>
          <ListItemText primary="Tutti i template" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('ticker')}>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Ticker" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('lowerthird')}>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Lower Third" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('logo')}>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Logo" />
        </MenuItem>
        <MenuItem onClick={() => handleFilterSelect('text')}>
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="Testo" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default TemplateBrowser;
