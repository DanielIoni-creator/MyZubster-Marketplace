import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Bounty from './pages/Bounty';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bounty" element={<Bounty />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import UrbanGardenDashboard from './pages/UrbanGardenDashboard';

// Aggiungi la route
<Route path="/garden" element={<UrbanGardenDashboard />} />
