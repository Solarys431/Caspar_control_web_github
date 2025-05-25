/**
 * Tema professionale broadcast-grade per CasparCG Control Web
 * Palette colori e stili conformi agli standard dell'industria televisiva
 */

// Palette colori broadcast professionale
export const broadcastColors = {
  // Colori primari broadcast
  primary: {
    main: '#1976d2',      // Blu broadcast standard
    dark: '#115293',      // Blu scuro per contrasti
    light: '#42a5f5',     // Blu chiaro per highlights
    contrastText: '#ffffff'
  },
  
  // Colori di stato operativo
  status: {
    onAir: '#f44336',     // Rosso ON AIR
    ready: '#4caf50',     // Verde READY
    warning: '#ff9800',   // Arancione WARNING
    error: '#d32f2f',     // Rosso ERROR
    next: '#ffc107',      // Giallo NEXT
    standby: '#9e9e9e',   // Grigio STANDBY
    live: '#e91e63',      // Magenta LIVE
    preview: '#673ab7'    // Viola PREVIEW
  },
  
  // Sfondo e superfici
  background: {
    primary: '#0a0a0a',   // Nero profondo principale
    secondary: '#1a1a1a', // Grigio scuro secondario
    elevated: '#2a2a2a',  // Grigio elevato per card
    panel: '#1e1e1e',     // Grigio pannelli
    header: '#0d1117',    // Nero header
    sidebar: '#161b22'    // Grigio sidebar
  },
  
  // Testi
  text: {
    primary: '#ffffff',   // Bianco principale
    secondary: '#b3b3b3', // Grigio chiaro
    disabled: '#666666',  // Grigio disabilitato
    accent: '#00d4ff',    // Ciano accent
    timecode: '#00ff00'   // Verde timecode (classico broadcast)
  },
  
  // Bordi e divisori
  border: {
    primary: '#333333',   // Grigio bordi
    accent: '#444444',    // Grigio accent
    highlight: '#555555', // Grigio highlight
    focus: '#1976d2'      // Blu focus
  },
  
  // Gradients broadcast
  gradients: {
    header: 'linear-gradient(135deg, #0d1117 0%, #1a1a1a 100%)',
    panel: 'linear-gradient(180deg, #1e1e1e 0%, #1a1a1a 100%)',
    button: 'linear-gradient(135deg, #1976d2 0%, #115293 100%)',
    onAir: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
  }
};

// Tipografia broadcast professionale
export const broadcastTypography = {
  // Font families
  fontFamily: {
    primary: '"Roboto", "Helvetica", "Arial", sans-serif',
    monospace: '"Roboto Mono", "Consolas", "Monaco", monospace',
    display: '"Roboto Condensed", "Arial Narrow", sans-serif'
  },
  
  // Dimensioni font
  fontSize: {
    xs: '0.7rem',    // 11.2px
    sm: '0.8rem',    // 12.8px
    md: '0.875rem',  // 14px
    lg: '1rem',      // 16px
    xl: '1.125rem',  // 18px
    xxl: '1.25rem',  // 20px
    display: '1.5rem' // 24px
  },
  
  // Pesi font
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  // Altezze linea
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6
  }
};

// Spaziature broadcast
export const broadcastSpacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px'
};

// Elevazioni e ombre
export const broadcastElevation = {
  none: 'none',
  low: '0 1px 3px rgba(0, 0, 0, 0.3)',
  medium: '0 2px 6px rgba(0, 0, 0, 0.4)',
  high: '0 4px 12px rgba(0, 0, 0, 0.5)',
  extreme: '0 8px 24px rgba(0, 0, 0, 0.6)'
};

// Animazioni broadcast
export const broadcastAnimations = {
  // Durate
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms'
  },
  
  // Easing
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)'
  },
  
  // Keyframes
  keyframes: {
    pulse: {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.7 },
      '100%': { opacity: 1 }
    },
    glow: {
      '0%': { boxShadow: '0 0 5px rgba(25, 118, 210, 0.5)' },
      '50%': { boxShadow: '0 0 20px rgba(25, 118, 210, 0.8)' },
      '100%': { boxShadow: '0 0 5px rgba(25, 118, 210, 0.5)' }
    },
    slideIn: {
      '0%': { transform: 'translateX(-100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 }
    }
  }
};

