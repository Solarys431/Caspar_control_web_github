/**
 * Componente per l'editing inline del contenuto delle story
 * Supporta click-to-edit con gestione completa degli stati
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Fade,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { broadcastComponents, broadcastColors } from '../../../styles/broadcastTheme';

/**
 * Componente per l'editing inline del contenuto story
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.content - Contenuto da visualizzare/modificare
 * @param {Function} props.onUpdate - Callback per aggiornamento contenuto
 * @param {boolean} props.canEdit - Se l'utente può modificare
 * @param {boolean} props.expanded - Se il contenuto è espanso
 * @param {number} props.maxLength - Lunghezza massima per la visualizzazione troncata
 * @returns {JSX.Element} - Componente React
 */
const EditableStoryContent = ({
  content = '',
  onUpdate,
  canEdit = true,
  expanded = false,
  maxLength = 150
}) => {
  // Stati per la gestione dell'editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Ref per il campo di input
  const inputRef = useRef(null);

  // Aggiorna il valore locale quando cambia il contenuto esterno
  useEffect(() => {
    if (!isEditing) {
      setEditValue(content);
    }
  }, [content, isEditing]);

  // Focus automatico quando si entra in modalità editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Per Material-UI TextField, dobbiamo accedere all'input interno
      const inputElement = inputRef.current.querySelector('textarea') || inputRef.current.querySelector('input');
      if (inputElement) {
        inputElement.focus();
        // Posiziona il cursore alla fine del testo
        const length = editValue.length;
        inputElement.setSelectionRange(length, length);
      }
    }
  }, [isEditing, editValue.length]);

  // Funzione per entrare in modalità editing
  const handleStartEdit = useCallback(() => {
    if (!canEdit) return;
    setIsEditing(true);
    setError(null);
  }, [canEdit]);

  // Funzione per salvare le modifiche
  const handleSave = useCallback(async () => {
    if (!onUpdate || editValue === content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onUpdate(editValue);
      setIsEditing(false);
      setShowSuccess(true);

      // Nascondi il messaggio di successo dopo 2 secondi
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Errore durante il salvataggio del contenuto:', err);
      setError(err.message || 'Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, content, onUpdate]);

  // Funzione per annullare le modifiche
  const handleCancel = useCallback(() => {
    setEditValue(content);
    setIsEditing(false);
    setError(null);
  }, [content]);

  // Gestione eventi keyboard
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Gestione blur (salvataggio automatico)
  const handleBlur = useCallback(() => {
    if (isEditing && !isSaving) {
      handleSave();
    }
  }, [isEditing, isSaving, handleSave]);

  // Contenuto troncato per la visualizzazione
  const truncatedContent = content.length > maxLength && !expanded
    ? content.substring(0, maxLength) + '...'
    : content;

  // Placeholder quando non c'è contenuto
  const placeholder = 'Clicca per aggiungere contenuto alla storia...';

  if (isEditing) {
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
            📄 Contenuto Storia (Modifica)
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isSaving && (
              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
            )}
            <Tooltip title="Salva (Enter)">
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={isSaving}
                sx={{ color: 'success.main' }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Annulla (Esc)">
              <IconButton
                size="small"
                onClick={handleCancel}
                disabled={isSaving}
                sx={{ color: 'error.main' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          disabled={isSaving}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              '&.Mui-focused': {
                bgcolor: 'background.paper',
              },
              '& fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: 'primary.light',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              }
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
              lineHeight: 1.4,
              color: 'text.primary',
            }
          }}
        />

        {error && (
          <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
          📄 Contenuto Storia
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Fade in={showSuccess}>
            <Typography variant="caption" sx={{ color: 'success.main' }}>
              ✓ Salvato
            </Typography>
          </Fade>
          {canEdit && (
            <Tooltip title="Clicca per modificare">
              <IconButton
                size="small"
                onClick={handleStartEdit}
                sx={{
                  opacity: 0.7,
                  '&:hover': { opacity: 1 }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        onClick={canEdit ? handleStartEdit : undefined}
        sx={{
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
          color: content ? 'text.secondary' : 'text.disabled',
          bgcolor: 'background.default',
          p: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          cursor: canEdit ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          minHeight: '3em',
          display: 'flex',
          alignItems: content ? 'flex-start' : 'center',
          '&:hover': canEdit ? {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          } : {}
        }}
      >
        <Typography variant="body2" sx={{
          width: '100%',
          fontStyle: content ? 'normal' : 'italic'
        }}>
          {content ? truncatedContent : placeholder}
        </Typography>
      </Box>
    </Box>
  );
};

export default EditableStoryContent;
