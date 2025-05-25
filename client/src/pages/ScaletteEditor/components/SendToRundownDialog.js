/**
 * Dialogo di conferma per l'invio selettivo di elementi al rundown
 * Include riepilogo elementi, gestione sovrascritture e opzioni avanzate
 */
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlaylistPlay as PlaylistPlayIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ItemTypeIcon from './ItemTypeIcon';
import StatusBadge from './StatusBadge';

/**
 * Componente per visualizzare un singolo elemento nel riepilogo
 */
const ItemSummaryCard = ({ item, index, hasConflict = false, existingItem = null }) => {
  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: hasConflict ? 'warning.main' : 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: hasConflict ? 'warning.light' : 'background.paper',
        '&:hover': {
          bgcolor: hasConflict ? 'warning.light' : 'action.hover'
        }
      }}
    >
      <ListItemIcon>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ 
            minWidth: 24, 
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'text.secondary'
          }}>
            #{index + 1}
          </Typography>
          <ItemTypeIcon type={item.type} size="small" />
        </Box>
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.data?.customName || item.name}
            </Typography>
            {hasConflict && (
              <Tooltip title="Elemento già presente nel rundown">
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {item.type === 'MEDIA' && item.data?.clip && `File: ${item.data.clip}`}
              {item.type === 'TEMPLATE' && item.data?.template && `Template: ${item.data.template}`}
              {item.type === 'STORY' && 'Storia con contenuto'}
            </Typography>
            {item.data?.timing?.duration && (
              <Chip 
                label={item.data.timing.duration} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
            )}
          </Box>
        }
      />
      
      {hasConflict && existingItem && (
        <Box sx={{ ml: 2 }}>
          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 'bold' }}>
            Sovrascriverà elemento esistente
          </Typography>
        </Box>
      )}
    </ListItem>
  );
};

/**
 * Dialogo principale per l'invio al rundown
 * 
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.open - Se il dialogo è aperto
 * @param {Function} props.onClose - Callback per chiudere il dialogo
 * @param {Array} props.selectedItems - Elementi selezionati da inviare
 * @param {Array} props.existingRundownItems - Elementi già presenti nel rundown
 * @param {Function} props.onConfirm - Callback per confermare l'invio
 * @param {boolean} props.loading - Se l'operazione è in corso
 * @param {Object} props.progress - Progresso dell'operazione
 * @returns {JSX.Element} - Componente React
 */
