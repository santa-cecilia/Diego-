import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; // ajuste conforme o caminho
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CadastrarAlunos = () => {
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({
    nome: '',
    nascimento: '',
    idade: '',
    pais: '',
    cidade: '',
    servico: '',
    diaSemana: '',
    horario: ''
  });
  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState('');
  const [editandoIndex, setEditandoIndex] = useState(null);

  // Carrega serviços e alunos do Supabase
  useEffect(() => {
    buscarServicos();
    buscarAlunos();
  }, []);

  const buscarServicos = async () => {
    const { data, error } = await supabase.from('servicos').select('*');
    if (!error) setServicos(data);
  };

  const buscarAlunos = async () => {
    const { data, error } = await supabase.from('alunos').select('*').order('id', { ascending: false });
    if (!error) setAlunos(data);
  };

  const calcularIdade = (dataStr) => {
    const nascimento = new Date(dataStr);
    const hoje = new Date();
    let idadeCalc = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idadeCalc--;
    return idadeCalc;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nascimento') {
      const idade = calcularIdade(value);
      setForm({ ...form, nascimento: value, idade });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const adicionarAluno = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.nascimento || !form.pais || !form.servico || !form.diaSemana || !form.horario) {
      alert('Preencha todos os campos');
      return;
    }

    const dados = {
      nome: form.nome,
      nascimento: form.nascimento,
      idade: form.idade,
      pais: form.pais,
      cidade: form.cidade,
      servico: form.servico,
      dia_semana: form.diaSemana,
      horario: form.horario
    };

    if (editandoIndex !== null) {
      const id = alunos[editandoIndex].id;
      await supabase.from('alunos').update(dados).eq('id', id);
      setEditandoIndex(null);
    } else {
      await supabase.from('alunos').insert([dados]);
    }

    setForm({
      nome: '',
      nascimento: '',
      idade: '',
      pais: '',
      cidade: '',
      servico: '',
      diaSemana: '',
      horario: ''
    });
    buscarAlunos();
  };

  const editarAluno = (index) => {
    const a = alunos[index];
    setForm({
      nome: a.nome,
      nascimento: a.nascimento,
      idade: a.idade || calcularIdade(a.nascimento),
      pais: a.pais,
      cidade: a.cidade,
      servico: a.servico,
      diaSemana: a.dia_semana,
      horario: a.horario
    });
    setEditandoIndex(index);
  };

  const removerAluno = async (index) => {
    const id = alunos[index].id;
    await supabase.from('alunos').delete().eq('id', id);
    buscarAlunos();
  };

  const exportarExcel = () => {
    const planilha = XLSX.utils.json_to_sheet(alunos.map(a => ({
      Nome: a.nome,
      Nascimento: a.nascimento,
      Idade: calcularIdade(a.nascimento),
      Pais: a.pais,
      Cidade: a.cidade,
      Serviço: a.servico,
      Dia: a.dia_semana,
      Horário: a.horario
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, planilha, 'Alunos');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'alunos.xlsx');
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <p className="text-center mb-6">ALUNOS CADASTRADOS: {alunos.length}</p>

      <form onSubmit={adicionarAluno} className="space-y-4">
        <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome Completo" className="border p-2 w-full rounded" />
        <input type="date" name="nascimento" value={form.nascimento} onChange={handleChange} className="border p-2 w-full rounded" />
        <input name="idade" value={form.idade} readOnly placeholder="Idade" className="border p-2 w-full bg-gray-100 rounded" />
        <input name="pais" value={form.pais} onChange={handleChange} placeholder="Nome dos Pais" className="border p-2 w-full rounded" />
        <select name="cidade" value={form.cidade} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Selecione a cidade</option>
          <option value="Mafra">Mafra</option>
          <option value="Rio Negro">Rio Negro</option>
          <option value="Itaiópolis">Itaiópolis</option>
          <option value="Outra">Outra</option>
        </select>
        <select name="servico" value={form.servico} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Selecione um serviço</option>
          {servicos.map((s, i) => (
            <option key={i} value={`${s.instrumento} – R$ ${parseFloat(s.valor).toFixed(2)}`}>
              {s.instrumento} – R$ {parseFloat(s.valor).toFixed(2)}
            </option>
          ))}
        </select>
        <select name="diaSemana" value={form.diaSemana} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Selec. Dia/Semana</option>
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input type="time" name="horario" value={form.horario} onChange={handleChange} className="border p-2 w-full rounded" />
        <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 px-4 py-2 w-full rounded font-semibold">
          {editandoIndex !== null ? 'Atualizar Aluno' : 'Adicionar Aluno'}
        </button>
      </form>

      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <input type="text" placeholder="Buscar aluno por nome" className="border p-2 flex-1 rounded" value={busca} onChange={e => setBusca(e.target.value)} />
        <button onClick={exportarExcel} className="border px-4 py-2 rounded">📥 Excel</button>
      </div>

      <ul className="mt-6 space-y-4">
        {alunosFiltrados.map((aluno, i) => (
          <li key={aluno.id || i} className="border p-4 rounded shadow">
            <p><strong>{aluno.nome}</strong> — Nasc: {aluno.nascimento} — Idade: {aluno.idade || calcularIdade(aluno.nascimento)} — Pais: {aluno.pais} — Cidade: {aluno.cidade} — Serviço: {aluno.servico} — {aluno.diaSemana} às {aluno.horario}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => editarAluno(i)} className="bg-yellow-100 px-3 py-1 rounded border text-yellow-800">Editar</button>
              <button onClick={() => removerAluno(i)} className="bg-red-100 px-3 py-1 rounded border text-red-600">Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CadastrarAlunos;
