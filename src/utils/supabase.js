import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrfbbqldfsluevicrssx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmJicWxkZnNsdWV2aWNyc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTE0NzYsImV4cCI6MjA2OTMyNzQ3Nn0.ecuMk7FbSzgTvMx66_TksV6MkEhNrRn86g0G1MnuIrk'; // Substitua pela sua chave correta
const supabase = createClient(supabaseUrl, supabaseKey);

// LOCALSTORAGE

const LOCAL_KEY = 'servicos_local';

export const saveLocal = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

export const loadLocal = () => {
  try {
    const data = localStorage.getItem(LOCAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return [];
  }
};

// SUPABASE

export const fetchServicos = async () => {
  const { data, error } = await supabase.from('servicos').select('*');
  if (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
    return [];
  }
  return data;
};

export const saveServico = async (novoServico) => {
  const { error } = await supabase.from('servicos').insert([novoServico]);
  if (error) {
    console.error('Erro ao salvar no Supabase:', error);
  }
};

export const updateServico = async (id, dadosAtualizados) => {
  const { error } = await supabase
    .from('servicos')
    .update(dadosAtualizados)
    .eq('id', id);
  if (error) {
    console.error('Erro ao atualizar no Supabase:', error);
  }
};

export const deleteServico = async (id) => {
  const { error } = await supabase.from('servicos').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir do Supabase:', error);
  }
};

// USO CONJUNTO (gravar local + nuvem)

export const saveAll = async (dados) => {
  saveLocal(dados);
  for (const item of dados) {
    await saveServico(item);
  }
};
