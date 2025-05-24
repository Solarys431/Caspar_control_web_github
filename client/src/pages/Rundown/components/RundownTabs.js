import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

/**
 * Componente per la gestione delle tab per passare tra rundown e calendario.
 */
const RundownTabs = ({ tabValue, handleTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="rundown tabs"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          icon={<PlayArrowIcon />}
          label="Rundown"
          id="tab-0"
          aria-controls="tabpanel-0"
        />
        <Tab
          icon={<CalendarMonthIcon />}
          label="Calendario"
          id="tab-1"
          aria-controls="tabpanel-1"
        />
      </Tabs>
    </Box>
  );
};

export default RundownTabs;
