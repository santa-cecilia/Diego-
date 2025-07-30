import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hrfbbqldfsluevicrssx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmJicWxkZnNsdWV2aWNyc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTE0NzYsImV4cCI6MjA2OTMyNzQ3Nn0.ecuMk7FbSzgTvMx66_TksV6MkEhNrRn86g0G1MnuIrk";
export const supabase = createClient(supabaseUrl, supabaseKey);

const table = "servicos";

// ➕ Adicionar serviço
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

// 🔄 Atualizar serviço
export const atualizarServico = async (servico) => {
  try {
    const { id, ...dados } = servico;
    const { data, error } = await supabase
      .from(table)
      .update(dados)
      .eq("id", id);

    if (error) throw error;

    const local = carregarServicosLocal().map((s) =>
      s.id === id ? { ...s, ...dados } : s
    );
    salvarServicosLocal(local);

    return { success: true, data };
  } catch (err) {
    console.error("Erro ao atualizar serviço:", err);
    return { success: false };
  }
};

// 🗑️ Excluir serviço
export const excluirServico = async (id) => {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;

    const local = carregarServicosLocal().filter((s) => s.id !== id);
    salvarServicosLocal(local);

    return { success: true };
  } catch (err) {
    console.error("Erro ao excluir serviço:", err);
    return { success: false };
  }
};

// 🔽 Carregar da nuvem
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

// 💾 LocalStorage
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
