import React, { useEffect, useState } from 'react';
import './Agenda.css'; // <- Importa o CSS manual que vamos criar

const Agenda = () => {
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const [agenda, setAgenda] = useState({});

  useEffect(() => {
    const alunosSalvos = JSON.parse(localStorage.getItem('alunos')) || [];
    const novaAgenda = {};

    alunosSalvos.forEach((aluno) => {
      const dia = aluno.diaSemana;
      const horario = aluno.horario;

      if (!dia || !horario) return;

      if (!novaAgenda[horario]) novaAgenda[horario] = {};
      if (!novaAgenda[horario][dia]) novaAgenda[horario][dia] = [];

      const primeiroNome = aluno.nome?.split(' ')[0] || '';
      novaAgenda[horario][dia].push(primeiroNome);
    });

    setAgenda(novaAgenda);
  }, []);

  const horariosUnicos = Object.keys(agenda).sort((a, b) => a.localeCompare(b));

  return (
    <div className="agenda-container">
      <h2 className="agenda-title">AGENDA SEMANAL</h2>
      <div className="agenda-scroll">
        <table className="agenda-table">
          <thead>
            <tr>
              <th>Horário</th>
              {diasSemana.map((dia) => (
                <th key={dia}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horariosUnicos.map((horario) => (
              <tr key={horario}>
                <td>{horario}</td>
                {diasSemana.map((dia) => (
                  <td key={dia}>
                    {agenda[horario][dia]?.join(', ') || ''}
                  </td>
                ))}
              </tr>
            ))}
            {horariosUnicos.length === 0 && (
              <tr>
                <td colSpan={8}>Nenhum aluno cadastrado com dia e horário.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Agenda;
