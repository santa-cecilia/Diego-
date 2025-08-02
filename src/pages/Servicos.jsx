import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  carregarServicos,
  salvarServico,
  atualizarServico,
  excluirServico,
} from '../utils/supabase'; // Certifique-se que o caminho está correto

const Servicos = () => {
  const [servicos, setServicos] = useState([]);
  const [instrumento, setInstrumento] = useState('');
  const [tempo, setTempo] = useState('');
  const [valor, setValor] = useState('');
  const [busca, setBusca] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const instrumentos = ['Violão', 'Violino', 'Piano', 'Teclado', 'Canto'];

  // 🚀 Carrega dados da nuvem ao iniciar
  useEffect(() => {
    const fetchData = async () => {
      const dados = await carregarServicos();
      setServicos(dados);
    };
    fetchData();
  }, []);

  const limparCampos = () => {
    setInstrumento('');
    setTempo('');
    setValor('');
    setEditIndex(null);
  };

  const adicionarOuEditarServico = async () => {
    if (!instrumento || !tempo || !valor) return;
    const novoServico = { instrumento, tempo, valor };

    if (editIndex !== null) {
      // Atualizar
      const servicoAtual = servicos[editIndex];
      const atualizado = { ...servicoAtual, ...novoServico };
      const res = await atualizarServico(atualizado);
      if (res.success) {
        setServicos((prev) =>
          prev.map((s, i) => (i === editIndex ? atualizado : s))
        );
      }
    } else {
      // Salvar novo
      const res = await salvarServico(novoServico);
      if (res.success) {
        setServicos(res.data);
      }
    }

    limparCampos();
  };

  const removerServico = async (index) => {
    const confirmacao = window.confirm('Deseja remover este serviço?');
    if (confirmacao) {
      const id = servicos[index].id;
      const res = await excluirServico(id);
      if (res.success) {
        setServicos(servicos.filter((_, i) => i !== index));
      }
    }
  };

  const editarServico = (index) => {
    const servico = servicos[index];
    setInstrumento(servico.instrumento);
    setTempo(servico.tempo);
    setValor(servico.valor);
    setEditIndex(index);
  };

  const exportarExcel = () => {
    const planilha = XLSX.utils.json_to_sheet(servicos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, planilha, 'Serviços');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'servicos.xlsx');
  };

  const servicosFiltrados = servicos.filter((s) =>
    s.instrumento.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cadastro de Serviços</h2>

      <div className="grid grid-cols-1 gap-2 mb-4">
        <select
          value={instrumento}
          onChange={(e) => setInstrumento(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecione um instrumento</option>
          {instrumentos.map((inst) => (
            <option key={inst} value={inst}>{inst}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Tempo de aula (ex: 30min)"
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Valor (R$)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={adicionarOuEditarServico}
          className="bg-blue-500 text-white rounded px-4 py-2"
        >
          {editIndex !== null ? 'Salvar alterações' : 'Cadastrar Serviço'}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔎 Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="mb-2 font-semibold">
        Total de serviços cadastrados: {servicosFiltrados.length}
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Instrumento</th>
            <th className="border p-2">Tempo</th>
            <th className="border p-2">Valor</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {servicosFiltrados.map((servico, index) => (
            <tr key={servico.id || index}>
              <td className="border p-2">{servico.instrumento}</td>
              <td className="border p-2">{servico.tempo}</td>
              <td className="border p-2">R$ {parseFloat(servico.valor).toFixed(2)}</td>
              <td className="border p-2">
                <button
                  onClick={() => editarServico(index)}
                  className="text-blue-600 mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => removerServico(index)}
                  className="text-red-600"
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}

          {servicosFiltrados.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center p-4 text-gray-500">
                Nenhum serviço encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        onClick={exportarExcel}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Excel
      </button>
    </div>
  );
};

export default Servicos;
