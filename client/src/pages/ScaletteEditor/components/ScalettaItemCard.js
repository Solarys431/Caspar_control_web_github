/**
 * Componente card professionale per elementi della scaletta
 * Utilizzato nella modalità Detailed View per visualizzazione ricca
 */
import React, { memo, useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import ItemTypeIcon, { getTypeColor } from './ItemTypeIcon';
import StatusBadge, { useItemStatus } from './StatusBadge';
import { ItemSelectionCheckbox } from './SelectionCheckbox';

/**
 * Componente per sezione metadati della card
 */
const MetadataSection = memo(({ item }) => {
  const metadata = [];

  // Timing
  if (item.data?.timing?.startTime) {
    metadata.push({
      icon: AccessTimeIcon,
      label: 'Inizio',
      value: item.data.timing.startTime,
      color: 'info.main'
    });
  }

  if (item.data?.timing?.duration) {
    metadata.push({
      icon: AccessTimeIcon,
      label: 'Durata',
      value: item.data.timing.duration,
      color: 'info.main'
    });
  }

  // Location/Channel
  if (item.data?.casparcgConfig) {
    metadata.push({
      icon: LocationOnIcon,
      label: 'Canale',
      value: `CH${item.data.casparcgConfig.channel}-L${item.data.casparcgConfig.layer}`,
      color: 'secondary.main'
    });
  }

  // Note
  if (item.data?.notes) {
    metadata.push({
      icon: NotesIcon,
      label: 'Note',
      value: item.data.notes,
      color: 'text.secondary'
    });
  }

  if (metadata.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={1}>
        {metadata.map((meta, index) => {
          const IconComponent = meta.icon;
          return (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconComponent sx={{ fontSize: 14, color: meta.color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 50 }}>
                  {meta.label}:
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  wordBreak: 'break-word'
                }}>
                  {meta.value}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
});

MetadataSection.displayName = 'MetadataSection';

/**
 * Componente per contenuto della storia
 */
const StoryContentSection = memo(({ content, expanded, onToggle }) => {
  if (!content) return null;

  const truncatedContent = content.length > 150
    ? content.substring(0, 150) + '...'
    : content;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
          📄 Contenuto Storia
        </Typography>
        {content.length > 150 && (
          <IconButton size="small" onClick={onToggle}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      <Typography variant="body2" sx={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.4,
        color: 'text.secondary',
        bgcolor: 'background.default',
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {expanded ? content : truncatedContent}
      </Typography>
    </Box>
  );
});

StoryContentSection.displayName = 'StoryContentSection';

/**
 * Componente per file associati
 */
const AssociatedFilesSection = memo(({ item }) => {
  const files = [];

  // Media file
  if (item.data?.mediaDetails?.clipPath || item.data?.clip) {
    files.push({
      type: 'MEDIA',
      name: item.data.mediaDetails?.clipPath?.split('/').pop() || item.data.clip,
      path: item.data.mediaDetails?.clipPath || item.data.clip
    });
  }

  // Template files
  if (item.data?.templatesDetails?.length > 0) {
    item.data.templatesDetails.forEach((template, index) => {
      files.push({
        type: 'TEMPLATE',
        name: template.templateFile?.split('/').pop() || `Template ${index + 1}`,
        path: template.templateFile
      });
    });
  } else if (item.data?.templateDetails?.templateFile || item.data?.template) {
    files.push({
      type: 'TEMPLATE',
      name: item.data.templateDetails?.templateFile?.split('/').pop() || item.data.template,
      path: item.data.templateDetails?.templateFile || item.data.template
    });
  }

  if (files.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        📁 File Associati
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {files.map((file, index) => (
          <Box key={index} sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            bgcolor: 'background.default',
            borderRadius: 0.5,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <ItemTypeIcon type={file.type} size="small" variant="icon" showLabel={false} />
            <Typography variant="caption" sx={{
              color: 'text.primary',
              fontFamily: 'monospace',
              flexGrow: 1
            }}>
              {file.name}
            </Typography>
            <Chip
              label={file.type}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.6rem',
                height: 18,
                borderColor: getTypeColor(file.type),
                color: getTypeColor(file.type)
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
});

AssociatedFilesSection.displayName = 'AssociatedFilesSection';

/**
 * Componente principale card elemento scaletta
 *
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.item - Elemento della scaletta
 * @param {number} props.index - Indice dell'elemento
 * @param {boolean} props.selected - Se l'elemento è selezionato
 * @param {boolean} props.dragging - Se l'elemento è in fase di drag
 * @param {Object} props.editingStatus - Stato di editing
 * @param {Function} props.onSelect - Callback per selezione
 * @param {Function} props.onEdit - Callback per modifica
 * @param {Function} props.onPlay - Callback per riproduzione
 * @param {Function} props.onDelete - Callback per eliminazione
 * @param {boolean} props.canEdit - Se l'utente può modificare
 * @param {boolean} props.isSelected - Se l'elemento è selezionato
 * @param {Function} props.onSelectionChange - Callback per cambio selezione
 * @param {Object} props.sx - Stili aggiuntivi
 * @returns {JSX.Element} - Componente React
 */
const ScalettaItemCard = memo(({
  item,
  index,
  selected = false,
  dragging = false,
  editingStatus = {},
  onSelect,
  onEdit,
  onPlay,
  onDelete,
  canEdit = true,
  isSelected = false,
  onSelectionChange,
  sx = {},
  ...props
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);

  const status = useItemStatus(item, editingStatus);
  const isBeingEdited = editingStatus[item.id];

  const handleCardClick = (event) => {
    event.stopPropagation();
    if (onSelect) {
      onSelect(index);
    }
  };

  const handleExpandClick = (event) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'rgba(33, 150, 243, 0.05)' : 'background.paper',
        transform: dragging ? 'rotate(5deg) scale(1.05)' : 'none',
        boxShadow: dragging ? 4 : selected ? 2 : 1,
        '&:hover': {
          transform: dragging ? 'rotate(5deg) scale(1.05)' : 'translateY(-2px)',
          boxShadow: dragging ? 4 : 3,
          borderColor: selected ? 'primary.main' : 'primary.light'
        },
        ...sx
      }}
      onClick={handleCardClick}
      {...props}
    >
      {/* Checkbox selezione */}
      <Box sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 2
      }}>
        <ItemSelectionCheckbox
          checked={isSelected}
          onChange={(checked) => onSelectionChange && onSelectionChange(checked)}
          itemId={item.id}
          itemName={item.data?.customName || item.name}
          size="small"
        />
      </Box>

      {/* Drag Handle */}
      {canEdit && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 40, // Spostato a destra per fare spazio al checkbox
          cursor: 'grab',
          color: 'text.disabled',
          '&:hover': { color: 'text.secondary' }
        }}>
          <DragIndicatorIcon fontSize="small" />
        </Box>
      )}

      {/* Index Badge */}
      <Chip
        label={`#${index + 1}`}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontWeight: 'bold',
          fontSize: '0.7rem'
        }}
      />

      <CardContent sx={{ pt: 6, pb: 1, pl: 3 }}> {/* Aumentato padding per checkbox */}
        {/* Header con tipo e nome */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ItemTypeIcon type={item.type} size="medium" variant="badge" showBackground />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              lineHeight: 1.2,
              mb: 0.5
            }}>
              {item.data?.customName || item.name || 'Elemento senza nome'}
            </Typography>
            <StatusBadge status={status} variant="chip" size="small" />
          </Box>
        </Box>

        {/* Contenuto principale */}
        {item.type === 'STORY' && item.data?.content && (
          <StoryContentSection
            content={item.data.content}
            expanded={contentExpanded}
            onToggle={() => setContentExpanded(!contentExpanded)}
          />
        )}

        {/* File associati */}
        <AssociatedFilesSection item={item} />

        {/* Sezione espandibile con metadati */}
        <Collapse in={expanded}>
          <MetadataSection item={item} />
        </Collapse>

        {/* Toggle espansione metadati */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <IconButton size="small" onClick={handleExpandClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>

      {/* Azioni */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {canEdit && (
            <Tooltip title="Modifica">
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(item);
                  }}
                  disabled={!!isBeingEdited}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title="Riproduci">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onPlay && onPlay(item);
              }}
              color="success"
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          {canEdit && (
            <Tooltip title="Elimina">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(item.id);
                }}
                disabled={!!isBeingEdited}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>

      {/* Progress bar per elementi in riproduzione */}
      {(status === 'LIVE' || status === 'PLAYING') && (
        <LinearProgress
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'rgba(0,0,0,0.1)'
          }}
          color={status === 'LIVE' ? 'error' : 'success'}
        />
      )}
    </Card>
  );
});

ScalettaItemCard.displayName = 'ScalettaItemCard';

export default ScalettaItemCard;
