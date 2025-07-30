import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // certifique-se de que esse arquivo está configurado
import './Pagamentos.css';

const Pagamentos = () => {
  const [dados, setDados] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);

  useEffect(() => {
    const alunosSalvos = JSON.parse(localStorage.getItem('alunos')) || [];
    setDados(alunosSalvos);
  }, []);

  useEffect(() => {
    if (mesSelecionado) {
      carregarPagamentosDoSupabase();
      carregarLancamentosFinanceiros();
    }
  }, [mesSelecionado]);

  const salvarPagamento = async (aluno) => {
    const payload = {
      nome_aluno: aluno.nome,
      mes: mesSelecionado,
      valor: Number(aluno.valor || 0),
      desconto: Number(aluno.desconto || 0),
      pago: aluno.pago,
      data_pagamento: aluno.dataPagamento || null,
      observacao: aluno.observacao || '',
    };

    const { data, error } = await supabase
      .from('pagamentos')
      .upsert([payload], { onConflict: ['nome_aluno', 'mes'] });

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
    }
  };

  const salvarLancamento = async (tipo, valor, descricao) => {
    const payload = {
      tipo,
      valor: Number(valor),
      descricao,
      data: new Date().toISOString().slice(0, 10),
      mes: mesSelecionado,
    };

    const { data, error } = await supabase.from('financeiros').insert([payload]);

    if (error) console.error('Erro ao salvar receita/despesa:', error);
    else {
      if (tipo === 'Receita') setReceitas([...receitas, payload]);
      else setDespesas([...despesas, payload]);
    }
  };

  const carregarPagamentosDoSupabase = async () => {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('mes', mesSelecionado);

    if (!error && data) {
      const atualizados = dados.map((aluno) => {
        const pagamento = data.find((p) => p.nome_aluno === aluno.nome);
        if (pagamento) {
          return {
            ...aluno,
            desconto: pagamento.desconto,
            pago: pagamento.pago,
            dataPagamento: pagamento.data_pagamento,
            observacao: pagamento.observacao,
          };
        }
        return aluno;
      });
      setDados(atualizados);
    }
  };

  const carregarLancamentosFinanceiros = async () => {
    const { data, error } = await supabase
      .from('financeiros')
      .select('*')
      .eq('mes', mesSelecionado);

    if (!error && data) {
      setReceitas(data.filter((l) => l.tipo === 'Receita'));
      setDespesas(data.filter((l) => l.tipo === 'Despesa'));
    }
  };

  const handlePagamentoChange = (index, campo, valor) => {
    const novos = [...dados];
    novos[index][campo] = valor;
    setDados(novos);
    salvarPagamento(novos[index]);
  };

  const totalRecebido = dados
    .filter((d) => d.pago)
    .reduce((acc, aluno) => acc + (aluno.valor || 0) * (1 - (aluno.desconto || 0) / 100), 0);

  const totalDescontos = dados
    .filter((d) => d.pago)
    .reduce((acc, aluno) => acc + ((aluno.valor || 0) * (aluno.desconto || 0)) / 100, 0);

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="pagamentos-container">
      <h2>Controle de Pagamentos</h2>

      <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
        <option value="">Selecione o mês</option>
        <option value="2025-07">Julho 2025</option>
        <option value="2025-08">Agosto 2025</option>
        {/* adicione mais meses conforme necessário */}
      </select>

      {mesSelecionado && (
        <>
          <div className="acoes-financeiras">
            <button onClick={() => salvarLancamento('Receita', 100, 'Outra receita')}>Incluir Receita</button>
            <button onClick={() => salvarLancamento('Despesa', 50, 'Material')}>Incluir Despesa</button>
          </div>

          <table className="tabela-pagamentos">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valor</th>
                <th>Desconto %</th>
                <th>Pago</th>
                <th>Data Pagamento</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((aluno, index) => (
                <tr key={index}>
                  <td>{aluno.nome}</td>
                  <td>{aluno.valor}</td>
                  <td>
                    <input
                      type="number"
                      value={aluno.desconto || 0}
                      onChange={(e) => handlePagamentoChange(index, 'desconto', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={aluno.pago || false}
                      onChange={(e) => handlePagamentoChange(index, 'pago', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={aluno.dataPagamento || ''}
                      onChange={(e) => handlePagamentoChange(index, 'dataPagamento', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={aluno.observacao || ''}
                      onChange={(e) => handlePagamentoChange(index, 'observacao', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="resumo-financeiro">
            <p>💰 Valor Recebido: R$ {totalRecebido.toFixed(2)}</p>
            <p>🎁 Valor Descontos: R$ {totalDescontos.toFixed(2)}</p>
            <p>📈 Outras Receitas: R$ {totalReceitas.toFixed(2)}</p>
            <p>📉 Despesas: R$ {totalDespesas.toFixed(2)}</p>
            <p><strong>📊 Total Geral: R$ {(totalRecebido + totalReceitas - totalDespesas).toFixed(2)}</strong></p>
          </div>
        </>
      )}
    </div>
  );
};

export default Pagamentos;
