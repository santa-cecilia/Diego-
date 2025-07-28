import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-blue-100 p-4 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">🎵 Santa Cecília</h2>
      <nav className="flex flex-col space-y-3">
        <Link to="/agenda" className="hover:text-blue-600">📆 Agenda</Link>
        <Link to="/agenda-anual" className="hover:text-blue-600">📅 Agenda Anual</Link>
        <Link to="/servicos" className="hover:text-blue-600">🛠️ Serviços</Link>
        <Link to="/alunos" className="hover:text-blue-600">👩‍🎓 Cadastrar Alunos</Link>
        <Link to="/progresso" className="hover:text-blue-600">📈 Progresso</Link>
        <Link to="/pagamentos" className="hover:text-blue-600">💸 Pagamentos</Link>
      </nav>
    </div>
  );
};

export default Sidebar;
