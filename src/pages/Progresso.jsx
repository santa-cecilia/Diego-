import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase'; // Ajuste esse caminho se necessário

const Progresso = () => {
  const [alunos, setAlunos] = useState([]);
  const [anotacoes, setAnotacoes] = useState({});
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const carregarAlunos = async () => {
      const { data, error } = await supabase.from('alunos').select('nome');
      if (error) {
        console.error('Erro ao carregar alunos:', error);
        return;
      }
      const nomes = data.map((a) => a.nome);
      setAlunos(nomes);
    };

    const carregarAnotacoes = async () => {
      const { data, error } = await supabase.from('anotacoes').select('*');
      if (error) {
        console.error('Erro ao carregar anotações:', error);
        return;
      }

      const agrupado = {};
      data.forEach(({ nomeAluno, data, texto }) => {
        if (!agrupado[nomeAluno]) agrupado[nomeAluno] = [];
        agrupado[nomeAluno].push({ data, texto });
      });

      setAnotacoes(agrupado);
    };

    carregarAlunos();
    carregarAnotacoes();
  }, []);

  const salvarAnotacao = async () => {
    if (!alunoSelecionado || !texto.trim()) {
      alert('Preencha todos os campos.');
      return;
    }

    const novaAnotacao = {
      nomeAluno: alunoSelecionado,
      data: new Date().toISOString().split('T')[0], // formato YYYY-MM-DD
      texto: texto.trim()
    };

    const { error } = await supabase.from('anotacoes').insert([novaAnotacao]);
    if (error) {
      console.error('Erro ao salvar anotação:', error);
      alert('Erro ao salvar anotação');
      return;
    }

    setAnotacoes((prev) => {
      const atualizadas = { ...prev };
      if (!atualizadas[alunoSelecionado]) atualizadas[alunoSelecionado] = [];
      atualizadas[alunoSelecionado].push({
        data: novaAnotacao.data,
        texto: novaAnotacao.texto
      });
      return atualizadas;
    });

    setTexto('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">📚 Registro de Progresso</h2>

      <select
        value={alunoSelecionado}
        onChange={(e) => setAlunoSelecionado(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      >
        <option value="">Selecione um aluno</option>
        {alunos.map((nome, i) => (
          <option key={i} value={nome}>{nome}</option>
        ))}
      </select>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Digite a anotação do progresso"
        className="border p-2 w-full h-32 rounded"
      />

      <button
        onClick={salvarAnotacao}
        className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded w-full mt-2"
      >
        Salvar Progresso
      </button>

      {alunoSelecionado && anotacoes[alunoSelecionado]?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Anotações anteriores:</h3>
          <ul className="space-y-2">
            {anotacoes[alunoSelecionado]
              .sort((a, b) => new Date(b.data) - new Date(a.data))
              .map((item, i) => (
                <li key={i} className="bg-gray-100 p-2 rounded shadow">
                  <p className="text-sm text-gray-600">📅 {item.data}</p>
                  <p>{item.texto}</p>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Progresso;
