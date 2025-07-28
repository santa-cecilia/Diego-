// src/utils/sepabase.js
export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
};

export const loadData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao carregar do localStorage:", error);
    return [];
  }
};

export const updateData = (key, newData) => {
  try {
    saveData(key, newData);
  } catch (error) {
    console.error("Erro ao atualizar o localStorage:", error);
  }
};

export const deleteItem = (key, index) => {
  try {
    const data = loadData(key);
    data.splice(index, 1);
    saveData(key, data);
  } catch (error) {
    console.error("Erro ao excluir item do localStorage:", error);
  }
};