const SendToRundownDialog = ({
  open = false,
  onClose,
  selectedItems = [],
  existingRundownItems = [],
  onConfirm,
  loading = false,
  progress = null
}) => {
  // Stati locali
  const [overwriteAll, setOverwriteAll] = useState(false);
  const [skipConflicts, setSkipConflicts] = useState(false);
  const [convertChannels, setConvertChannels] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    conflicts: false,
    options: false
  });

  // Analisi conflitti
  const conflictAnalysis = useMemo(() => {
    const conflicts = [];
    const conflictMap = new Map();

    // Crea una mappa degli elementi esistenti per nome/file
    existingRundownItems.forEach(existing => {
      const key = existing.data?.customName || existing.name || existing.data?.clip || existing.data?.template;
      if (key) {
        conflictMap.set(key.toLowerCase(), existing);
      }
    });

    // Verifica conflitti per ogni elemento selezionato
    selectedItems.forEach(item => {
      const key = item.data?.customName || item.name || item.data?.clip || item.data?.template;
      if (key && conflictMap.has(key.toLowerCase())) {
        conflicts.push({
          item,
          existingItem: conflictMap.get(key.toLowerCase())
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      conflictCount: conflicts.length
    };
  }, [selectedItems, existingRundownItems]);

  // Statistiche elementi
  const itemStats = useMemo(() => {
    const stats = {
      total: selectedItems.length,
      byType: {
        MEDIA: selectedItems.filter(item => item.type === 'MEDIA').length,
        TEMPLATE: selectedItems.filter(item => item.type === 'TEMPLATE').length,
        STORY: selectedItems.filter(item => item.type === 'STORY').length
      }
    };
    return stats;
  }, [selectedItems]);

  // Handler per toggle sezioni
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handler per conferma
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        items: selectedItems,
        options: {
          overwriteAll,
          skipConflicts,
          convertChannels
        },
        conflicts: conflictAnalysis.conflicts
      });
    }
  };

  // Handler per chiusura
  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaylistPlayIcon color="primary" />
          <Typography variant="h6">
            Invia al Rundown Live
          </Typography>
        </Box>
        
        {!loading && (
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Progress bar durante l'invio */}
        {loading && progress && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              {progress.message || 'Invio in corso...'}
            </Typography>
            <LinearProgress 
              variant={progress.determinate ? 'determinate' : 'indeterminate'}
              value={progress.value || 0}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.current || 0} di {progress.total || selectedItems.length} elementi
            </Typography>
          </Box>
        )}

        {/* Alert principale */}
        <Alert 
          severity={conflictAnalysis.hasConflicts ? 'warning' : 'info'} 
          sx={{ mb: 2 }}
          icon={conflictAnalysis.hasConflicts ? <WarningIcon /> : <InfoIcon />}
        >
          <Typography variant="body2">
            {conflictAnalysis.hasConflicts 
              ? `Stai per inviare ${itemStats.total} elementi al rundown live. ${conflictAnalysis.conflictCount} elementi potrebbero sovrascrivere contenuti esistenti.`
              : `Stai per inviare ${itemStats.total} elementi al rundown live. Tutti gli elementi saranno convertiti automaticamente al canale 1 per la messa in onda.`
            }
          </Typography>
        </Alert>

        {/* Riepilogo elementi */}
        <Accordion 
          expanded={expandedSections.summary}
          onChange={() => toggleSection('summary')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                📋 Riepilogo Elementi ({itemStats.total})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {itemStats.byType.MEDIA > 0 && (
                  <Chip label={`${itemStats.byType.MEDIA} Media`} size="small" color="primary" />
                )}
                {itemStats.byType.TEMPLATE > 0 && (
                  <Chip label={`${itemStats.byType.TEMPLATE} Template`} size="small" color="success" />
                )}
                {itemStats.byType.STORY > 0 && (
                  <Chip label={`${itemStats.byType.STORY} Storie`} size="small" color="warning" />
                )}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {selectedItems.map((item, index) => {
                const conflict = conflictAnalysis.conflicts.find(c => c.item.id === item.id);
                return (
                  <ItemSummaryCard
                    key={item.id}
                    item={item}
                    index={index}
                    hasConflict={!!conflict}
                    existingItem={conflict?.existingItem}
                  />
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Gestione conflitti */}
        {conflictAnalysis.hasConflicts && (
          <Accordion 
            expanded={expandedSections.conflicts}
            onChange={() => toggleSection('conflicts')}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                ⚠️ Conflitti Rilevati ({conflictAnalysis.conflictCount})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                I seguenti elementi hanno lo stesso nome di elementi già presenti nel rundown:
              </Typography>
              <List dense>
                {conflictAnalysis.conflicts.map((conflict, index) => (
                  <ItemSummaryCard
                    key={conflict.item.id}
                    item={conflict.item}
                    index={selectedItems.findIndex(item => item.id === conflict.item.id)}
                    hasConflict={true}
                    existingItem={conflict.existingItem}
                  />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Opzioni avanzate */}
        <Accordion 
          expanded={expandedSections.options}
          onChange={() => toggleSection('options')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              ⚙️ Opzioni Avanzate
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={convertChannels}
                    onChange={(e) => setConvertChannels(e.target.checked)}
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    Converti automaticamente al canale 1 (raccomandato per live)
                  </Typography>
                }
              />
              
              {conflictAnalysis.hasConflicts && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={overwriteAll}
                        onChange={(e) => setOverwriteAll(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Sovrascrivi tutti gli elementi in conflitto senza chiedere
                      </Typography>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={skipConflicts}
                        onChange={(e) => setSkipConflicts(e.target.checked)}
                        disabled={loading || overwriteAll}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Salta elementi in conflitto (invia solo quelli nuovi)
                      </Typography>
                    }
                  />
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Annulla
        </Button>
        
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || selectedItems.length === 0}
          startIcon={loading ? null : <PlaylistPlayIcon />}
          color="primary"
        >
          {loading 
            ? 'Invio in corso...' 
            : `Invia ${selectedItems.length} elemento${selectedItems.length !== 1 ? 'i' : ''}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendToRundownDialog;
