import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '..hooks/useAuth';

export const useSupabaseData = (table) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario?.id) {
      fetchData();
    }
  }, [usuario, table]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(table)
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error(`Erro ao buscar dados de ${table}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const insert = async (newData) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([{ ...newData, usuario_id: usuario.id }])
        .select()
        .single();

      if (error) throw error;
      setData(prev => [result, ...prev]);
      return result;
    } catch (error) {
      console.error(`Erro ao inserir em ${table}:`, error);
      throw error;
    }
  };

  const update = async (id, updates) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', usuario.id)
        .select()
        .single();

      if (error) throw error;
      setData(prev => prev.map(item => item.id === id ? result : item));
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar ${table}:`, error);
      throw error;
    }
  };

  const remove = async (id) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuario.id);

      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Erro ao remover de ${table}:`, error);
      throw error;
    }
  };

  return {
    data,
    loading,
    insert,
    update,
    remove,
    refetch: fetchData
  };
};