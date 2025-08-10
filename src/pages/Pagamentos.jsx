import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "../utils/supabase";

export default function Pagamentos() {
  // Estado do mês selecionado, padrão mês atual YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  // Dados carregados do Supabase
  const [alunos, setAlunos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financeiros, setFinanceiros] = useState([]);

  // Estados para filtros e busca
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroNaoPagos, setFiltroNaoPagos] = useState(false);

  // Carregar dados de alunos, pagamentos e financeiros ao montar e quando selectedMonth mudar
  useEffect(() => {
    async function carregarDados() {
      const { data: alunosData, error: erroAlunos } = await supabase.from("alunos").select("*");
      const { data: pagamentosData, error: erroPagamentos } = await supabase.from("pagamentos").select("*");
      const { data: financeirosData, error: erroFinanceiros } = await supabase.from("financeiros").select("*");

      if (erroAlunos) alert("Erro ao carregar alunos: " + erroAlunos.message);
      if (erroPagamentos) alert("Erro ao carregar pagamentos: " + erroPagamentos.message);
      if (erroFinanceiros) alert("Erro ao carregar financeiros: " + erroFinanceiros.message);

      setAlunos(alunosData || []);
      setPayments(pagamentosData || []);
      setFinanceiros(financeirosData || []);
    }

    carregarDados();
  }, []);

  // Função para atualizar payment localmente
  function updatePayment(nomeAluno, month, newData) {
    setPayments((prev) => {
      const idx = prev.findIndex((p) => p.nomeAluno === nomeAluno && p.month === month);
      let atual;
      if (idx >= 0) {
        atual = { ...prev[idx], ...newData };
      } else {
        atual = {
          id: Date.now(), // gerado temporário
          nomeAluno,
          month,
          discountPercent: 0,
          paid: false,
          paymentDate: "",
          note: "",
          ...newData,
        };
      }

      if (idx >= 0) {
        return [...prev.slice(0, idx), atual, ...prev.slice(idx + 1)];
      } else {
        return [...prev, atual];
      }
    });
  }

  // Eventos para editar pagamento
  function handleDiscountChange(nomeAluno, value) {
    const desconto = Number(value);
    updatePayment(nomeAluno, selectedMonth, {
      discountPercent: isNaN(desconto) ? 0 : desconto,
    });
  }

  function handleTogglePaid(nomeAluno) {
    const pagamento = payments.find(p => p.nomeAluno === nomeAluno && p.month === selectedMonth);
    updatePayment(nomeAluno, selectedMonth, {
      paid: !(pagamento?.paid ?? false),
      paymentDate: !(pagamento?.paid ?? false) && !pagamento?.paymentDate ? new Date().toISOString().slice(0, 10) : pagamento?.paymentDate ?? "",
    });
  }

  function handlePaymentDateChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { paymentDate: value });
  }

  function handleNoteChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { note: value });
  }

  // Salvar alterações no Supabase (payments)
  async function salvarAlteracoes() {
    const toSave = payments
      .filter((p) => p.month === selectedMonth)
      .map((p) => {
        const aluno = alunos.find((a) => a.nome === p.nomeAluno);
        const valor = parseFloat(aluno?.servico?.replace("R$ ", "").replace(",", ".") || 0);
        const valorFinal = valor * (1 - (p.discountPercent || 0) / 100);

        return {
          ...p,
          valor,
          valor_final: valorFinal,
        };
      });

    if (toSave.length === 0) {
      alert("Nenhuma alteração para salvar neste mês.");
      return;
    }

    const { error } = await supabase
      .from("pagamentos")
      .upsert(toSave, { onConflict: ["nomeAluno", "month"] });

    if (error) {
      alert("Erro ao salvar alterações: " + error.message);
    } else {
      alert("Alterações salvas com sucesso!");
    }
  }

  // Função para adicionar receita ou despesa
  async function adicionarFinanceiro(tipo) {
    const valorInput = prompt(`Digite o valor da ${tipo.toLowerCase()}:`);
    if (!valorInput) return;
    const valor = parseFloat(valorInput.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      alert("Valor inválido.");
      return;
    }
    const descricao = prompt(`Digite a descrição da ${tipo.toLowerCase()}:`) || "";

    const novoRegistro = {
      id: Date.now(),
      tipo,
      valor,
      descricao,
      data: new Date().toISOString().slice(0, 10),
      mes: selectedMonth,
    };

    const { error } = await supabase.from("financeiros").upsert([novoRegistro]);
    if (error) {
      alert("Erro ao salvar receita/despesa: " + error.message);
      return;
    }

    setFinanceiros((prev) => [...prev, novoRegistro]);
  }

  // Editar lançamento financeiro
  async function editarFinanceiro(id) {
    const item = financeiros.find(f => f.id === id);
    if (!item) return;

    const novoValorInput = prompt("Novo valor:", item.valor);
    if (!novoValorInput) return;
    const novoValor = parseFloat(novoValorInput.replace(",", "."));
    if (isNaN(novoValor) || novoValor <= 0) {
      alert("Valor inválido.");
      return;
    }
    const novaDescricao = prompt("Nova descrição:", item.descricao) || "";

    const atualizado = { ...item, valor: novoValor, descricao: novaDescricao };

    const { error } = await supabase.from("financeiros").upsert([atualizado]);
    if (error) {
      alert("Erro ao salvar edição: " + error.message);
      return;
    }

    setFinanceiros((prev) => prev.map((f) => (f.id === id ? atualizado : f)));
  }

  // Excluir lançamento financeiro
  async function excluirFinanceiro(id) {
    if (!window.confirm("Deseja excluir este lançamento?")) return;

    const { error } = await supabase.from("financeiros").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir lançamento: " + error.message);
      return;
    }

    setFinanceiros((prev) => prev.filter((f) => f.id !== id));
  }

  // Preparar lista final para exibição e cálculo
  const listaFinal = alunos.map((aluno) => {
    const valor = parseFloat(aluno.servico?.replace("R$ ", "").replace(",", ".") || 0);
    const pagamento = payments.find((p) => p.nomeAluno === aluno.nome && p.month === selectedMonth);

    return {
      nome: aluno.nome,
      valor,
      discountPercent: pagamento?.discountPercent ?? 0,
      paid: pagamento?.paid ?? false,
      paymentDate: pagamento?.paymentDate ?? "",
      note: pagamento?.note ?? "",
    };
  });

  // Filtrar financeiros pelo mês selecionado
  const valoresMes = financeiros.filter(f => f.mes === selectedMonth);
  const totalReceitasExtras = valoresMes.filter(f => f.tipo === "Receita").reduce((sum, f) => sum + f.valor, 0);
  const totalDespesasExtras = valoresMes.filter(f => f.tipo === "Despesa").reduce((sum, f) => sum + f.valor, 0);

  // Resumo geral
  const resumo = listaFinal.reduce(
    (acc, aluno) => {
      const valorComDesconto = aluno.valor * (1 - aluno.discountPercent / 100);
      acc.valorTotal += aluno.valor;
      acc.descontoTotal += aluno.valor - valorComDesconto;
      if (aluno.paid) acc.recebidoTotal += valorComDesconto;
      return acc;
    },
    { valorTotal: 0, descontoTotal: 0, recebidoTotal: 0 }
  );

  resumo.recebidoTotal += totalReceitasExtras;
  resumo.recebidoTotal -= totalDespesasExtras;

  // Mostrar resumo financeiro detalhado em alerta
  function mostrarResumoFinanceiroDetalhado() {
    if (valoresMes.length === 0) {
      alert(`Nenhum lançamento financeiro para ${selectedMonth}.`);
      return;
    }
    const historico = valoresMes.map((f, i) => 
      `${i + 1}. [${f.tipo}] R$ ${f.valor.toFixed(2)} - ${f.descricao || "Sem descrição"} - ${f.data}`
    );
    alert(`Histórico Financeiro - ${selectedMonth}:\n\n${historico.join("\n")}`);
  }

