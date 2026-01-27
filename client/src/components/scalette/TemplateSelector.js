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
  const { connected, templateList, getTemplateList, getAllMedia, mediaList } = useCaspar();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  // 🔥 STATO COMBINATO: Template locali + remoti
  const [combinedTemplates, setCombinedTemplates] = useState([]);

  // Carica la lista dei template (remoti + locali)
  const loadTemplateList = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carica template remoti CasparCG (se connesso)
      if (connected) {
        await getTemplateList();
      }
      
      // 2. 🔥 CARICA TEMPLATE LOCALI tramite getAllMedia
      await getAllMedia();
    } catch (error) {
      console.error('Errore nel caricamento della lista dei template:', error);
    } finally {
      setLoading(false);
    }
  }, [connected, getTemplateList, getAllMedia]);

  // 🔥 COMBINA template remoti e locali
  useEffect(() => {
    const remoteTemplates = templateList || [];
    
    // 🔥 FILTRA template HTML dall'array mediaList unificato
    const localTemplates = Array.isArray(mediaList) 
      ? mediaList
          .filter(media => {
            const fileName = typeof media === 'string' ? media : (media?.name || media?.path || '');
            return fileName.toLowerCase().endsWith('.html');
          })
          .map(template => ({
            ...template,
            source: 'local',
            name: typeof template === 'string' ? template : (template?.name || template?.path || template)
          }))
      : [];
    
    // Combina entrambe le fonti
    const combined = [
      ...remoteTemplates.map(template => ({
        ...template,
        source: 'remote',
        name: typeof template === 'string' ? template : (template?.name || template?.path || template)
      })),
      ...localTemplates
    ];
    
    setCombinedTemplates(combined);
    console.log(`🔥 Template combinati: ${remoteTemplates.length} remoti + ${localTemplates.length} locali = ${combined.length} totali`);
    console.log(`🔍 TEMPLATE DEBUG - mediaList totali: ${mediaList?.length || 0}`);
    if (Array.isArray(mediaList)) {
      const htmlFiles = mediaList.filter(m => {
        const name = typeof m === 'string' ? m : (m?.name || m?.path || '');
        return name.toLowerCase().endsWith('.html');
      }).length;
      console.log(`   Template HTML trovati in mediaList: ${htmlFiles}`);
    }
  }, [templateList, mediaList]);

  // Carica la lista dei template all'avvio
  useEffect(() => {
    loadTemplateList();
  }, [loadTemplateList]);

  // Filtra i template combinati in base al termine di ricerca e al tipo
  useEffect(() => {
    if (!combinedTemplates.length) {
      setFilteredTemplates([]);
      return;
    }

    let filtered = [...combinedTemplates];

    // Filtra per termine di ricerca
    if (searchTerm) {
      filtered = filtered.filter(template => {
        const templateName = template.name || template.path || '';
        return templateName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filtra per tipo di template
    if (filterType !== 'all') {
      filtered = filtered.filter(template => {
        const templateName = template.name || template.path || '';
        const type = getTemplateType(templateName);
        return type === filterType;
      });
    }

    setFilteredTemplates(filtered);
  }, [combinedTemplates, searchTerm, filterType]);

  // Gestisce la selezione di un template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Restituisce l'icona appropriata per il tipo di template
  const getTemplateIcon = (template) => {
    const templateName = typeof template === 'string' ? template : (template?.name || template?.path || '');
    const type = getTemplateType(templateName);

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
