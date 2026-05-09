import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Endpoints from './pages/Endpoints';
import Sql from './pages/Sql';
import Functions from './pages/Functions';
import Exceptions from './pages/Exceptions';
import Recordings from './pages/Recordings';
import RecordingDetail from './pages/RecordingDetail';
import Search from './pages/Search';
import Labels from './pages/Labels';
import Compare from './pages/Compare';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/sql" element={<Sql />} />
          <Route path="/functions" element={<Functions />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/recordings/detail" element={<RecordingDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/labels" element={<Labels />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
