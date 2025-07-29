import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // ajuste o caminho se necessário

const instrumentos = ["Violão", "Violino", "Piano", "Teclado", "Canto"];

const Servicos = () => {
  const [servicos, setServicos] = useState([]);
  const [novoServico, setNovoServico] = useState({
    instrumento: "",
    tempo: "",
    valor: ""
  });
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [servicoEditado, setServicoEditado] = useState(null);

  useEffect(() => {
    const carregarServicos = async () => {
      const local = localStorage.getItem("servicos");
      if (local) {
        setServicos(JSON.parse(local));
      } else {
        const { data, error } = await supabase.from("servicos").select("*");
        if (data && !error) {
          setServicos(data);
          localStorage.setItem("servicos", JSON.stringify(data));
        }
      }
    };
    carregarServicos();
  }, []);

  const salvarServicos = (dados) => {
    setServicos(dados);
    localStorage.setItem("servicos", JSON.stringify(dados));
  };

  const adicionarServico = (e) => {
    e.preventDefault();
    if (!novoServico.instrumento || !novoServico.tempo || !novoServico.valor) return;

    const atualizados = [...servicos, novoServico];
    salvarServicos(atualizados);
    setNovoServico({ instrumento: "", tempo: "", valor: "" });
  };

  const iniciarEdicao = (index) => {
    setEditandoIndex(index);
    setServicoEditado({ ...servicos[index] });
  };

  const salvarEdicao = () => {
    const atualizados = [...servicos];
    atualizados[editandoIndex] = servicoEditado;
    salvarServicos(atualizados);
    setEditandoIndex(null);
    setServicoEditado(null);
  };

  const cancelarEdicao = () => {
    setEditandoIndex(null);
    setServicoEditado(null);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Cadastrar Serviços</h2>

      <form onSubmit={adicionarServico} className="space-y-2">
        <select
          className="w-full p-2 border rounded"
          value={novoServico.instrumento}
          onChange={(e) =>
            setNovoServico({ ...novoServico, instrumento: e.target.value })
          }
          required
        >
          <option value="">Selecione o curso</option>
          {instrumentos.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Tempo (ex: 1h semanal)"
          value={novoServico.tempo}
          onChange={(e) =>
            setNovoServico({ ...novoServico, tempo: e.target.value })
          }
          required
        />

        <input
          type="number"
          className="w-full p-2 border rounded"
          placeholder="Valor (R$)"
          value={novoServico.valor}
          onChange={(e) =>
            setNovoServico({ ...novoServico, valor: e.target.value })
          }
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Adicionar Serviço
        </button>
      </form>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Serviços Cadastrados:</h3>
        <ul className="space-y-2">
          {servicos.map((s, i) => (
            <li key={i} className="border p-2 rounded text-sm flex flex-col gap-2">
              {editandoIndex === i ? (
                <>
                  <select
                    className="w-full p-1 border rounded"
                    value={servicoEditado.instrumento}
                    onChange={(e) =>
                      setServicoEditado({
                        ...servicoEditado,
                        instrumento: e.target.value
                      })
                    }
                  >
                    <option value="">Selecione o curso</option>
                    {instrumentos.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={servicoEditado.tempo}
                    onChange={(e) =>
                      setServicoEditado({
                        ...servicoEditado,
                        tempo: e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={servicoEditado.valor}
                    onChange={(e) =>
                      setServicoEditado({
                        ...servicoEditado,
                        valor: e.target.value
                      })
                    }
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={salvarEdicao}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={cancelarEdicao}
                      className="bg-gray-400 text-white px-2 py-1 rounded text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>
                    <strong>{s.instrumento}</strong> - {s.tempo} - R$ {s.valor}
                  </span>
                  <button
                    onClick={() => iniciarEdicao(i)}
                    className="text-blue-600 text-xs underline w-fit"
                  >
                    ✏️ Editar
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Servicos;