// Componenti broadcast specifici
export const broadcastComponents = {
  // Stili per header broadcast
  header: {
    height: '64px',
    background: broadcastColors.gradients.header,
    borderBottom: `1px solid ${broadcastColors.border.primary}`,
    boxShadow: broadcastElevation.medium,
    color: broadcastColors.text.primary,
    fontFamily: broadcastTypography.fontFamily.display,
    fontWeight: broadcastTypography.fontWeight.semibold
  },
  
  // Stili per pannelli
  panel: {
    background: broadcastColors.gradients.panel,
    border: `1px solid ${broadcastColors.border.primary}`,
    borderRadius: '4px',
    boxShadow: broadcastElevation.low,
    color: broadcastColors.text.primary
  },
  
  // Stili per pulsanti broadcast
  button: {
    primary: {
      background: broadcastColors.gradients.button,
      border: `1px solid ${broadcastColors.primary.dark}`,
      borderRadius: '4px',
      color: broadcastColors.text.primary,
      fontWeight: broadcastTypography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: `all ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`,
      '&:hover': {
        background: broadcastColors.primary.light,
        boxShadow: broadcastElevation.medium
      }
    },
    
    onAir: {
      background: broadcastColors.gradients.onAir,
      border: `1px solid ${broadcastColors.status.error}`,
      borderRadius: '4px',
      color: broadcastColors.text.primary,
      fontWeight: broadcastTypography.fontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      animation: 'pulse 1.5s infinite'
    }
  },
  
  // Stili per tabelle broadcast
  table: {
    header: {
      background: broadcastColors.background.header,
      borderBottom: `2px solid ${broadcastColors.border.accent}`,
      color: broadcastColors.text.primary,
      fontFamily: broadcastTypography.fontFamily.display,
      fontWeight: broadcastTypography.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontSize: broadcastTypography.fontSize.sm
    },
    
    row: {
      borderBottom: `1px solid ${broadcastColors.border.primary}`,
      transition: `all ${broadcastAnimations.duration.fast} ${broadcastAnimations.easing.standard}`,
      '&:hover': {
        background: broadcastColors.background.elevated,
        transform: 'translateY(-1px)',
        boxShadow: broadcastElevation.low
      },
      '&.selected': {
        background: `${broadcastColors.primary.main}20`,
        borderLeft: `4px solid ${broadcastColors.primary.main}`
      },
      '&.on-air': {
        background: `${broadcastColors.status.onAir}20`,
        borderLeft: `4px solid ${broadcastColors.status.onAir}`,
        animation: 'glow 2s infinite'
      },
      '&.next': {
        background: `${broadcastColors.status.next}20`,
        borderLeft: `4px solid ${broadcastColors.status.next}`
      }
    },
    
    cell: {
      padding: broadcastSpacing.md,
      color: broadcastColors.text.primary,
      fontSize: broadcastTypography.fontSize.sm,
      fontFamily: broadcastTypography.fontFamily.primary,
      verticalAlign: 'middle'
    },
    
    cellTimecode: {
      padding: broadcastSpacing.md,
      color: broadcastColors.text.timecode,
      fontSize: broadcastTypography.fontSize.sm,
      fontFamily: broadcastTypography.fontFamily.monospace,
      fontWeight: broadcastTypography.fontWeight.medium,
      verticalAlign: 'middle',
      letterSpacing: '0.5px'
    }
  },
  
  // Stili per badge di stato
  statusBadge: {
    onAir: {
      background: broadcastColors.status.onAir,
      color: broadcastColors.text.primary,
      fontWeight: broadcastTypography.fontWeight.bold,
      fontSize: broadcastTypography.fontSize.xs,
      padding: `${broadcastSpacing.xs} ${broadcastSpacing.sm}`,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      animation: 'pulse 1.5s infinite'
    },
    
    ready: {
      background: broadcastColors.status.ready,
      color: broadcastColors.text.primary,
      fontWeight: broadcastTypography.fontWeight.medium,
      fontSize: broadcastTypography.fontSize.xs,
      padding: `${broadcastSpacing.xs} ${broadcastSpacing.sm}`,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    
    next: {
      background: broadcastColors.status.next,
      color: broadcastColors.background.primary,
      fontWeight: broadcastTypography.fontWeight.bold,
      fontSize: broadcastTypography.fontSize.xs,
      padding: `${broadcastSpacing.xs} ${broadcastSpacing.sm}`,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  },
  
  // Stili per barre di progresso
  progressBar: {
    background: broadcastColors.background.secondary,
    height: '6px',
    borderRadius: '3px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    
    fill: {
      background: `linear-gradient(90deg, ${broadcastColors.status.ready} 0%, ${broadcastColors.primary.main} 100%)`,
      height: '100%',
      borderRadius: '3px',
      transition: `width ${broadcastAnimations.duration.normal} ${broadcastAnimations.easing.standard}`
    }
  }
};

// Tema Material-UI personalizzato per broadcast
export const createBroadcastTheme = (mode = 'dark') => ({
  palette: {
    mode,
    primary: {
      main: broadcastColors.primary.main,
      dark: broadcastColors.primary.dark,
      light: broadcastColors.primary.light,
      contrastText: broadcastColors.primary.contrastText
    },
    background: {
      default: broadcastColors.background.primary,
      paper: broadcastColors.background.secondary
    },
    text: {
      primary: broadcastColors.text.primary,
      secondary: broadcastColors.text.secondary,
      disabled: broadcastColors.text.disabled
    }
  },
  typography: {
    fontFamily: broadcastTypography.fontFamily.primary,
    h1: {
      fontFamily: broadcastTypography.fontFamily.display,
      fontWeight: broadcastTypography.fontWeight.bold,
      fontSize: '2rem',
      lineHeight: broadcastTypography.lineHeight.tight
    },
    h2: {
      fontFamily: broadcastTypography.fontFamily.display,
      fontWeight: broadcastTypography.fontWeight.semibold,
      fontSize: '1.5rem',
      lineHeight: broadcastTypography.lineHeight.tight
    },
    body1: {
      fontSize: broadcastTypography.fontSize.md,
      lineHeight: broadcastTypography.lineHeight.normal
    },
    body2: {
      fontSize: broadcastTypography.fontSize.sm,
      lineHeight: broadcastTypography.lineHeight.normal
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: broadcastTypography.fontWeight.medium,
          letterSpacing: '0.5px'
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: broadcastComponents.table.header
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: broadcastComponents.table.row
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: broadcastComponents.table.cell
      }
    }
  }
});

export default {
  broadcastColors,
  broadcastTypography,
  broadcastSpacing,
  broadcastElevation,
  broadcastAnimations,
  broadcastComponents,
  createBroadcastTheme
};
