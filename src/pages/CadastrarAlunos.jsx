import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const CadastrarAlunos = () => {
  const [alunos, setAlunos] = useState([]);
  const [aluno, setAluno] = useState({
    nome: '',
    nascimento: '',
    pais: '',
    servico: '',
    valor: '',
    tempo: '',
    matricula: '',
  });
  const [idade, setIdade] = useState('');
  const [busca, setBusca] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);

  useEffect(() => {
    const armazenados = JSON.parse(localStorage.getItem('alunos') || '[]');
    setAlunos(armazenados);
  }, []);

  useEffect(() => {
    if (aluno.nascimento) {
      const nasc = new Date(aluno.nascimento);
      const hoje = new Date();
      let anos = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
      setIdade(`${anos} anos`);
    } else {
      setIdade('');
    }
  }, [aluno.nascimento]);

  const salvarAlunos = (lista) => {
    localStorage.setItem('alunos', JSON.stringify(lista));
    setAlunos(lista);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!aluno.nome || !aluno.nascimento || !aluno.pais || !aluno.servico || !aluno.matricula) return;

    if (editandoIndex !== null) {
      const atualizados = [...alunos];
      atualizados[editandoIndex] = aluno;
      salvarAlunos(atualizados);
      setEditandoIndex(null);
    } else {
      salvarAlunos([...alunos, aluno]);
    }

    setAluno({ nome: '', nascimento: '', pais: '', servico: '', valor: '', tempo: '', matricula: '' });
    setIdade('');
  };

  const editarAluno = (index) => {
    setAluno(alunos[index]);
    setEditandoIndex(index);
  };

  const removerAluno = (index) => {
    const confirm = window.confirm('Tem certeza que deseja remover este aluno?');
    if (confirm) {
      const atualizados = alunos.filter((_, i) => i !== index);
      salvarAlunos(atualizados);
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(alunos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'alunos.xlsx');
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">👨‍🎓 Cadastro de Alunos</h2>
      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="Nome completo"
          value={aluno.nome}
          onChange={(e) => setAluno({ ...aluno, nome: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={aluno.nascimento}
          onChange={(e) => setAluno({ ...aluno, nascimento: e.target.value })}
          className="w-full p-2 border rounded"
        />
        {idade && <p className="text-sm text-gray-600">Idade: {idade}</p>}
        <input
          type="text"
          placeholder="Nome dos pais"
          value={aluno.pais}
          onChange={(e) => setAluno({ ...aluno, pais: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Serviço contratado"
          value={aluno.servico}
          onChange={(e) => setAluno({ ...aluno, servico: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          placeholder="Data da matrícula"
          value={aluno.matricula}
          onChange={(e) => setAluno({ ...aluno, matricula: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editandoIndex !== null ? 'Salvar Edição' : 'Cadastrar'}
        </button>
      </form>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span>🎯 Total de alunos: {alunos.length}</span>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-3 py-1 rounded">
            Exportar Excel
          </button>
        </div>
        <input
          type="text"
          placeholder="🔍 Buscar aluno pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full p-2 border mb-4 rounded"
        />

        {alunosFiltrados.length === 0 && (
          <p className="text-center text-gray-500">Nenhum aluno encontrado.</p>
        )}

        {alunosFiltrados.map((a, i) => (
          <div key={i} className="border-b py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>🧑 {a.nome}</p>
              <p>🎂 {a.nascimento}</p>
              <p>👪 {a.pais}</p>
              <p>📅 Matrícula: {a.matricula}</p>
              <p>🎼 Serviço: {a.servico}</p>
            </div>
            <div className="mt-2 sm:mt-0 flex gap-2">
              <button onClick={() => editarAluno(i)} className="bg-yellow-400 px-3 py-1 rounded text-white">
                Editar
              </button>
              <button onClick={() => removerAluno(i)} className="bg-red-500 px-3 py-1 rounded text-white">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CadastrarAlunos;
