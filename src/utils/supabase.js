import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hrfbbqldfsluevicrssx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmJicWxkZnNsdWV2aWNyc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTE0NzYsImV4cCI6MjA2OTMyNzQ3Nn0.ecuMk7FbSzgTvMx66_TksV6MkEhNrRn86g0G1MnuIrk";

export const supabase = createClient(supabaseUrl, supabaseKey);
const table = "servicos";
const KEY = "servicos";

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
    const { data, error } = await supabase.from(table).update(dados).eq("id", id);
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

// 🔽 Carregar da nuvem (com fallback)
export const carregarServicos = async () => {
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;

    console.log("🔄 Dados carregados do Supabase:", data);
    salvarServicosLocal(data); // Atualiza localStorage com os dados do Supabase
    return data;
  } catch (err) {
    console.warn("⚠️ Falha ao carregar do Supabase. Carregando local.");
    const local = carregarServicosLocal();
    console.log("📦 Dados carregados do localStorage:", local);
    return local;
  }
};

// 💾 LocalStorage
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
    console.error("Erro ao carregar local:", err);
    return [];
  }
};
