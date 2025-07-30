import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase'; // Certifique-se que esse caminho esteja correto

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

  useEffect(() => {
    const servicosSalvos = JSON.parse(localStorage.getItem('servicos')) || [];
    setServicos(servicosSalvos);

    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    const { data, error } = await supabase.from('alunos').select('*');
    if (!error) {
      setAlunos(data);
    }
  };

  const calcularIdade = (data) => {
    const nascimento = new Date(data);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
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

  const adicionarAluno = async () => {
    if (editandoIndex !== null) {
      // Atualização local apenas
      const novosAlunos = [...alunos];
      novosAlunos[editandoIndex] = form;
      setAlunos(novosAlunos);
      setEditandoIndex(null);
      localStorage.setItem('alunos', JSON.stringify(novosAlunos));
    } else {
      const { data, error } = await supabase.from('alunos').insert([form]);
      if (!error) {
        const novosAlunos = [...alunos, form];
        setAlunos(novosAlunos);
        localStorage.setItem('alunos', JSON.stringify(novosAlunos));
      } else {
        alert('Erro ao salvar no Supabase');
        console.error(error);
      }
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
  };

  const editarAluno = (index) => {
    const aluno = alunos[index];
    setForm(aluno);
    setEditandoIndex(index);
  };

  const removerAluno = async (index) => {
    const aluno = alunos[index];
    const { error } = await supabase.from('alunos').delete().eq('nome', aluno.nome);
    if (!error) {
      const novosAlunos = alunos.filter((_, i) => i !== index);
      setAlunos(novosAlunos);
      localStorage.setItem('alunos', JSON.stringify(novosAlunos));
    } else {
      alert('Erro ao remover do Supabase');
    }
  };

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <p className="text-center mb-6">ALUNOS CADASTRADO: {alunos.length}</p>

      <form className="space-y-4">
        <input name="nome" value={form.nome} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Nome Completo" /><br />
        <input type="date" name="nascimento" value={form.nascimento} onChange={handleChange} className="border p-2 w-full rounded" /><br />
        <input name="idade" value={form.idade} readOnly className="border p-2 w-full bg-gray-100 rounded" placeholder="Idade" /><br />
        <input name="pais" value={form.pais} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Nome dos Pais" /><br />
        <select name="cidade" value={form.cidade} onChange={handleChange} className="border p-2 w-full rounded"><br />
          <option value="">Selecione a cidade</option>
          <option value="Mafra">Mafra</option>
          <option value="Rio Negro">Rio Negro</option>
          <option value="Itaiópolis">Itaiópolis</option>
          <option value="Outra">Outra</option>
        </select><br />
        <select name="servico" value={form.servico} onChange={handleChange} className="border p-2 w-full rounded"><br />
          <option value="">Selecione um valor</option>
          {servicos.map((s, i) => (
            <option key={i} value={`R$ ${parseFloat(s.valor).toFixed(2)}`}>
              R$ {parseFloat(s.valor).toFixed(2)}
            </option>
          ))}
        </select><br />
        <select name="diaSemana" value={form.diaSemana} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Selec. Dia/Semana</option>
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, i) => (
            <option key={i} value={dia}>{dia}</option>
          ))}
        </select><br />
        <input type="time" name="horario" value={form.horario} onChange={handleChange} className="border p-2 w-full rounded" /><br />

        <button
          type="button"
          onClick={adicionarAluno}
          className="bg-yellow-400 hover:bg-yellow-300 px-4 py-2 w-full rounded font-semibold"
        >
          {editandoIndex !== null ? 'Atualizar Aluno' : 'Adicionar Aluno'}
        </button>
      </form><br />

      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <input type="text" placeholder="Buscar aluno por nome" className="border p-2 flex-1 rounded" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <button className="border px-4 py-2 rounded">📥 Excel</button>
        <button className="border px-4 py-2 rounded">📥 Word</button>
      </div>

      <ul className="mt-6 space-y-4">
        {alunosFiltrados.map((aluno, index) => (
          <li key={index} className="border p-4 rounded shadow">
            <p>
              <strong>{aluno.nome}</strong> — Nasc: {aluno.nascimento} — Idade: {aluno.idade} — Pais: {aluno.pais} — Cidade: {aluno.cidade} — Serviço: {aluno.servico} — {aluno.diaSemana} às {aluno.horario}
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => editarAluno(index)} className="bg-yellow-100 px-3 py-1 rounded border text-yellow-800">Editar</button>
              <button onClick={() => removerAluno(index)} className="bg-red-100 px-3 py-1 rounded border text-red-600">Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CadastrarAlunos;
