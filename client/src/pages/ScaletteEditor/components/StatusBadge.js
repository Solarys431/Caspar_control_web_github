/**
 * Componente per badge di stato operativo degli elementi della scaletta
 * Fornisce indicazione visiva immediata dello stato corrente
 */
import React, { memo } from 'react';
import {
  Chip,
  Box,
  Tooltip,
  keyframes
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

/**
 * Animazione pulsante per stati attivi
 */
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

/**
 * Configurazione stati operativi
 */
const STATUS_CONFIG = {
  LIVE: {
    icon: PlayArrowIcon,
    label: 'In Riproduzione',
    color: '#f44336', // Rosso
    bgColor: 'rgba(244, 67, 54, 0.1)',
    textColor: '#f44336',
    animated: true,
    priority: 1
  },
  PLAYING: {
    icon: PlayArrowIcon,
    label: 'In Riproduzione',
    color: '#4caf50', // Verde
    bgColor: 'rgba(76, 175, 80, 0.1)',
    textColor: '#4caf50',
    animated: true,
    priority: 2
  },
  PAUSED: {
    icon: PauseIcon,
    label: 'In Pausa',
    color: '#ff9800', // Arancione
    bgColor: 'rgba(255, 152, 0, 0.1)',
    textColor: '#ff9800',
    animated: false,
    priority: 3
  },
  EDITING: {
    icon: EditIcon,
    label: 'In Modifica',
    color: '#2196f3', // Blu
    bgColor: 'rgba(33, 150, 243, 0.1)',
    textColor: '#2196f3',
    animated: false,
    priority: 4
  },
  SCHEDULED: {
    icon: ScheduleIcon,
    label: 'Programmato',
    color: '#9c27b0', // Viola
    bgColor: 'rgba(156, 39, 176, 0.1)',
    textColor: '#9c27b0',
    animated: false,
    priority: 5
  },
  ERROR: {
    icon: ErrorIcon,
    label: 'Errore',
    color: '#f44336', // Rosso
    bgColor: 'rgba(244, 67, 54, 0.1)',
    textColor: '#f44336',
    animated: true,
    priority: 0
  },
  IDLE: {
    icon: RadioButtonUncheckedIcon,
    label: 'Inattivo',
    color: '#757575', // Grigio
    bgColor: 'rgba(117, 117, 117, 0.05)',
    textColor: '#757575',
    animated: false,
    priority: 10
  }
};

/**
 * Componente per badge di stato
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.status - Stato dell'elemento (LIVE, PLAYING, EDITING, etc.)
 * @param {string} props.size - Dimensione badge ('small', 'medium', 'large')
 * @param {string} props.variant - Variante di visualizzazione ('chip', 'dot', 'icon', 'minimal')
 * @param {boolean} props.showLabel - Se mostrare il testo del label
 * @param {boolean} props.showIcon - Se mostrare l'icona
 * @param {string} props.customLabel - Label personalizzato
 * @param {Object} props.sx - Stili aggiuntivi Material-UI
 * @returns {JSX.Element} - Componente React
 */
const StatusBadge = memo(({
  status,
  size = 'small',
  variant = 'chip',
  showLabel = true,
  showIcon = true,
  customLabel,
  sx = {},
  ...props
}) => {
  // Configurazione per lo stato specificato, fallback a IDLE
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;

  // Non renderizzare nulla per stato IDLE in variante minimal
  if (status === 'IDLE' && variant === 'minimal') {
    return null;
  }

  const IconComponent = config.icon;
  const label = customLabel || config.label;

  // Dimensioni basate sulla prop size
  const sizeConfig = {
    small: {
      fontSize: '0.7rem',
      iconSize: 14,
      padding: '2px 6px',
      height: 20
    },
    medium: {
      fontSize: '0.75rem',
      iconSize: 16,
      padding: '4px 8px',
      height: 24
    },
    large: {
      fontSize: '0.8rem',
      iconSize: 18,
      padding: '6px 12px',
      height: 28
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.small;

  // Stili per animazione
  const animationStyles = config.animated ? {
    animation: `${pulseAnimation} 2s ease-in-out infinite`
  } : {};

  // Rendering basato sulla variante
  const renderBadge = () => {
    switch (variant) {
      case 'dot':
        return (
          <Box sx={{
            width: currentSize.iconSize,
            height: currentSize.iconSize,
            borderRadius: '50%',
            bgcolor: config.color,
            border: `2px solid ${config.color}30`,
            ...animationStyles,
            ...sx
          }} />
        );

      case 'icon':
        return (
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: config.color,
            ...animationStyles,
            ...sx
          }}>
            <IconComponent sx={{ fontSize: currentSize.iconSize }} />
          </Box>
        );

      case 'minimal':
        return (
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: config.textColor,
            fontSize: currentSize.fontSize,
            fontWeight: 500,
            ...animationStyles,
            ...sx
          }}>
            {showIcon && (
              <IconComponent sx={{ fontSize: currentSize.iconSize }} />
            )}
            {showLabel && label}
          </Box>
        );

      default: // 'chip'
        return (
          <Chip
            icon={showIcon ? <IconComponent sx={{ fontSize: currentSize.iconSize }} /> : undefined}
            label={showLabel ? label : ''}
            size={size}
            variant="outlined"
            sx={{
              bgcolor: config.bgColor,
              borderColor: config.color,
              color: config.textColor,
              fontSize: currentSize.fontSize,
              height: currentSize.height,
              '& .MuiChip-icon': {
                color: config.color
              },
              '& .MuiChip-label': {
                fontWeight: 500
              },
              ...animationStyles,
              ...sx
            }}
            {...props}
          />
        );
    }
  };

  // Wrapper con tooltip per varianti senza label
  if (!showLabel || variant === 'dot' || variant === 'icon') {
    return (
      <Tooltip
        title={label}
        placement="top"
        arrow
        enterDelay={300}
      >
        <Box component="span">
          {renderBadge()}
        </Box>
      </Tooltip>
    );
  }

  return renderBadge();
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;

/**
 * Hook per determinare lo stato di un elemento basato sui suoi dati
 *
 * @param {Object} item - Elemento della scaletta
 * @param {Object} editingStatus - Stato di editing dall'ItemEditPanel
 * @param {Object} playbackStatus - Stato di riproduzione dal CasparCG
 * @returns {string} - Stato determinato
 */
export const useItemStatus = (item, editingStatus = {}, playbackStatus = {}) => {
  // Priorità: ERROR > LIVE > PLAYING > PAUSED > EDITING > SCHEDULED > IDLE

  if (playbackStatus[item.id]?.error) {
    return 'ERROR';
  }

  if (playbackStatus[item.id]?.isLive) {
    return 'LIVE';
  }

  if (playbackStatus[item.id]?.isPlaying) {
    return 'PLAYING';
  }

  if (playbackStatus[item.id]?.isPaused) {
    return 'PAUSED';
  }

  if (editingStatus[item.id]) {
    return 'EDITING';
  }

  if (item.data?.timing?.startTime && new Date(item.data.timing.startTime) > new Date()) {
    return 'SCHEDULED';
  }

  return 'IDLE';
};

/**
 * Utility per ottenere tutti gli stati supportati
 */
export const getSupportedStatuses = () => {
  return Object.keys(STATUS_CONFIG);
};

/**
 * Utility per ottenere la configurazione di uno stato
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;
};
