import React, { useState, useEffect } from "react";

const Progresso = () => {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [anotacoes, setAnotacoes] = useState({});
  const [novaAnotacao, setNovaAnotacao] = useState("");

  useEffect(() => {
    const alunosSalvos = JSON.parse(localStorage.getItem("alunos")) || [];
    setAlunos(alunosSalvos);
  }, []);

  const handleSalvarAnotacao = () => {
    if (!alunoSelecionado || !novaAnotacao.trim()) return;

    const nova = {
      texto: novaAnotacao,
      data: new Date().toLocaleDateString(),
    };

    const atualizadas = {
      ...anotacoes,
      [alunoSelecionado]: [...(anotacoes[alunoSelecionado] || []), nova],
    };

    setAnotacoes(atualizadas);
    setNovaAnotacao("");

    localStorage.setItem("anotacoes", JSON.stringify(atualizadas));
  };

  useEffect(() => {
    const salvas = JSON.parse(localStorage.getItem("anotacoes")) || {};
    setAnotacoes(salvas);
  }, []);

  const handleExportarWord = () => {
    const dados = anotacoes[alunoSelecionado] || [];
    let conteudo = `Anotações de ${alunoSelecionado}\n\n`;
    dados.forEach((item) => {
      conteudo += `${item.data} - ${item.texto}\n`;
    });

    const blob = new Blob([conteudo], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anotacoes-${alunoSelecionado}.doc`;
    a.click();
  };

  const handleCompartilhar = () => {
    const dados = anotacoes[alunoSelecionado] || [];
    let conteudo = `Anotações de ${alunoSelecionado}\n\n`;
    dados.forEach((item) => {
      conteudo += `${item.data} - ${item.texto}\n`;
    });

    if (navigator.share) {
      navigator
        .share({
          title: `Anotações de ${alunoSelecionado}`,
          text: conteudo,
        })
        .catch((error) => console.log("Erro ao compartilhar:", error));
    } else {
      alert("Compartilhamento não suportado neste navegador.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Progresso dos Alunos</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Selecione o aluno:</label>
        <select
          value={alunoSelecionado}
          onChange={(e) => setAlunoSelecionado(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Escolha um aluno --</option>
          {alunos.map((aluno, index) => (
            <option key={index} value={aluno.nome}>
              {aluno.nome}
            </option>
          ))}
        </select>
      </div>

      {alunoSelecionado && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 border">
          <h3 className="text-lg font-semibold mb-2">
            ✍️ Nova anotação para {alunoSelecionado}
          </h3>
          <textarea
            rows="4"
            className="w-full p-2 border rounded mb-2"
            value={novaAnotacao}
            onChange={(e) => setNovaAnotacao(e.target.value)}
            placeholder="Digite a anotação..."
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSalvarAnotacao}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Salvar
            </button>
            <button
              onClick={handleExportarWord}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Exportar Word
            </button>
            <button
              onClick={handleCompartilhar}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Compartilhar
            </button>
          </div>

          <hr className="my-4" />

          <h4 className="text-md font-semibold mb-2">📜 Histórico de Anotações:</h4>
          {anotacoes[alunoSelecionado]?.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {anotacoes[alunoSelecionado].map((item, index) => (
                <li
                  key={index}
                  className="border border-gray-300 rounded p-2 bg-gray-50"
                >
                  <strong>{item.data}:</strong> {item.texto}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Nenhuma anotação ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Progresso;
