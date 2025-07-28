// src/hooks/useAuth.js
import { useEffect, useState } from 'react';

// Chaves de armazenamento no localStorage
const USERS_KEY = 'usuarios';
const LOGGED_KEY = 'usuario_logado';

export const useAuth = () => {
  const [usuario, setUsuario] = useState(null);

  // Criar usuário padrão se não existir e carregar o usuário logado
  useEffect(() => {
    const usuarios = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    const jaExiste = usuarios.some(u => u.email === 'admin@exemplo.com');
    if (!jaExiste) {
      usuarios.push({ nome: 'Admin', email: 'admin@exemplo.com', senha: '123456' });
      localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
    }

    const data = localStorage.getItem(LOGGED_KEY);
    if (data) {
      try {
        setUsuario(JSON.parse(data));
      } catch (e) {
        console.error("Erro ao carregar usuário logado:", e);
        localStorage.removeItem(LOGGED_KEY);
      }
    }
  }, []);

  // Login simples baseado em localStorage
  const login = (email, senha) => {
    const usuarios = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const encontrado = usuarios.find(
      (u) => u.email === email && u.senha === senha
    );

    if (encontrado) {
      setUsuario(encontrado);
      localStorage.setItem(LOGGED_KEY, JSON.stringify(encontrado));
      return true;
    }

    return false;
  };

  // Logout remove o estado e limpa o localStorage
  const logout = () => {
    setUsuario(null);
    localStorage.removeItem(LOGGED_KEY);
  };

  // Cadastrar novo usuário
  const cadastrar = (nome, email, senha) => {
    const usuarios = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    if (usuarios.some((u) => u.email === email)) {
      return false; // já existe
    }

    const novo = { nome, email, senha };
    usuarios.push(novo);
    localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
    return true;
  };

  return {
    usuario,
    login,
    logout,
    cadastrar,
  };
};
