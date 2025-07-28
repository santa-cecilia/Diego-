import React, { useEffect, useState } from 'react';

const horasDisponiveis = Array.from({ length: 33 }, (_, i) => {
  const hora = String(6 + Math.floor(i / 2)).padStart(2, '0');
  const minuto = i % 2 === 0 ? '00' : '30';
  return `${hora}:${minuto}`;
});

const formatarData = (data) => {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
};

const AgendaAnual = () => {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [eventos, setEventos] = useState({});
  const hoje = new Date();

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('agendaMensal');
    if (dadosSalvos) setEventos(JSON.parse(dadosSalvos));
  }, []);

  const handleChange = (dia, campo, valor, slot = 0) => {
    const key = `${ano}-${mes}-${dia}`;
    setEventos(prev => {
      const atualizado = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [campo + slot]: valor
        }
      };
      localStorage.setItem("agendaMensal", JSON.stringify(atualizado));
      return atualizado;
    });
  };

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const eventosFuturos = Object.entries(eventos)
    .filter(([data]) => {
      const [a, m, d] = data.split('-').map(Number);
      const dataEvento = new Date(a, m, d);
      return dataEvento >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    })
    .sort(([a], [b]) => new Date(...a.split('-')) - new Date(...b.split('-')));

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Agenda Mensal</h2>

      <div className="flex flex-wrap gap-4 items-center">
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="border p-2 rounded">
          {[2025, 2026, 2027, 2028].map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="border p-2 rounded">
          {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Histórico de Eventos</h3>
        <ul className="text-xs font-arial space-y-1 border p-2 rounded bg-white shadow max-h-64 overflow-y-auto">
          {eventosFuturos.length === 0 ? (
            <li className="text-gray-500">Nenhum evento futuro registrado.</li>
          ) : (
            eventosFuturos.map(([data, info], idx) => (
              <li key={idx} className="border-b py-1">
                <strong>{formatarData(new Date(...data.split('-')))}:</strong>{" "}
                {[0, 1, 2].map(i => (
                  info[`hora${i}`] || info[`assunto${i}`]
                    ? `${info[`hora${i}`] || ''} - ${info[`assunto${i}`] || ''}; `
                    : null
                ))}
              </li>
            ))
          )}
        </ul>
      </div>

      <table className="w-full text-sm border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Dia</th>
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                <th className="border px-2 py-1">Hora {i + 1}</th>
                <th className="border px-2 py-1">Assunto {i + 1}</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: diasNoMes }, (_, i) => {
            const dia = i + 1;
            const key = `${ano}-${mes}-${dia}`;
            const evento = eventos[key] || {};

            return (
              <tr key={i} className="border-t">
                <td className="border px-2 py-1 text-center">{dia}</td>
                {[0, 1, 2].map(slot => (
                  <React.Fragment key={slot}>
                    <td className="border px-1 py-1">
                      <select
                        className="w-full border rounded p-1"
                        value={evento[`hora${slot}`] || ''}
                        onChange={(e) => handleChange(dia, 'hora', e.target.value, slot)}
                      >
                        <option value="">--</option>
                        {horasDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        className="w-full border rounded p-1"
                        value={evento[`assunto${slot}`] || ''}
                        onChange={(e) => handleChange(dia, 'assunto', e.target.value, slot)}
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AgendaAnual;
