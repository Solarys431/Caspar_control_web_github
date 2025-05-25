/**
 * Componente demo per testare i miglioramenti della tabella scalette
 * Mostra esempi di tutti i tipi di elementi con i nuovi componenti
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider
} from '@mui/material';
import ItemTypeIcon, { getSupportedTypes, getTypeColor } from './ItemTypeIcon';
import StatusBadge, { getSupportedStatuses } from './StatusBadge';
import StoryContentTooltip from './StoryContentTooltip';

/**
 * Dati di esempio per il test
 */
const sampleItems = [
  {
    id: 'demo-1',
    type: 'MEDIA',
    name: 'Video Apertura',
    data: {
      customName: 'Video Apertura Programma',
      clip: 'intro_video.mp4',
      timing: { duration: '00:01:30' }
    }
  },
  {
    id: 'demo-2',
    type: 'TEMPLATE',
    name: 'Logo Sponsor',
    data: {
      customName: 'Logo Sponsor Principale',
      template: 'sponsor_logo.ft',
      timing: { duration: '00:00:15' }
    }
  },
  {
    id: 'demo-3',
    type: 'STORY',
    name: 'Storia Principale',
    data: {
      customName: 'Intervista Innovazione Tecnologica',
      content: `Oggi parliamo dell'innovazione tecnologica nel settore broadcast. Il nostro ospite speciale sarà il CTO di una major company che ci spiegherà le ultime tendenze nel campo dell'intelligenza artificiale applicata alla produzione televisiva.

Durante l'intervista affronteremo temi come:
- L'impatto dell'AI sulla produzione di contenuti
- Le nuove tecnologie di streaming
- Il futuro del broadcasting tradizionale
- Le sfide della transizione digitale

L'intervista durerà circa 15 minuti e includerà una dimostrazione pratica delle nuove tecnologie.`,
      mediaDetails: {
        clipPath: 'intervista_cto.mp4'
      },
      templatesDetails: [
        { templateFile: 'lower_third.ft' },
        { templateFile: 'ticker_news.ft' }
      ],
      timing: { duration: '00:15:00' }
    }
  }
];

const sampleStatuses = ['LIVE', 'PLAYING', 'EDITING', 'SCHEDULED', 'IDLE', 'ERROR'];

/**
 * Componente demo principale
 */
const EnhancedTableDemo = () => {
  const [selectedStatus, setSelectedStatus] = useState('IDLE');

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🎨 Demo Miglioramenti Tabella Scalette
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Anteprima dei nuovi componenti: icone colorate, status badges e tooltip contenuto storie
      </Typography>

      {/* Sezione Icone Tipi */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Icone Tipi Elementi
        </Typography>
        <Grid container spacing={2}>
          {getSupportedTypes().map(type => (
            <Grid item xs={12} sm={6} md={4} key={type}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper'
              }}>
                <ItemTypeIcon type={type} size="medium" variant="badge" showBackground />
                <Box>
                  <Typography variant="subtitle2">{type}</Typography>
                  <Typography variant="caption" sx={{ color: getTypeColor(type) }}>
                    {getTypeColor(type)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Sezione Status Badges */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚦 Status Badges
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {getSupportedStatuses().map(status => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </Button>
          ))}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>Chip</Typography>
            <StatusBadge status={selectedStatus} variant="chip" size="medium" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>Minimal</Typography>
            <StatusBadge status={selectedStatus} variant="minimal" size="medium" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>Icon</Typography>
            <StatusBadge status={selectedStatus} variant="icon" size="medium" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>Dot</Typography>
            <StatusBadge status={selectedStatus} variant="dot" size="medium" />
          </Grid>
        </Grid>
      </Paper>

      {/* Sezione Story Content Tooltip */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📄 Story Content Tooltip
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Passa il mouse sopra gli elementi STORY per vedere il tooltip con preview del contenuto
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sampleItems.map(item => (
            <Box key={item.id} sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}>
              <ItemTypeIcon type={item.type} size="medium" />
              
              {item.type === 'STORY' && item.data?.content ? (
                <StoryContentTooltip
                  content={item.data.content}
                  title={item.data.customName}
                  item={item}
                  onClick={(item) => alert(`Clicked on: ${item.title}`)}
                >
                  <Typography variant="body1" sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'warning.main',
                      textDecoration: 'underline'
                    }
                  }}>
                    {item.data.customName}
                  </Typography>
                </StoryContentTooltip>
              ) : (
                <Typography variant="body1">
                  {item.data.customName}
                </Typography>
              )}
              
              <StatusBadge status={selectedStatus} variant="minimal" size="small" />
              
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {item.data.timing?.duration || 'N/A'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Sezione Combinazione Completa */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎭 Vista Combinata (Simulazione Tabella)
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 120px 100px',
          gap: 2,
          alignItems: 'center',
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
          mb: 1,
          fontWeight: 'bold'
        }}>
          <Typography variant="caption">Tipo</Typography>
          <Typography variant="caption">Nome</Typography>
          <Typography variant="caption">Status</Typography>
          <Typography variant="caption">Durata</Typography>
        </Box>
        
        {sampleItems.map((item, index) => (
          <Box key={item.id} sx={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 100px',
            gap: 2,
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}>
            <ItemTypeIcon type={item.type} size="small" />
            
            {item.type === 'STORY' && item.data?.content ? (
              <StoryContentTooltip
                content={item.data.content}
                title={item.data.customName}
                item={item}
              >
                <Typography variant="body2" sx={{
                  cursor: 'pointer',
                  '&:hover': { color: 'warning.main' }
                }}>
                  {item.data.customName}
                </Typography>
              </StoryContentTooltip>
            ) : (
              <Typography variant="body2">
                {item.data.customName}
              </Typography>
            )}
            
            <StatusBadge 
              status={index === 0 ? 'LIVE' : index === 1 ? 'EDITING' : 'IDLE'} 
              variant="chip" 
              size="small" 
            />
            
            <Typography variant="caption" color="text.secondary">
              {item.data.timing?.duration || 'N/A'}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default EnhancedTableDemo;
