import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "../utils/supabase";

export default function Pagamentos() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });
  const [alunos, setAlunos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financeiros, setFinanceiros] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroNaoPagos, setFiltroNaoPagos] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      const { data: alunosData } = await supabase.from("alunos").select("*");
      const { data: pagamentosData } = await supabase.from("pagamentos").select("*");
      const { data: financeirosData } = await supabase.from("financeiros").select("*");

      setAlunos(alunosData || []);
      setPayments(pagamentosData || []);
      setFinanceiros(financeirosData || []);
    }

    carregarDados();
  }, []);

  function updatePayment(nomeAluno, month, newData) {
    setPayments((prev) => {
      const idx = prev.findIndex(p => p.nomeAluno === nomeAluno && p.month === month);
      let atual;
      if (idx >= 0) {
        atual = { ...prev[idx], ...newData };
      } else {
        atual = {
          nomeAluno,
          month,
          discountPercent: 0,
          paid: false,
          paymentDate: "",
          note: "",
          ...newData,
        };
      }

      const updated = idx >= 0
        ? [...prev.slice(0, idx), atual, ...prev.slice(idx + 1)]
        : [...prev, atual];

      supabase.from("pagamentos").upsert([atual], { onConflict: ["nomeAluno", "month"] });

      return updated;
    });
  }

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
      paymentDate:
        !(pagamento?.paid ?? false) && !pagamento?.paymentDate
          ? new Date().toISOString().slice(0, 10)
          : pagamento?.paymentDate ?? "",
    });
  }

  function handlePaymentDateChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { paymentDate: value });
  }

  function handleNoteChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { note: value });
  }

  function adicionarFinanceiro(tipo) {
    const valor = prompt(`Digite o valor da ${tipo.toLowerCase()}:`);
    if (!valor) return;
    const numero = parseFloat(valor.replace(",", "."));
    if (isNaN(numero) || numero <= 0) {
      alert("Valor inválido.");
      return;
    }
    const descricao = prompt(`Digite a descrição da ${tipo.toLowerCase()}:`) || "";
    const novoRegistro = {
      id: Date.now(),
      tipo,
      valor: numero,
      descricao,
      data: new Date().toISOString().slice(0, 10),
      mes: selectedMonth,
    };
    const atualizados = [...financeiros, novoRegistro];
    setFinanceiros(atualizados);
    supabase.from("financeiros").upsert(atualizados, { onConflict: ["id"] });
  }

  function editarFinanceiro(id) {
    const item = financeiros.find(f => f.id === id);
    if (!item) return;

    const novoValor = prompt("Novo valor:", item.valor);
    const novaDescricao = prompt("Nova descrição:", item.descricao);
    if (!novoValor) return;
    const numero = parseFloat(novoValor.replace(",", "."));
    if (isNaN(numero) || numero <= 0) return;

    const atualizados = financeiros.map((f) =>
      f.id === id
        ? { ...f, valor: numero, descricao: novaDescricao || "" }
        : f
    );
    setFinanceiros(atualizados);
    supabase.from("financeiros").upsert(atualizados, { onConflict: ["id"] });
  }

  function excluirFinanceiro(id) {
    if (!window.confirm("Deseja excluir este lançamento?")) return;
    const atualizados = financeiros.filter((f) => f.id !== id);
    setFinanceiros(atualizados);
    supabase.from("financeiros").delete().eq("id", id);
  }

  // Função de salvar tudo
  async function salvarTudo() {
    if (payments.length > 0) {
      await supabase.from("pagamentos").upsert(payments, { onConflict: ["nomeAluno", "month"] });
    }
    if (financeiros.length > 0) {
      await supabase.from("financeiros").upsert(financeiros, { onConflict: ["id"] });
    }
    alert("✅ Dados salvos com sucesso!");
  }

  const listaFinal = alunos.map((aluno) => {
    const valor = parseFloat(aluno.servico?.replace("R$ ", "").replace(",", ".") || 0);
    const pagamento = payments.find(
      (p) => p.nomeAluno === aluno.nome && p.month === selectedMonth
    );

    return {
      nome: aluno.nome,
      valor,
      discountPercent: pagamento?.discountPercent ?? 0,
      paid: pagamento?.paid ?? false,
      paymentDate: pagamento?.paymentDate ?? "",
      note: pagamento?.note ?? "",
    };
  });

  const valoresMes = financeiros.filter(f => f.mes === selectedMonth);
  const totalReceitasExtras = valoresMes.filter(f => f.tipo === "Receita").reduce((sum, f) => sum + f.valor, 0);
  const totalDespesasExtras = valoresMes.filter(f => f.tipo === "Despesa").reduce((sum, f) => sum + f.valor, 0);

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

  function mostrarResumoFinanceiroDetalhado() {
    const historico = valoresMes.map((f, i) => `${i + 1}. [${f.tipo}] R$ ${f.valor.toFixed(2)} - ${f.descricao || "Sem descrição"} - ${f.data}`);
    alert(`Histórico Financeiro - ${selectedMonth}:\n\n${historico.join("\n") || "Nenhum lançamento."}`);
  }

  function exportarExcel() {
    const dados = listaFinal.map((aluno) => {
      const descontoReais = aluno.valor * (aluno.discountPercent / 100);
      return {
        Aluno: aluno.nome,
        Valor: aluno.valor,
        DescontoPercentual: `${aluno.discountPercent}%`,
        DescontoReais: descontoReais.toFixed(2),
        ValorFinal: (aluno.valor - descontoReais).toFixed(2),
        Pago: aluno.paid ? "Sim" : "Não",
        DataPagamento: aluno.paymentDate,
        Observação: aluno.note,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Pagamentos_${selectedMonth}.xlsx`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Pagamentos</h2>
      {/* Botão de salvar */}
      <button onClick={salvarTudo} style={{ marginBottom: 10, background: "#4CAF50", color: "#fff", padding: "8px 12px", borderRadius: "5px", border: "none" }}>
        💾 Salvar Alterações
      </button>
      <br />
      <label>
        Selecione o mês:{" "}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </label>
      
      {/* ... resto do código idêntico */}
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "../utils/supabase";

export default function Pagamentos() {
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );
  const [alunos, setAlunos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financeiros, setFinanceiros] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroNaoPagos, setFiltroNaoPagos] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [{ data: alunosData }, { data: pagamentosData }, { data: financeirosData }] =
          await Promise.all([
            supabase.from("alunos").select("*"),
            supabase.from("pagamentos").select("*"),
            supabase.from("financeiros").select("*"),
          ]);

        setAlunos(alunosData || []);
        setPayments(pagamentosData || []);
        setFinanceiros(financeirosData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    carregarDados();
  }, []);

  async function updatePayment(nomeAluno, month, newData) {
    setPayments((prev) => {
      const idx = prev.findIndex((p) => p.nomeAluno === nomeAluno && p.month === month);
      let atual = idx >= 0
        ? { ...prev[idx], ...newData }
        : {
            nomeAluno,
            month,
            discountPercent: 0,
            paid: false,
            paymentDate: "",
            note: "",
            ...newData,
          };

      const updated = idx >= 0
        ? [...prev.slice(0, idx), atual, ...prev.slice(idx + 1)]
        : [...prev, atual];

      // Atualiza Supabase
      supabase.from("pagamentos").upsert([atual], { onConflict: ["nomeAluno", "month"] })
        .then(({ error }) => error && console.error("Erro ao salvar pagamento:", error));

      return updated;
    });
  }

  function handleDiscountChange(nomeAluno, value) {
    const desconto = Number(value);
    updatePayment(nomeAluno, selectedMonth, {
      discountPercent: isNaN(desconto) ? 0 : desconto,
    });
  }

  function handleTogglePaid(nomeAluno) {
    const pagamento = payments.find((p) => p.nomeAluno === nomeAluno && p.month === selectedMonth);
    updatePayment(nomeAluno, selectedMonth, {
      paid: !(pagamento?.paid ?? false),
      paymentDate:
        !(pagamento?.paid ?? false) && !pagamento?.paymentDate
          ? new Date().toISOString().slice(0, 10)
          : pagamento?.paymentDate ?? "",
    });
  }

  function handlePaymentDateChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { paymentDate: value });
  }

  function handleNoteChange(nomeAluno, value) {
    updatePayment(nomeAluno, selectedMonth, { note: value });
  }

  // ---------- FUNÇÕES FINANCEIRO ----------
  async function adicionarFinanceiro(tipo) {
    const valor = prompt(`Digite o valor da ${tipo.toLowerCase()}:`);
    if (!valor) return;
    const numero = parseFloat(valor.replace(",", "."));
    if (isNaN(numero) || numero <= 0) return alert("Valor inválido.");

    const descricao = prompt(`Digite a descrição da ${tipo.toLowerCase()}:`) || "";
    const novoRegistro = {
      id: Date.now(),
      tipo,
      valor: numero,
      descricao,
      data: new Date().toISOString().slice(0, 10),
      mes: selectedMonth,
    };

    const atualizados = [...financeiros, novoRegistro];
    setFinanceiros(atualizados);

    const { error } = await supabase.from("financeiros").upsert([novoRegistro]);
    if (error) console.error("Erro ao salvar financeiro:", error);
  }

  async function editarFinanceiro(id) {
    const item = financeiros.find((f) => f.id === id);
    if (!item) return;

    const novoValor = prompt("Novo valor:", item.valor);
    if (!novoValor) return;
    const numero = parseFloat(novoValor.replace(",", "."));
    if (isNaN(numero) || numero <= 0) return;

    const novaDescricao = prompt("Nova descrição:", item.descricao) || "";

    const atualizados = financeiros.map((f) =>
      f.id === id ? { ...f, valor: numero, descricao: novaDescricao } : f
    );
    setFinanceiros(atualizados);

    const { error } = await supabase.from("financeiros").upsert(atualizados);
    if (error) console.error("Erro ao editar financeiro:", error);
  }

  async function excluirFinanceiro(id) {
    if (!window.confirm("Deseja excluir este lançamento?")) return;
    const atualizados = financeiros.filter((f) => f.id !== id);
    setFinanceiros(atualizados);

    const { error } = await supabase.from("financeiros").delete().eq("id", id);
    if (error) console.error("Erro ao excluir financeiro:", error);
  }

  // ---------- RESUMOS E EXPORTAÇÃO ----------
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

  const valoresMes = financeiros.filter((f) => f.mes === selectedMonth);
  const totalReceitasExtras = valoresMes.filter((f) => f.tipo === "Receita").reduce((sum, f) => sum + f.valor, 0);
  const totalDespesasExtras = valoresMes.filter((f) => f.tipo === "Despesa").reduce((sum, f) => sum + f.valor, 0);

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

  resumo.recebidoTotal += totalReceitasExtras - totalDespesasExtras;

  function mostrarResumoFinanceiroDetalhado() {
    const historico = valoresMes.map(
      (f, i) => `${i + 1}. [${f.tipo}] R$ ${f.valor.toFixed(2)} - ${f.descricao || "Sem descrição"} - ${f.data}`
    );
    alert(`Histórico Financeiro - ${selectedMonth}:\n\n${historico.join("\n") || "Nenhum lançamento."}`);
  }

  function exportarExcel() {
    const dados = listaFinal.map((aluno) => {
      const descontoReais = aluno.valor * (aluno.discountPercent / 100);
      return {
        Aluno: aluno.nome,
        Valor: aluno.valor,
        DescontoPercentual: `${aluno.discountPercent}%`,
        DescontoReais: descontoReais.toFixed(2),
        ValorFinal: (aluno.valor - descontoReais).toFixed(2),
        Pago: aluno.paid ? "Sim" : "Não",
        DataPagamento: aluno.paymentDate.split("-").reverse().join("/"),
        Observação: aluno.note,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Pagamentos_${selectedMonth}.xlsx`);
  }

  // ---------- RENDERIZAÇÃO ----------
  return (
    <div style={{ padding: "20px" }}>
      {/* Mantive a renderização igual ao seu código original */}
      {/* ... mesma estrutura de JSX */}
    </div>
  );
}
return (
  <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
    <h2>Gestão de Pagamentos</h2>

    {/* FILTROS */}
    <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{ padding: 6 }}
      />
      <input
        type="text"
        placeholder="Buscar aluno..."
        value={buscaAluno}
        onChange={(e) => setBuscaAluno(e.target.value)}
        style={{ padding: 6 }}
      />
      <label>
        <input
          type="checkbox"
          checked={filtroNaoPagos}
          onChange={(e) => setFiltroNaoPagos(e.target.checked)}
          style={{ marginRight: 4 }}
        />
        Mostrar apenas não pagos
      </label>
      <button onClick={exportarExcel} style={{ padding: "6px 12px" }}>
        📤 Exportar Excel
      </button>
      <button onClick={mostrarResumoFinanceiroDetalhado} style={{ padding: "6px 12px" }}>
        📊 Resumo Financeiro
      </button>
    </div>

    {/* TABELA DE PAGAMENTOS */}
    <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead style={{ background: "#f0f0f0" }}>
        <tr>
          <th>Aluno</th>
          <th>Valor</th>
          <th>Desconto (%)</th>
          <th>Valor Final</th>
          <th>Pago</th>
          <th>Data Pagamento</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        {listaFinal
          .filter((aluno) => aluno.nome.toLowerCase().includes(buscaAluno.toLowerCase()))
          .filter((aluno) => (filtroNaoPagos ? !aluno.paid : true))
          .map((aluno) => {
            const valorFinal = aluno.valor * (1 - aluno.discountPercent / 100);
            return (
              <tr key={aluno.nome} style={{ background: aluno.paid ? "#e7ffe7" : "#ffe7e7" }}>
                <td>{aluno.nome}</td>
                <td>R$ {aluno.valor.toFixed(2)}</td>
                <td>
                  <input
                    type="number"
                    value={aluno.discountPercent}
                    onChange={(e) => handleDiscountChange(aluno.nome, e.target.value)}
                    style={{ width: 60 }}
                  />
                </td>
                <td>R$ {valorFinal.toFixed(2)}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={aluno.paid}
                    onChange={() => handleTogglePaid(aluno.nome)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={aluno.paymentDate}
                    onChange={(e) => handlePaymentDateChange(aluno.nome, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={aluno.note}
                    onChange={(e) => handleNoteChange(aluno.nome, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>

    {/* RESUMO */}
    <div style={{ marginTop: 20 }}>
      <h3>Resumo do Mês</h3>
      <p>💰 Valor Total: R$ {resumo.valorTotal.toFixed(2)}</p>
      <p>🔻 Descontos: R$ {resumo.descontoTotal.toFixed(2)}</p>
      <p>✅ Recebido: R$ {resumo.recebidoTotal.toFixed(2)}</p>
    </div>

    {/* CONTROLES FINANCEIRO */}
    <div style={{ marginTop: 20 }}>
      <h3>Lançamentos Extras</h3>
      <button onClick={() => adicionarFinanceiro("Receita")} style={{ marginRight: 10 }}>
        ➕ Adicionar Receita
      </button>
      <button onClick={() => adicionarFinanceiro("Despesa")}>➖ Adicionar Despesa</button>

      <ul style={{ marginTop: 10 }}>
        {financeiros
          .filter((f) => f.mes === selectedMonth)
          .map((f) => (
            <li key={f.id}>
              [{f.tipo}] R$ {f.valor.toFixed(2)} - {f.descricao || "Sem descrição"} ({f.data})
              <button onClick={() => editarFinanceiro(f.id)} style={{ marginLeft: 8 }}>✏️</button>
              <button onClick={() => excluirFinanceiro(f.id)} style={{ marginLeft: 4 }}>🗑️</button>
            </li>
          ))}
      </ul>
    </div>
  </div>
);
