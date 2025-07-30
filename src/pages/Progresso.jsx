import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase'; // ajuste o caminho conforme sua estrutura

const Progresso = () => {
  const [alunos, setAlunos] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      // Carrega alunos do Supabase
      const { data: alunosData, error: alunosErro } = await supabase.from('alunos').select('nome');
      if (!alunosErro && alunosData) {
        const nomes = alunosData.map((a) => a.nome);
        setAlunos(nomes);
      }

      // Carrega anotações do Supabase
      const { data: anotacoesData, error: anotacoesErro } = await supabase.from('anotacoes').select('*');
      if (!anotacoesErro && anotacoesData) {
        const agrupado = {};
        anotacoesData.forEach(({ nomeAluno, data, texto }) => {
          if (!agrupado[nomeAluno]) agrupado[nomeAluno] = [];
          agrupado[nomeAluno].push({ data, texto });
        });
        setProgresso(agrupado);
        localStorage.setItem('progresso', JSON.stringify(agrupado));
      } else {
        // fallback para localStorage se não carregar do Supabase
        const salvo = JSON.parse(localStorage.getItem('progresso')) || {};
        setProgresso(salvo);
      }
    };

    carregarDados();
  }, []);

  const salvarProgresso = async () => {
    if (!alunoSelecionado || !texto.trim()) return;

    const novaEntrada = {
      nomeAluno: alunoSelecionado,
      data: new Date().toISOString().split('T')[0],
      texto: texto.trim()
    };

    // Salva no Supabase
    const { error } = await supabase.from('anotacoes').insert([novaEntrada]);
    if (error) {
      alert('Erro ao salvar no Supabase');
      console.error(error);
    }

    // Atualiza local
    const atual = { ...progresso };
    if (!atual[alunoSelecionado]) atual[alunoSelecionado] = [];
    atual[alunoSelecionado].push({ data: novaEntrada.data, texto: novaEntrada.texto });
    setProgresso(atual);
    localStorage.setItem('progresso', JSON.stringify(atual));
    setTexto('');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">📝 Registro de Progresso</h2>

      <select
        value={alunoSelecionado}
        onChange={(e) => setAlunoSelecionado(e.target.value)}
        className="border p-2 mb-4 w-full rounded"
      >
        <option value="">Selecione um aluno</option>
        {alunos.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Digite a anotação"
        className="border p-2 w-full h-32 rounded"
      />

      <button
        onClick={salvarProgresso}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2 w-full"
      >
        Salvar
      </button>

      {alunoSelecionado && progresso[alunoSelecionado]?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Anotações anteriores:</h3>
          <ul className="space-y-2">
            {progresso[alunoSelecionado]
              .sort((a, b) => new Date(b.data) - new Date(a.data))
              .map((item, i) => (
                <li key={i} className="bg-gray-100 p-2 rounded">
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
