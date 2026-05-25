import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <h1>Works Reruiter</h1>
      <p>Reasoning-First Recruitment Platform</p>
    </div>
  );
}