function exportarExcel() {
  const dados = listaFinal.map((aluno) => {
    const descontoReais = aluno.valor * (aluno.discountPercent / 100);
    return {
      Aluno: aluno.nome,
      Valor: aluno.valor.toFixed(2),
      "Desconto %": `${aluno.discountPercent}%`,
      "Desconto (R$)": descontoReais.toFixed(2),
      "Valor Final (R$)": (aluno.valor - descontoReais).toFixed(2),
      Pago: aluno.paid ? "Sim" : "Não",
      "Data Pagamento": aluno.paymentDate,
      Observação: aluno.note,
    };
  });

  // 🔹 Calcular os totais
  const totalValor = dados.reduce((sum, item) => sum + parseFloat(item["Valor"]), 0);
  const totalDescontoReais = dados.reduce((sum, item) => sum + parseFloat(item["Desconto (R$)"]), 0);
  const totalValorFinal = dados.reduce((sum, item) => sum + parseFloat(item["Valor Final (R$)"]), 0);

  // 🔹 Adicionar linha de total no final
  dados.push({
    Aluno: "TOTAL",
    Valor: totalValor.toFixed(2),
    "Desconto %": "",
    "Desconto (R$)": totalDescontoReais.toFixed(2),
    "Valor Final (R$)": totalValorFinal.toFixed(2),
    Pago: "",
    "Data Pagamento": "",
    Observação: "",
  });

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `Pagamentos_${selectedMonth}.xlsx`);
}

  return (
    <div style={{ padding: 20 }}>
      <h2>Pagamentos</h2>
      <label>
        Selecione o mês:{" "}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ marginBottom: 20 }}
        />
      </label>

      <div style={{ marginBottom: 15 }}>
        <button onClick={() => adicionarFinanceiro("Receita")}>Incluir Receita</button>
        <button onClick={() => adicionarFinanceiro("Despesa")} style={{ marginLeft: 10 }}>
          Incluir Despesa
        </button>
        <button onClick={mostrarResumoFinanceiroDetalhado} style={{ marginLeft: 10 }}>
          Resumo Financeiro
        </button>
        <button onClick={exportarExcel} style={{ marginLeft: 10 }}>
          📥 Exportar Excel
        </button>
      </div>

      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="🔍 Buscar aluno..."
          value={buscaAluno}
          onChange={(e) => setBuscaAluno(e.target.value)}
          style={{
            padding: 8,
            width: "100%",
            maxWidth: 300,
            borderRadius: 5,
            border: "1px solid #ccc",
          }}
        />
        <label style={{ marginLeft: 20 }}>
          <input
            type="checkbox"
            checked={filtroNaoPagos}
            onChange={() => setFiltroNaoPagos(!filtroNaoPagos)}
          />{" "}
          Mostrar apenas não pagantes
        </label>
      </div>

      <table
        border="1"
        cellPadding="4"
        style={{ width: "100%", borderCollapse: "separate" }}
      >
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Valor</th>
            <th>Desconto %</th>
            <th>Valor Final</th>
            <th>Pago</th>
            <th>Data Pagamento</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {listaFinal
            .filter((item) =>
              item.nome.toLowerCase().includes(buscaAluno.toLowerCase())
            )
            .filter((item) => !filtroNaoPagos || !item.paid)
            .map((item) => {
              const valorFinal = item.valor * (1 - item.discountPercent / 100);
              return (
                <tr key={item.nome}>
                  <td>{item.nome}</td>
                  <td>R$ {item.valor.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      value={item.discountPercent}
                      min={0}
                      max={100}
                      onChange={(e) =>
                        handleDiscountChange(item.nome, e.target.value)
                      }
                      style={{ width: 60 }}
                    />
                  </td>
                  <td>R$ {valorFinal.toFixed(2)}</td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={item.paid}
                      onChange={() => handleTogglePaid(item.nome)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.paymentDate}
                      onChange={(e) =>
                        handlePaymentDateChange(item.nome, e.target.value)
                      }
                      disabled={!item.paid}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) =>
                        handleNoteChange(item.nome, e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <button
        onClick={salvarAlteracoes}
        style={{ marginTop: 20, padding: "10px 20px", fontSize: 16 }}
      >
        💾 Salvar alterações
      </button>

      <h3 style={{ marginTop: 40 }}>Receitas e Despesas - {selectedMonth}</h3>
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderCollapse: "separate" }}
      >
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Valor (R$)</th>
            <th>Descrição</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {valoresMes.map((f) => (
            <tr key={f.id}>
              <td>{f.tipo}</td>
              <td>{f.valor.toFixed(2)}</td>
              <td>{f.descricao}</td>
              <td>{f.data}</td>
              <td>
                <button onClick={() => editarFinanceiro(f.id)}>✏️ Editar</button>
                <button onClick={() => excluirFinanceiro(f.id)} style={{ marginLeft: 10 }}>
                  🗑️ Excluir
                </button>
              </td>
            </tr>
          ))}
          {valoresMes.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>
                Nenhum lançamento financeiro neste mês.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 20 }}>Resumo Geral</h3>
      <ul>
        <li>Total Valor Bruto: R$ {resumo.valorTotal.toFixed(2)}</li>
        <li>Total Descontos: R$ {resumo.descontoTotal.toFixed(2)}</li>
        <li>Total Recebido (inclui receitas/despesas extras): R$ {resumo.recebidoTotal.toFixed(2)}</li>
      </ul>
    </div>
  );
}
