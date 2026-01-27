/**
 * Componente per tooltip di preview del contenuto delle storie
 * Fornisce anteprima formattata del contenuto senza aprire pannelli
 */
import React, { memo, useMemo } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Article as ArticleIcon,
  ExpandMore as ExpandMoreIcon,
  Movie as MovieIcon,
  Brush as BrushIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

/**
 * Utility per troncare testo intelligentemente
 * Tronca a fine parola e mantiene formattazione base
 */
const smartTruncate = (text, maxLength = 200) => {
  if (!text || text.length <= maxLength) {
    return { text: text || '', isTruncated: false };
  }

  // Trova l'ultimo spazio prima del limite
  let truncateAt = maxLength;
  while (truncateAt > 0 && text[truncateAt] !== ' ') {
    truncateAt--;
  }

  // Se non trova spazi, tronca al limite
  if (truncateAt === 0) {
    truncateAt = maxLength;
  }

  return {
    text: text.substring(0, truncateAt).trim(),
    isTruncated: true
  };
};

/**
 * Componente per il contenuto del tooltip
 */
const TooltipContent = memo(({
  title,
  content,
  maxLength,
  item,
  showMetadata = true
}) => {
  const { text: truncatedContent, isTruncated } = useMemo(
    () => smartTruncate(content, maxLength),
    [content, maxLength]
  );

  // Estrai metadati dall'item se disponibili
  const metadata = useMemo(() => {
    if (!showMetadata || !item) return null;

    const meta = [];

    // Durata
    if (item.data?.timing?.duration) {
      meta.push({
        icon: AccessTimeIcon,
        label: 'Durata',
        value: item.data.timing.duration
      });
    }

    // Media associato
    if (item.data?.mediaDetails?.clipPath) {
      meta.push({
        icon: MovieIcon,
        label: 'Media',
        value: item.data.mediaDetails.clipPath.split('/').pop()
      });
    }

    // Template associati
    if (item.data?.templatesDetails?.length > 0) {
      meta.push({
        icon: BrushIcon,
        label: 'Template',
        value: `${item.data.templatesDetails.length} elementi`
      });
    } else if (item.data?.templateDetails?.templateFile) {
      meta.push({
        icon: BrushIcon,
        label: 'Template',
        value: item.data.templateDetails.templateFile.split('/').pop()
      });
    }

    return meta;
  }, [item, showMetadata]);

  return (
    <Box sx={{
      maxWidth: 400,
      p: 2,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      boxShadow: 3
    }}>
      {/* Header con titolo e icona */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1.5,
        pb: 1,
        borderBottom: '1px solid',
        borderBottomColor: 'divider'
      }}>
        <ArticleIcon sx={{
          mr: 1,
          color: 'warning.main',
          fontSize: 20
        }} />
        <Typography variant="subtitle1" sx={{
          fontWeight: 600,
          color: 'text.primary',
          flexGrow: 1
        }}>
          {title || 'Contenuto Storia'}
        </Typography>
        <Chip
          label="STORY"
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'warning.main',
            color: 'warning.main',
            fontSize: '0.7rem'
          }}
        />
      </Box>

      {/* Contenuto principale */}
      {truncatedContent ? (
        <Box sx={{ mb: metadata?.length > 0 ? 1.5 : 0 }}>
          <Typography variant="body2" sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            color: 'text.secondary',
            fontSize: '0.85rem'
          }}>
            {truncatedContent}
          </Typography>

          {isTruncated && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              pt: 1,
              borderTop: '1px dashed',
              borderTopColor: 'divider'
            }}>
              <ExpandMoreIcon sx={{
                mr: 0.5,
                fontSize: 16,
                color: 'primary.main'
              }} />
              <Typography variant="caption" sx={{
                fontStyle: 'italic',
                color: 'primary.main',
                fontWeight: 500
              }}>
                Click per vedere tutto...
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{
          color: 'text.disabled',
          fontStyle: 'italic',
          mb: metadata?.length > 0 ? 1.5 : 0
        }}>
          Nessun contenuto disponibile
        </Typography>
      )}

      {/* Metadati aggiuntivi */}
      {metadata && metadata.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {metadata.map((meta, index) => {
              const IconComponent = meta.icon;
              return (
                <Box key={index} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <IconComponent sx={{
                    fontSize: 14,
                    color: 'text.disabled'
                  }} />
                  <Typography variant="caption" sx={{
                    color: 'text.disabled',
                    minWidth: 50
                  }}>
                    {meta.label}:
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary',
                    fontWeight: 500
                  }}>
                    {meta.value}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
});

TooltipContent.displayName = 'TooltipContent';

/**
 * Componente principale per tooltip contenuto storia
 *
 * @param {Object} props - Proprietà del componente
 * @param {string} props.content - Contenuto della storia da mostrare
 * @param {string} props.title - Titolo della storia
 * @param {Object} props.item - Elemento completo della scaletta (per metadati)
 * @param {number} props.maxLength - Lunghezza massima del contenuto (default: 200)
 * @param {boolean} props.showMetadata - Se mostrare metadati aggiuntivi
 * @param {string} props.placement - Posizionamento del tooltip
 * @param {number} props.enterDelay - Ritardo prima di mostrare il tooltip (ms)
 * @param {Function} props.onClick - Callback per click sul tooltip
 * @param {React.ReactNode} props.children - Elemento trigger per il tooltip
 * @returns {JSX.Element} - Componente React
 */
const StoryContentTooltip = memo(({
  content,
  title,
  item,
  maxLength = 200,
  showMetadata = true,
  placement = 'right',
  enterDelay = 500,
  onClick,
  children,
  ...props
}) => {
  // Non mostrare tooltip se non c'è contenuto
  if (!content && !item?.data?.content) {
    return children;
  }

  const actualContent = content || item?.data?.content;
  const actualTitle = title || item?.data?.customName || item?.name;

  const handleTooltipClick = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(item || { content: actualContent, title: actualTitle });
    }
  };

  return (
    <Tooltip
      title={
        <TooltipContent
          title={actualTitle}
          content={actualContent}
          maxLength={maxLength}
          item={item}
          showMetadata={showMetadata}
        />
      }
      placement={placement}
      arrow
      enterDelay={enterDelay}
      leaveDelay={200}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            maxWidth: 'none',
            p: 0,
            cursor: onClick ? 'pointer' : 'default'
          }
        },
        arrow: {
          sx: {
            color: 'background.paper'
          }
        }
      }}
      onClick={onClick ? handleTooltipClick : undefined}
      {...props}
    >
      <Box component="span" sx={{ cursor: onClick ? 'pointer' : 'inherit' }}>
        {children}
      </Box>
    </Tooltip>
  );
});

StoryContentTooltip.displayName = 'StoryContentTooltip';

export default StoryContentTooltip;
