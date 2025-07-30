import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FaTrash, FaEdit, FaUserGraduate } from "react-icons/fa";
import * as XLSX from "xlsx";

function calcularIdade(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

export default function CadastrarAluno() {
  const [alunos, setAlunos] = useState([]);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [nomePais, setNomePais] = useState("");
  const [dataMatricula, setDataMatricula] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [servicoValor, setServicoValor] = useState("");
  const [servicoTempo, setServicoTempo] = useState("");

  useEffect(() => {
    buscarAlunos();
    buscarServicos();
  }, []);

  async function buscarAlunos() {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setAlunos(data);
  }

  async function buscarServicos() {
    const { data, error } = await supabase.from("servicos").select("*");
    if (!error) setServicos(data);
  }

  async function adicionarAluno(e) {
    e.preventDefault();
    if (!nome || !dataNascimento || !nomePais || !dataMatricula || !servicoSelecionado) {
      alert("Preencha todos os campos.");
      return;
    }

    const servico = servicos.find((s) => s.nome === servicoSelecionado);

    const novoAluno = {
      nome,
      data_nascimento: dataNascimento,
      nome_pais: nomePais,
      data_matricula: dataMatricula,
      servico_nome: servicoSelecionado,
      servico_valor: servico.valor,
      servico_tempo: servico.tempo,
    };

    if (editandoId) {
      await supabase.from("alunos").update(novoAluno).eq("id", editandoId);
      setEditandoId(null);
    } else {
      await supabase.from("alunos").insert([novoAluno]);
    }

    setNome("");
    setDataNascimento("");
    setNomePais("");
    setDataMatricula("");
    setServicoSelecionado("");
    setServicoValor("");
    setServicoTempo("");
    buscarAlunos();
  }

  async function removerAluno(id) {
    await supabase.from("alunos").delete().eq("id", id);
    buscarAlunos();
  }

  function editarAluno(aluno) {
    setNome(aluno.nome);
    setDataNascimento(aluno.data_nascimento);
    setNomePais(aluno.nome_pais);
    setDataMatricula(aluno.data_matricula);
    setServicoSelecionado(aluno.servico_nome);
    setServicoValor(aluno.servico_valor);
    setServicoTempo(aluno.servico_tempo);
    setEditandoId(aluno.id);
  }

  function exportarExcel() {
    const dados = alunos.map((a) => ({
      Nome: a.nome,
      "Data de Nascimento": a.data_nascimento,
      Idade: calcularIdade(a.data_nascimento),
      "Nome dos Pais": a.nome_pais,
      "Data da Matrícula": a.data_matricula,
      "Serviço": a.servico_nome,
      "Valor": a.servico_valor,
      "Tempo": a.servico_tempo,
    }));
    const planilha = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, planilha, "Alunos");
    XLSX.writeFile(wb, "alunos.xlsx");
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  useEffect(() => {
    const servico = servicos.find((s) => s.nome === servicoSelecionado);
    if (servico) {
      setServicoValor(servico.valor);
      setServicoTempo(servico.tempo);
    }
  }, [servicoSelecionado, servicos]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🎓 Cadastro de Alunos</h2>
      <form onSubmit={adicionarAluno} className="grid grid-cols-1 gap-2 md:grid-cols-2 mb-4">
        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          placeholder="Data de nascimento"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Nome dos pais"
          value={nomePais}
          onChange={(e) => setNomePais(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          placeholder="Data da matrícula"
          value={dataMatricula}
          onChange={(e) => setDataMatricula(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={servicoSelecionado}
          onChange={(e) => setServicoSelecionado(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione um serviço</option>
          {servicos.map((servico) => (
            <option key={servico.id} value={servico.nome}>
              {servico.nome}
            </option>
          ))}
        </select>
        {servicoSelecionado && (
          <div className="col-span-1 md:col-span-2">
            <p>⏱ Tempo: {servicoTempo}</p>
            <p>💰 Valor: R$ {servicoValor}</p>
          </div>
        )}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded mt-2 col-span-1 md:col-span-2"
        >
          {editandoId ? "Salvar Alterações" : "Cadastrar Aluno"}
        </button>
      </form>

      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="🔎 Buscar aluno..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="border p-2 rounded w-full md:w-1/2"
        />
        <button
          onClick={exportarExcel}
          className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        >
          📁 Exportar Excel
        </button>
      </div>

      <p className="mb-2">Total de alunos: {alunosFiltrados.length}</p>

      <div className="space-y-2">
        {alunosFiltrados.map((aluno) => (
          <div key={aluno.id} className="border p-3 rounded flex justify-between items-start">
            <div>
              <p>
                <FaUserGraduate className="inline mr-1" />
                <strong>{aluno.nome}</strong> ({calcularIdade(aluno.data_nascimento)} anos)
              </p>
              <p>👨‍👩‍👧 Pais: {aluno.nome_pais}</p>
              <p>📅 Matrícula: {aluno.data_matricula}</p>
              <p>🎵 Serviço: {aluno.servico_nome} - {aluno.servico_tempo} - R$ {aluno.servico_valor}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => editarAluno(aluno)} className="text-blue-500">
                <FaEdit />
              </button>
              <button onClick={() => removerAluno(aluno.id)} className="text-red-500">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
