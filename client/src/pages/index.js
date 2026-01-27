import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Rundown from './Rundown';
import MediaBrowser from './MediaBrowser';
import TemplateBrowser from './TemplateBrowser';
import Settings from './Settings';
import ScaletteEditor from './ScaletteEditor/index'; // Importa il componente refactorizzato

const Pages = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/rundown" element={<Rundown />} />
      <Route path="/media" element={<MediaBrowser />} />
      <Route path="/templates" element={<TemplateBrowser />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/scalette" element={<ScaletteEditor />} />
    </Routes>
  );
};

export default Pages;
