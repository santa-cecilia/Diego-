import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Agenda from './pages/Agenda';
import AgendaAnual from './pages/AgendaAnual';
import Servicos from './pages/Servicos';
import CadastrarAlunos from './pages/CadastrarAlunos';
import Progresso from './pages/Progresso';
import Pagamentos from './pages/Pagamentos';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-gray-100 min-h-screen">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/agenda-anual" element={<AgendaAnual />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/cadastrar-alunos" element={<CadastrarAlunos />} />
            <Route path="/progresso" element={<Progresso />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
