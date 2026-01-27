// DynamicTemplateForm.js
import React from 'react';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Grid,
  Typography,
  Tooltip,
  Box // AGGIUNTO Box all'import
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Un semplice color picker testuale, per un vero color picker si potrebbe integrare una libreria
const ColorPicker = ({ label, value, onChange, helperText, props = {} }) => (
  <TextField
    label={label}
    type="color" // Questo crea un input colore nativo del browser
    value={value || '#000000'}
    onChange={(e) => onChange(e.target.value)}
    helperText={helperText}
    fullWidth
    variant="filled"
    InputLabelProps={{ shrink: true }}
    {...props}
  />
);

const DynamicTemplateForm = ({ manifest, data, onChange, onFocus }) => {
  if (!manifest || !manifest.fields) {
    return (
      <Typography color="textSecondary" sx={{ p: 2 }}>
        Definizione del template (manifest) non trovata o non valida.
      </Typography>
    );
  }

  const handleChange = (key, value) => {
    onChange({ ...data, [key]: value });
  };

  const handleFocus = (key) => {
    if (onFocus) {
        onFocus(key);
    }
  }

  return (
    <Grid container spacing={2} sx={{pt: 1}}>
      {manifest.fields.map((field) => {
        const { key, label, type, defaultValue, placeholder, required, options, props = {}, description, fileType } = field;
        const currentValue = data[key] !== undefined ? data[key] : defaultValue;

        let inputComponent = null;

        switch (type) {
          case 'text':
            inputComponent = (
              <TextField
                fullWidth
                label={label}
                value={currentValue || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                onFocus={() => handleFocus(key)}
                placeholder={placeholder}
                required={required}
                variant="filled"
                InputLabelProps={{ shrink: true }}
                {...props}
              />
            );
            break;
          case 'textarea':
            inputComponent = (
              <TextField
                fullWidth
                label={label}
                multiline
                rows={props.rows || 3}
                value={currentValue || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                onFocus={() => handleFocus(key)}
                placeholder={placeholder}
                required={required}
                variant="filled"
                InputLabelProps={{ shrink: true }}
                {...props}
              />
            );
            break;
          case 'number':
            inputComponent = (
              <TextField
                fullWidth
                label={label}
                type="number"
                value={currentValue || ''}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))} // o parseInt
                onFocus={() => handleFocus(key)}
                placeholder={placeholder}
                required={required}
                variant="filled"
                InputLabelProps={{ shrink: true }}
                inputProps={props} // per min, max, step
                {...props} // per altre props generiche
              />
            );
            break;
          case 'boolean':
            inputComponent = (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(currentValue)}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    onFocus={() => handleFocus(key)}
                    name={key}
                  />
                }
                label={label}
              />
            );
            break;
          case 'color':
            inputComponent = (
              <ColorPicker
                label={label}
                value={currentValue}
                onChange={(value) => handleChange(key, value)}
                onFocus={() => handleFocus(key)}
                props={props}
              />
            );
            break;
          case 'file': // Gestito come un campo di testo per il percorso
             inputComponent = (
              <TextField
                fullWidth
                label={`${label} (${fileType || 'percorso'})`}
                value={currentValue || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                onFocus={() => handleFocus(key)}
                placeholder={placeholder || 'es. NOMEFILE.png o media/NOMEFILE.mp4'}
                required={required}
                variant="filled"
                InputLabelProps={{ shrink: true }}
                helperText="Inserisci il percorso relativo alla cartella media di CasparCG."
                {...props}
              />
            );
            break;
          case 'select':
            inputComponent = (
              <FormControl fullWidth required={required} variant="filled">
                <InputLabel shrink>{label}</InputLabel>
                <Select
                  value={currentValue || (options && options.length > 0 ? options[0].value : '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onFocus={() => handleFocus(key)}
                  label={label} // Necessario per l'etichetta corretta con variant="filled"
                >
                  {(options || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
            break;
          default:
            inputComponent = (
              <Typography color="error">
                Tipo di campo non supportato: {type}
              </Typography>
            );
        }

        return (
          <Grid item xs={12} md={type === 'textarea' || type === 'boolean' ? 12 : 6} key={key}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}> {/* Uso di Box */}
                <Box sx={{ flexGrow: 1 }}> {/* Uso di Box */}
                    {inputComponent}
                </Box>
                {description && (
                <Tooltip title={description} placement="top-start">
                    <InfoOutlinedIcon color="action" sx={{ ml: 1, cursor: 'help', alignSelf: type !== 'boolean' ? 'center' : 'flex-start', mt: type !== 'boolean' ? 0 : 1.5 }} />
                </Tooltip>
                )}
            </Box>
            {required && (!currentValue || (typeof currentValue === 'string' && currentValue.trim() === '')) && (
                <FormHelperText error sx={{ml:1.5}}>Campo obbligatorio</FormHelperText>
            )}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DynamicTemplateForm;
