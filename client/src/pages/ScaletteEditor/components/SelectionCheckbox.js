/**
 * Componente checkbox per la selezione di elementi nella scaletta
 * Supporta stati: non selezionato, selezionato, parzialmente selezionato
 */
import React, { memo } from 'react';
import {
  Checkbox,
  FormControlLabel,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon
} from '@mui/icons-material';

/**
 * Componente checkbox per selezione singola
 * 
 * @param {Object} props - Proprietà del componente
 * @param {boolean} props.checked - Se il checkbox è selezionato
 * @param {Function} props.onChange - Callback per il cambio di stato
 * @param {boolean} props.disabled - Se il checkbox è disabilitato
 * @param {string} props.itemId - ID dell'elemento (per debug)
 * @param {string} props.itemName - Nome dell'elemento (per tooltip)
 * @param {string} props.size - Dimensione del checkbox ('small' | 'medium')
 * @param {string} props.color - Colore del checkbox
 * @param {Object} props.sx - Stili aggiuntivi
 * @returns {JSX.Element} - Componente React
 */
export const ItemSelectionCheckbox = memo(({
  checked = false,
  onChange,
  disabled = false,
  itemId,
  itemName = '',
  size = 'small',
  color = 'primary',
  sx = {},
  ...props
}) => {
  const handleChange = (event) => {
    event.stopPropagation(); // Previene la propagazione del click alla riga
    if (onChange && !disabled) {
      onChange(event.target.checked, itemId);
    }
  };

  const tooltipTitle = disabled 
    ? 'Selezione non disponibile'
    : checked 
      ? `Deseleziona: ${itemName}`
      : `Seleziona: ${itemName}`;

  return (
    <Tooltip title={tooltipTitle} placement="top">
      <span>
        <Checkbox
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          size={size}
          color={color}
          sx={{
            padding: '4px',
            '&:hover': {
              backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.04)'
            },
            ...sx
          }}
          {...props}
        />
      </span>
    </Tooltip>
  );
});

ItemSelectionCheckbox.displayName = 'ItemSelectionCheckbox';

/**
 * Componente checkbox "Seleziona Tutti"
 * 
 * @param {Object} props - Proprietà del componente
 * @param {string} props.state - Stato della selezione ('none' | 'partial' | 'all')
 * @param {Function} props.onChange - Callback per il cambio di stato
 * @param {boolean} props.disabled - Se il checkbox è disabilitato
 * @param {number} props.totalItems - Numero totale di elementi
 * @param {number} props.selectedItems - Numero di elementi selezionati
 * @param {boolean} props.showLabel - Se mostrare l'etichetta
 * @param {string} props.size - Dimensione del checkbox
 * @param {Object} props.sx - Stili aggiuntivi
 * @returns {JSX.Element} - Componente React
 */
export const SelectAllCheckbox = memo(({
  state = 'none',
  onChange,
  disabled = false,
  totalItems = 0,
  selectedItems = 0,
  showLabel = true,
  size = 'small',
  sx = {},
  ...props
}) => {
  const handleChange = (event) => {
    if (onChange && !disabled) {
      // Se è parzialmente selezionato o nessuno selezionato, seleziona tutti
      // Se tutti sono selezionati, deseleziona tutti
      const selectAll = state !== 'all';
      onChange(selectAll);
    }
  };

  const getCheckboxProps = () => {
    switch (state) {
      case 'all':
        return {
          checked: true,
          indeterminate: false,
          icon: <CheckBoxOutlineBlankIcon />,
          checkedIcon: <CheckBoxIcon />
        };
      case 'partial':
        return {
          checked: false,
          indeterminate: true,
          icon: <CheckBoxOutlineBlankIcon />,
          checkedIcon: <CheckBoxIcon />,
          indeterminateIcon: <IndeterminateCheckBoxIcon />
        };
      default: // 'none'
        return {
          checked: false,
          indeterminate: false,
          icon: <CheckBoxOutlineBlankIcon />,
          checkedIcon: <CheckBoxIcon />
        };
    }
  };

  const getTooltipText = () => {
    if (disabled) return 'Selezione non disponibile';
    
    switch (state) {
      case 'all':
        return `Deseleziona tutti (${totalItems} elementi)`;
      case 'partial':
        return `Seleziona tutti (${selectedItems}/${totalItems} selezionati)`;
      default:
        return `Seleziona tutti (${totalItems} elementi)`;
    }
  };

  const getLabelText = () => {
    switch (state) {
      case 'all':
        return `Tutti selezionati (${totalItems})`;
      case 'partial':
        return `${selectedItems}/${totalItems} selezionati`;
      default:
        return `Seleziona tutti (${totalItems})`;
    }
  };

  const checkboxProps = getCheckboxProps();

  const checkbox = (
    <Checkbox
      {...checkboxProps}
      onChange={handleChange}
      disabled={disabled}
      size={size}
      color="primary"
      sx={{
        padding: '4px',
        '&:hover': {
          backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.04)'
        },
        ...sx
      }}
      {...props}
    />
  );

  if (!showLabel) {
    return (
      <Tooltip title={getTooltipText()} placement="bottom">
        <span>{checkbox}</span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getTooltipText()} placement="bottom">
      <FormControlLabel
        control={checkbox}
        label={
          <Typography variant="caption" sx={{ 
            fontWeight: 500,
            color: disabled ? 'text.disabled' : 'text.primary'
          }}>
            {getLabelText()}
          </Typography>
        }
        sx={{
          margin: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.75rem'
          }
        }}
      />
    </Tooltip>
  );
});

SelectAllCheckbox.displayName = 'SelectAllCheckbox';

/**
 * Componente per statistiche di selezione compatte
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.stats - Statistiche di selezione
 * @param {boolean} props.showDetails - Se mostrare i dettagli per tipo
 * @param {string} props.variant - Variante di visualizzazione ('chip' | 'text')
 * @returns {JSX.Element} - Componente React
 */
export const SelectionStats = memo(({
  stats = { total: 0, byType: {}, percentage: 0 },
  showDetails = false,
  variant = 'text'
}) => {
  if (stats.total === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Nessun elemento selezionato
      </Typography>
    );
  }

  const { total, byType, percentage } = stats;

  if (variant === 'chip') {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {total} selezionati ({percentage}%)
        </Typography>
        {showDetails && (
          <>
            {byType.MEDIA > 0 && (
              <Typography variant="caption" color="primary.main">
                📹 {byType.MEDIA}
              </Typography>
            )}
            {byType.TEMPLATE > 0 && (
              <Typography variant="caption" color="success.main">
                🎨 {byType.TEMPLATE}
              </Typography>
            )}
            {byType.STORY > 0 && (
              <Typography variant="caption" color="warning.main">
                📄 {byType.STORY}
              </Typography>
            )}
          </>
        )}
      </Box>
    );
  }

  return (
    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 500 }}>
      {total} elemento{total !== 1 ? 'i' : ''} selezionat{total !== 1 ? 'i' : 'o'}
      {showDetails && total > 0 && (
        <>
          {' '}(
          {byType.MEDIA > 0 && `${byType.MEDIA} media`}
          {byType.TEMPLATE > 0 && `${byType.MEDIA > 0 ? ', ' : ''}${byType.TEMPLATE} template`}
          {byType.STORY > 0 && `${(byType.MEDIA > 0 || byType.TEMPLATE > 0) ? ', ' : ''}${byType.STORY} storie`}
          )
        </>
      )}
    </Typography>
  );
});

SelectionStats.displayName = 'SelectionStats';

export default {
  ItemSelectionCheckbox,
  SelectAllCheckbox,
  SelectionStats
};
