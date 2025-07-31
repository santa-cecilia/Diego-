import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const Progresso = () => {
  const [alunos, setAlunos] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      const { data: alunosData } = await supabase.from('alunos').select('nome');
      if (alunosData) {
        const nomes = alunosData.map((a) => a.nome);
        setAlunos(nomes);
      }

      const { data: anotacoesData } = await supabase.from('anotacoes').select('*');
      if (anotacoesData) {
        const agrupado = {};
        anotacoesData.forEach(({ nomeAluno, data, texto, id }) => {
          if (!agrupado[nomeAluno]) agrupado[nomeAluno] = [];
          agrupado[nomeAluno].push({ id, data, texto });
        });
        setProgresso(agrupado);
        localStorage.setItem('progresso', JSON.stringify(agrupado));
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

    const { data, error } = await supabase.from('anotacoes').insert([novaEntrada]).select();
    if (error) {
      alert('Erro ao salvar no Supabase');
      return;
    }

    const atual = { ...progresso };
    if (!atual[alunoSelecionado]) atual[alunoSelecionado] = [];
    atual[alunoSelecionado].push({ ...novaEntrada, id: data[0].id });
    setProgresso(atual);
    localStorage.setItem('progresso', JSON.stringify(atual));
    setTexto('');
  };

  const excluirAnotacao = async (id, aluno) => {
    await supabase.from('anotacoes').delete().eq('id', id);
    const atual = { ...progresso };
    atual[aluno] = atual[aluno].filter((a) => a.id !== id);
    setProgresso(atual);
    localStorage.setItem('progresso', JSON.stringify(atual));
  };

  const exportarExcel = () => {
    const linhas = [];
    Object.keys(progresso).forEach((aluno) => {
      progresso[aluno].forEach((item) => {
        linhas.push({ Aluno: aluno, Data: item.data, Anotação: item.texto });
      });
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Progresso');
    XLSX.writeFile(wb, 'progresso_alunos.xlsx');
  };

  const exportarWord = async () => {
    const children = [];

    Object.keys(progresso).forEach((aluno) => {
      children.push(new Paragraph({ text: `Aluno: ${aluno}`, bold: true }));
      progresso[aluno].forEach((item) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Data: ${item.data} - `, bold: true }),
              new TextRun(item.texto),
            ],
          })
        );
      });
      children.push(new Paragraph(''));
    });

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'progresso_alunos.docx');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Anotações</h2>

      <select
        value={alunoSelecionado}
        onChange={(e) => setAlunoSelecionado(e.target.value)}
        className="border p-2 mb-4 w-full rounded"
      >
        <option value="">Selecione um aluno</option>
        {alunos.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select><br />
      <br />

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Digite a anotação"
        className="border p-2 w-full h-32 rounded"
      /><br />

      <button
        onClick={salvarProgresso}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2 w-full"
      >
        Salvar
      </button>

      {(Object.keys(progresso).length > 0) && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={exportarExcel}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-1/2"
          >
            Exportar Excel
          </button>
          <button
            onClick={exportarWord}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded w-1/2"
          >
            Exportar Word
          </button>
        </div>
      )}

      {alunoSelecionado && progresso[alunoSelecionado]?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Anotações anteriores:</h3>
          <ul className="space-y-2">
            {progresso[alunoSelecionado]
              .sort((a, b) => new Date(b.data) - new Date(a.data))
              .map((item, i) => (
                <li key={i} className="bg-gray-100 p-2 rounded flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">📅 {item.data}</p>
                    <p>{item.texto}</p>
                  </div>
                  <button
                    onClick={() => excluirAnotacao(item.id, alunoSelecionado)}
                    className="text-red-600 font-bold text-sm ml-2"
                  >
                    Excluir
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Progresso;
