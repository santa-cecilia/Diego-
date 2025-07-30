import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hrfbbqldfsluevicrssx.supabase.co";
const supabaseKey "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmJicWxkZnNsdWV2aWNyc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTE0NzYsImV4cCI6MjA2OTMyNzQ3Nn0.ecuMk7FbSzgTvMx66_TksV6MkEhNrRn86g0G1MnuIrk"; // Substitua com sua chave real
export const supabase = createClient(supabaseUrl, supabaseKey);

// Funções locais + nuvem
const table = "servicos";

export const salvarServico = async (servico) => {
  try {
    const { data, error } = await supabase.from(table).insert([servico]);
    if (error) throw error;

    const local = carregarServicosLocal();
    const atualizados = [...local, ...data];
    salvarServicosLocal(atualizados);
    return { success: true, data: atualizados };
  } catch (err) {
    console.error("Erro ao salvar no Supabase:", err);
    return { success: false };
  }
};

export const carregarServicos = async () => {
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    salvarServicosLocal(data);
    return data;
  } catch (err) {
    console.warn("Carregando do localStorage por falha no Supabase.");
    return carregarServicosLocal();
  }
};

// LocalStorage
const KEY = "servicos";

export const salvarServicosLocal = (dados) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(dados));
  } catch (err) {
    console.error("Erro ao salvar local:", err);
  }
};

export const carregarServicosLocal = () => {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};
