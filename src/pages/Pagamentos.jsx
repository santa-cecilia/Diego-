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

  // Carrega dados na inicialização
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

  // Atualiza pagamento e salva no Supabase
  async function updatePayment(nomeAluno, month, newData) {
    setPayments((prev) => {
      const idx = prev.findIndex((p) => p.nomeAluno === nomeAluno && p.month === month);
      const atual = idx >= 0
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

      supabase
        .from("pagamentos")
        .upsert([atual], { onConflict: ["nomeAluno", "month"] })
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar pagamento:", error);
        });

      return updated;
    });
  }

  // Funções de manipulação dos pagamentos
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

  // Funções financeiro
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

    setFinanceiros((prev) => [...prev, novoRegistro]);

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

  // Salvar tudo manualmente
  async function salvarTudo() {
    try {
      if (payments.length > 0) {
        await supabase.from("pagamentos").upsert(payments, { onConflict: ["nomeAluno", "month"] });
      }
      if (financeiros.length > 0) {
        await supabase.from("financeiros").upsert(financeiros, { onConflict: ["id"] });
      }
      alert("✅ Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar tudo:", error);
      alert("Erro ao salvar os dados.");
    }
  }

  // Dados processados para renderizar e resumo
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

  // Exportar para Excel
  function exportarExcel() {
    const dados = listaFinal.map((aluno) => {
      const descontoReais = aluno.valor * (aluno.discountPercent / 100);
      return {
        Aluno: aluno.nome,
        Valor: aluno.valor.toFixed(2),
        DescontoPercentual: `${aluno.discountPercent}%`,
        DescontoReais: descontoReais.toFixed(2),
        ValorFinal: (aluno.valor - descontoReais).toFixed(2),
        Pago: aluno.paid ? "Sim" : "Não",
        DataPagamento: aluno.paymentDate ? aluno.paymentDate.split("-").reverse().join("/") : "",
        Observação: aluno.note,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Pagamentos_${selectedMonth}.xlsx`);
  }

  // Renderização
  return (
    <
