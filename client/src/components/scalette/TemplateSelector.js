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
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  BrushOutlined as TemplateIcon,
  TextFields as TextIcon,
  Title as LowerThirdIcon,
  ViewCarousel as TickerIcon,
  Image as LogoIcon,
  // FilterList non viene utilizzato, lo rimuoviamo
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useCaspar } from '../../contexts/CasparContext';

// Funzione per determinare il tipo di template
const getTemplateType = (templateName) => {
  if (!templateName) return 'generic';
  const name = templateName.toLowerCase();
  if (name.includes('ticker')) return 'ticker';
  if (name.includes('lower') && name.includes('third')) return 'lower_third';
  if (name.includes('logo')) return 'logo';
  if (name.includes('text')) return 'text';
  return 'generic';
};

// Componente per la selezione dei template
const TemplateSelector = ({ onSelectTemplate }) => {
  const { connected, templateList, getTemplateList } = useCaspar();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterType, setFilterType] = useState('all');

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

  // Filtra i template in base al termine di ricerca e al tipo
  useEffect(() => {
    if (!templateList) {
      setFilteredTemplates([]);
      return;
    }

    let filtered = [...templateList];

    // Filtra per termine di ricerca
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtra per tipo di template
    if (filterType !== 'all') {
      filtered = filtered.filter(template => {
        const type = getTemplateType(template);
        return type === filterType;
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

  // Restituisce l'icona appropriata per il tipo di template
  const getTemplateIcon = (template) => {
    const type = getTemplateType(template);

    switch (type) {
      case 'ticker':
        return <TickerIcon fontSize="small" />;
      case 'lower_third':
        return <LowerThirdIcon fontSize="small" />;
      case 'logo':
        return <LogoIcon fontSize="small" />;
      case 'text':
        return <TextIcon fontSize="small" />;
      default:
        return <TemplateIcon fontSize="small" />;
    }
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
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Cerca template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          size="small"
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Tutti"
          onClick={() => setFilterType('all')}
          color={filterType === 'all' ? 'primary' : 'default'}
          variant={filterType === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Ticker"
          onClick={() => setFilterType('ticker')}
          color={filterType === 'ticker' ? 'primary' : 'default'}
          variant={filterType === 'ticker' ? 'filled' : 'outlined'}
          icon={<TickerIcon />}
        />
        <Chip
          label="Lower Third"
          onClick={() => setFilterType('lower_third')}
          color={filterType === 'lower_third' ? 'primary' : 'default'}
          variant={filterType === 'lower_third' ? 'filled' : 'outlined'}
          icon={<LowerThirdIcon />}
        />
        <Chip
          label="Logo"
          onClick={() => setFilterType('logo')}
          color={filterType === 'logo' ? 'primary' : 'default'}
          variant={filterType === 'logo' ? 'filled' : 'outlined'}
          icon={<LogoIcon />}
        />
        <Chip
          label="Testo"
          onClick={() => setFilterType('text')}
          color={filterType === 'text' ? 'primary' : 'default'}
          variant={filterType === 'text' ? 'filled' : 'outlined'}
          icon={<TextIcon />}
        />
      </Box>

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
              <Grid item xs={12} sm={6} md={4} lg={3} key={template}>
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
                          {template}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                    <Tooltip title="Seleziona">
                      <IconButton size="small" onClick={() => handleSelectTemplate(template)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};

export default TemplateSelector;
