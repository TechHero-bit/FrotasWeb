import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Motorista } from './motoristas.service';

export interface Tarefa {
  id: string;
  titulo: string;
  status: string;
  data_limite: string;
  usuario_id: string;
  usuarios?: Partial<Motorista>; // for join
  motorista_nome?: string; // UI friendly
}

@Injectable({
  providedIn: 'root'
})
export class TarefasService {
  private readonly TABLE = 'tarefas';

  constructor(private supabase: SupabaseService) {}

  async getTarefas(): Promise<Tarefa[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, usuarios(nome)')
      .order('data_limite', { ascending: true });

    if (error) throw error;
    
    // Map joined user name for table display
    return (data || []).map(t => ({
      ...t,
      motorista_nome: t.usuarios?.nome || 'Não atribuído'
    }));
  }

  async addTarefa(tarefa: Omit<Tarefa, 'id' | 'usuarios' | 'motorista_nome'>): Promise<Tarefa> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert(tarefa)
      .select('*, usuarios(nome)')
      .single();

    if (error) throw error;
    
    return {
      ...data,
      motorista_nome: data.usuarios?.nome || 'Não atribuído'
    };
  }

  async deleteTarefa(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
