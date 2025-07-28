
import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return usuario ? (
    <Dashboard />
  ) : (
    <Login />
  );
}

export default App;
