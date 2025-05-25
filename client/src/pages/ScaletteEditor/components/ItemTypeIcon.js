/**
 * Componente per icone colorate dei tipi di elementi della scaletta
 * Fornisce riconoscimento visivo immediato del tipo di contenuto
 */
import React, { memo } from 'react';
import {
  Movie as MovieIcon,
  Brush as BrushIcon,
  Article as ArticleIcon,
  PlayArrow as PlayArrowIcon,
  AudioFile as AudiotrackIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';

/**
 * Configurazione icone e colori per ogni tipo di elemento
 */
const TYPE_CONFIG = {
  MEDIA: {
    icon: MovieIcon,
    color: '#2196f3', // Blu
    label: 'Media Video/Audio',
    bgColor: 'rgba(33, 150, 243, 0.1)'
  },
  TEMPLATE: {
    icon: BrushIcon,
    color: '#4caf50', // Verde
    label: 'Template Grafico',
    bgColor: 'rgba(76, 175, 80, 0.1)'
  },
  STORY: {
    icon: ArticleIcon,
    color: '#ff9800', // Arancione
    label: 'Storia/Contenuto',
    bgColor: 'rgba(255, 152, 0, 0.1)'
  },
  AUDIO: {
    icon: AudiotrackIcon,
    color: '#9c27b0', // Viola
    label: 'Audio',
    bgColor: 'rgba(156, 39, 176, 0.1)'
  },
  COMMAND: {
    icon: CodeIcon,
    color: '#607d8b', // Grigio-blu
    label: 'Comando',
    bgColor: 'rgba(96, 125, 139, 0.1)'
  }
};

/**
 * Componente per icona tipo elemento
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.type - Tipo dell'elemento (MEDIA, TEMPLATE, STORY, etc.)
 * @param {string} props.size - Dimensione icona ('small', 'medium', 'large')
 * @param {boolean} props.showLabel - Se mostrare il label nel tooltip
 * @param {boolean} props.showBackground - Se mostrare background colorato
 * @param {Object} props.sx - Stili aggiuntivi Material-UI
 * @param {string} props.variant - Variante di visualizzazione ('icon', 'chip', 'badge')
 * @returns {JSX.Element} - Componente React
 */
const ItemTypeIcon = memo(({
  type,
  size = 'small',
  showLabel = true,
  showBackground = false,
  sx = {},
  variant = 'icon',
  ...props
}) => {
  // Configurazione per il tipo specificato, fallback a default
  const config = TYPE_CONFIG[type] || {
    icon: PlayArrowIcon,
    color: '#757575',
    label: 'Elemento Generico',
    bgColor: 'rgba(117, 117, 117, 0.1)'
  };

  const IconComponent = config.icon;

  // Dimensioni basate sulla prop size
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };

  const iconSize = sizeMap[size] || sizeMap.small;

  // Stili base per l'icona
  const iconStyles = {
    fontSize: iconSize,
    color: config.color,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.1)',
      filter: 'brightness(1.2)'
    },
    ...sx
  };

  // Rendering basato sulla variante
  const renderIcon = () => {
    switch (variant) {
      case 'chip':
        return (
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: config.bgColor,
            border: `1px solid ${config.color}30`
          }}>
            <IconComponent sx={iconStyles} />
            {showLabel && (
              <Box component="span" sx={{
                ml: 0.5,
                fontSize: '0.75rem',
                color: config.color,
                fontWeight: 500
              }}>
                {type}
              </Box>
            )}
          </Box>
        );

      case 'badge':
        return (
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: iconSize + 8,
            height: iconSize + 8,
            borderRadius: '50%',
            bgcolor: showBackground ? config.bgColor : 'transparent',
            border: showBackground ? `1px solid ${config.color}30` : 'none'
          }}>
            <IconComponent sx={iconStyles} />
          </Box>
        );

      default: // 'icon'
        return (
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            bgcolor: showBackground ? config.bgColor : 'transparent',
            borderRadius: showBackground ? 0.5 : 0,
            p: showBackground ? 0.5 : 0
          }}>
            <IconComponent sx={iconStyles} />
          </Box>
        );
    }
  };

  // Wrapper con tooltip se richiesto
  if (showLabel && variant === 'icon') {
    return (
      <Tooltip
        title={config.label}
        placement="top"
        arrow
        enterDelay={500}
        {...props}
      >
        {renderIcon()}
      </Tooltip>
    );
  }

  return renderIcon();
});

ItemTypeIcon.displayName = 'ItemTypeIcon';

export default ItemTypeIcon;

/**
 * Hook per ottenere la configurazione di un tipo
 * Utile per accedere ai colori e configurazioni esternamente
 */
export const useTypeConfig = (type) => {
  return TYPE_CONFIG[type] || TYPE_CONFIG.MEDIA;
};

/**
 * Utility per ottenere solo il colore di un tipo
 */
export const getTypeColor = (type) => {
  return TYPE_CONFIG[type]?.color || TYPE_CONFIG.MEDIA.color;
};

/**
 * Utility per ottenere tutti i tipi supportati
 */
export const getSupportedTypes = () => {
  return Object.keys(TYPE_CONFIG);
};
