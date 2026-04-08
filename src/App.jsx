import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Game  from './pages/Game.jsx';

export default function App() {
  return (
    <Routes>
      <Route path='/'     element={<Home />} />
      <Route path='/game' element={<Game />}  />
    </Routes>
  );
}