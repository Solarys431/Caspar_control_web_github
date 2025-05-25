/**
 * Componente per toggle tra modalità di visualizzazione della scaletta
 * Supporta Compact Mode (tabella densa) e Detailed Mode (card ricche)
 */
import React, { memo } from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Box,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  TableRows as TableRowsIcon,
  ViewModule as ViewModuleIcon,
  PhoneAndroid as PhoneAndroidIcon,
  DesktopWindows as DesktopWindowsIcon
} from '@mui/icons-material';

/**
 * Configurazione modalità di visualizzazione
 */
const VIEW_MODES = {
  compact: {
    id: 'compact',
    label: 'Vista Compatta',
    icon: TableRowsIcon,
    description: 'Tabella densa ottimizzata per scalette lunghe e editing rapido',
    bestFor: ['Scalette 50+ elementi', 'Editing rapido', 'Monitoraggio live', 'Dispositivi mobili'],
    color: '#ff9800'
  },
  detailed: {
    id: 'detailed',
    label: 'Vista Dettagliata',
    icon: ViewModuleIcon,
    description: 'Card ricche con tutte le informazioni visibili',
    bestFor: ['Review contenuti', 'Presentazioni', 'Training', 'Approvazioni'],
    color: '#9c27b0'
  }
};

/**
 * Hook per determinare la modalità consigliata basata su contesto
 */
const useRecommendedMode = (itemCount = 0, screenSize = 'desktop') => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Logica di raccomandazione
  if (isMobile) return 'compact';
  if (itemCount > 50) return 'compact';
  if (itemCount < 10) return 'detailed';

  return null; // Nessuna raccomandazione specifica
};

/**
 * Componente principale per toggle modalità vista
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.value - Modalità corrente ('compact' | 'detailed')
 * @param {Function} props.onChange - Callback per cambio modalità
 * @param {number} props.itemCount - Numero di elementi nella scaletta
 * @param {boolean} props.showLabels - Se mostrare le etichette
 * @param {boolean} props.showRecommendation - Se mostrare raccomandazioni automatiche
 * @param {string} props.size - Dimensione toggle ('small' | 'medium' | 'large')
 * @param {boolean} props.disabled - Se disabilitare il toggle
 * @param {Object} props.sx - Stili aggiuntivi Material-UI
 * @returns {JSX.Element} - Componente React
 */
const ViewModeToggle = memo(({
  value = 'compact',
  onChange,
  itemCount = 0,
  showLabels = false,
  showRecommendation = true,
  size = 'small',
  disabled = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const recommendedMode = useRecommendedMode(itemCount);

  // Forza compact mode su mobile
  const effectiveValue = isMobile ? 'compact' : value;
  const isDisabled = disabled || isMobile;

  const handleChange = (event, newValue) => {
    console.log('🔄 ViewModeToggle handleChange:', {
      currentValue: value,
      effectiveValue,
      newValue,
      isDisabled,
      hasOnChange: !!onChange,
      isMobile
    });

    if (newValue !== null && onChange && !isDisabled) {
      console.log('✅ Calling onChange with:', newValue);
      onChange(newValue);
    } else {
      console.log('❌ onChange not called:', {
        newValueIsNull: newValue === null,
        noOnChange: !onChange,
        isDisabled
      });
    }
  };

  // Tooltip content per ogni modalità
  const getTooltipContent = (mode) => {
    const config = VIEW_MODES[mode];
    return (
      <Box sx={{ maxWidth: 300, p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {config.label}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.4 }}>
          {config.description}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
          Ottimale per:
        </Typography>
        {config.bestFor.map((item, index) => (
          <Typography key={index} variant="caption" sx={{ display: 'block', ml: 1 }}>
            • {item}
          </Typography>
        ))}
        {recommendedMode === mode && showRecommendation && (
          <Typography variant="caption" sx={{
            display: 'block',
            mt: 1,
            color: 'success.main',
            fontWeight: 'bold'
          }}>
            ⭐ Raccomandato per questa scaletta
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      {/* Indicatore dispositivo (solo su mobile) */}
      {isMobile && (
        <Tooltip title="Modalità compatta forzata su dispositivi mobili">
          <PhoneAndroidIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Tooltip>
      )}

      {/* Toggle principale */}
      <ToggleButtonGroup
        value={effectiveValue}
        exclusive
        onChange={handleChange}
        size={size}
        disabled={isDisabled}
        sx={{
          '& .MuiToggleButton-root': {
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            },
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }
        }}
        {...props}
      >
        {Object.values(VIEW_MODES).map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = effectiveValue === mode.id;
          const isRecommended = recommendedMode === mode.id && showRecommendation;

          return (
            <Tooltip
              key={mode.id}
              title={getTooltipContent(mode.id)}
              placement="bottom"
              arrow
            >
              <ToggleButton
                value={mode.id}
                sx={{
                  position: 'relative',
                  minWidth: showLabels ? 120 : 40,
                  ...(isRecommended && {
                    '&::after': {
                      content: '"⭐"',
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      fontSize: 12,
                      color: 'success.main'
                    }
                  })
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: showLabels ? 1 : 0
                }}>
                  <IconComponent sx={{
                    fontSize: size === 'small' ? 18 : size === 'medium' ? 20 : 22,
                    color: isSelected ? 'inherit' : mode.color
                  }} />
                  {showLabels && (
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {mode.label.split(' ')[1]} {/* Solo "Compatta" o "Dettagliata" */}
                    </Typography>
                  )}
                </Box>
              </ToggleButton>
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>

      {/* Indicatore conteggio elementi */}
      {itemCount > 0 && (
        <Typography variant="caption" sx={{
          color: 'text.secondary',
          ml: 1,
          fontSize: '0.7rem'
        }}>
          {itemCount} elementi
        </Typography>
      )}

      {/* Indicatore raccomandazione */}
      {recommendedMode && showRecommendation && !isMobile && (
        <Tooltip title={`Modalità ${VIEW_MODES[recommendedMode].label.toLowerCase()} raccomandata`}>
          <Typography variant="caption" sx={{
            color: 'success.main',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            ⭐ {VIEW_MODES[recommendedMode].label.split(' ')[1]}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
});

ViewModeToggle.displayName = 'ViewModeToggle';

export default ViewModeToggle;

/**
 * Hook per gestire lo stato della modalità vista con persistenza
 */
export const useViewMode = (defaultMode = 'compact', storageKey = 'scaletta-view-mode') => {
  const [viewMode, setViewMode] = React.useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  const handleViewModeChange = React.useCallback((newMode) => {
    setViewMode(newMode);
    try {
      localStorage.setItem(storageKey, newMode);
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  return [viewMode, handleViewModeChange];
};

/**
 * Utility per ottenere la configurazione di una modalità
 */
export const getViewModeConfig = (mode) => {
  return VIEW_MODES[mode] || VIEW_MODES.compact;
};
