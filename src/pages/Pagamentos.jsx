import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Pagamentos() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });
  const [alunos, setAlunos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financeiros, setFinanceiros] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroNaoPagos, setFiltroNaoPagos] = useState(false);

  useEffect(() => {
    const alunosSalvos = JSON.parse(localStorage.getItem("alunos")) || [];
    const servicosSalvos = JSON.parse(localStorage.getItem("servicos")) || [];
    const pagamentosSalvos = JSON.parse(localStorage.getItem("pagamentos")) || [];
    const financeirosSalvos = JSON.parse(localStorage.getItem("financeiros")) || [];

    setAlunos(alunosSalvos);
    setServicos(servicosSalvos);
    setPayments(pagamentosSalvos);
    setFinanceiros(financeirosSalvos);
  }, []);

  function updatePayment(nomeAluno, month, newData) {
    setPayments((prev) => {
      const idx = prev.findIndex(
        (p) => p.nomeAluno === nomeAluno && p.month === month
      );
      let updated;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newData };
        updated = copy;
      } else {
        updated = [...prev, { nomeAluno, month, ...newData }];
      }
      localStorage.setItem("pagamentos", JSON.stringify(updated));
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
    const pagamento = payments.find(
      (p) => p.nomeAluno === nomeAluno && p.month === selectedMonth
    );
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
    setFinanceiros((prev) => {
      const atualizados = [...prev, novoRegistro];
      localStorage.setItem("financeiros", JSON.stringify(atualizados));
      return atualizados;
    });
  }

  function editarFinanceiro(id) {
    const item = financeiros.find(f => f.id === id);
    if (!item) return;

    const novoValor = prompt("Novo valor:", item.valor);
    const novaDescricao = prompt("Nova descrição:", item.descricao);
    if (!novoValor) return;
    const numero = parseFloat(novoValor.replace(",", "."));
    if (isNaN(numero) || numero <= 0) return;

    setFinanceiros((prev) => {
      const atualizados = prev.map((f) =>
        f.id === id
          ? { ...f, valor: numero, descricao: novaDescricao || "" }
          : f
      );
      localStorage.setItem("financeiros", JSON.stringify(atualizados));
      return atualizados;
    });
  }

  function excluirFinanceiro(id) {
    if (!window.confirm("Deseja excluir este lançamento?")) return;
    setFinanceiros((prev) => {
      const atualizados = prev.filter((f) => f.id !== id);
      localStorage.setItem("financeiros", JSON.stringify(atualizados));
      return atualizados;
    });
  }

  const listaFinal = alunos.map((aluno) => {
    const valorFormatado = aluno.servico?.replace("R$ ", "").replace(",", ".") ?? "0";
    const valor = parseFloat(valorFormatado) || 0;
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
      <label>
        Selecione o mês:{" "}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </label>

      {selectedMonth && (
        <>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
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

          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="🔍 Buscar aluno..."
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              style={{ padding: "8px", width: "100%", maxWidth: "300px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <label style={{ marginLeft: 20 }}>
              <input
                type="checkbox"
                checked={filtroNaoPagos}
                onChange={() => setFiltroNaoPagos(!filtroNaoPagos)}
              /> Mostrar apenas não pagantes
            </label>
          </div>

          <div style={{ marginBottom: "20px", background: "#f5f5f5", padding: "10px", borderRadius: "5px" }}>
            <strong>Resumo Financeiro - {selectedMonth}</strong><br />
            Base💲:<strong> R$ {resumo.valorTotal.toFixed(2)}</strong> &nbsp;&nbsp;<br />
            EMSC:<strong> R$ {resumo.descontoTotal.toFixed(2)}</strong> &nbsp;&nbsp;<br />
            VALOR RECEBIDO:<strong> R$ {resumo.recebidoTotal.toFixed(2)}</strong><br />
            ✔️:<strong> R$ {totalReceitasExtras.toFixed(2)}</strong> &nbsp;&nbsp;
            🔻:<strong> R$ {totalDespesasExtras.toFixed(2)}</strong>
          </div>

          <table border="1" cellPadding="4" style={{ width: "100%", borderCollapse: "separate" }}>
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
                .map((item) => (
                  <tr key={item.nome}>
                    <td>{item.nome}</td>
                    <td>R$ {item.valor.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        value={item.discountPercent}
                        min="0"
                        max="100"
                        onChange={(e) => handleDiscountChange(item.nome, e.target.value)}
                        style={{ width: "40px" }}
                      />
                    </td>
                    <td>R$ {(item.valor * (1 - item.discountPercent / 100)).toFixed(2)}</td>
                    <td>
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
                        onChange={(e) => handlePaymentDateChange(item.nome, e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleNoteChange(item.nome, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {valoresMes.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3>Lançamentos - {selectedMonth}</h3>
              <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "separate" }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Descrição</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {valoresMes.map((f) => (
                    <tr key={f.id}>
                      <td>{f.tipo}</td>
                      <td>R$ {f.valor.toFixed(2)}</td>
                      <td>{f.descricao || "-"}</td>
                      <td>{f.data}</td>
                      <td>
                        <button onClick={() => editarFinanceiro(f.id)}>✏️</button>
                        <button onClick={() => excluirFinanceiro(f.id)} style={{ marginLeft: 5 }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
