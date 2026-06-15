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

export type NovaTarefa = Omit<Tarefa, 'id' | 'usuarios' | 'motorista_nome'>;
export type AtualizarTarefa = Omit<Tarefa, 'id' | 'usuarios' | 'motorista_nome'>;

@Injectable({
  providedIn: 'root'
})
export class TarefasService {
  private readonly TABLE = 'tarefas';

  constructor(private supabase: SupabaseService) { }

  async getTarefas(): Promise<Tarefa[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, usuarios(nome)')
      .order('data_limite', { ascending: true });

    if (error) throw error;

    return (data || []).map(t => this.mapTarefa(t));
  }

  async addTarefa(tarefa: NovaTarefa): Promise<Tarefa> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert(tarefa)
      .select('*, usuarios(nome)')
      .single();

    if (error) throw error;

    return this.mapTarefa(data);
  }

  async updateTarefa(id: string, tarefa: AtualizarTarefa): Promise<Tarefa> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(tarefa)
      .eq('id', id)
      .select('*, usuarios(nome)')
      .single();

    if (error) throw error;

    return this.mapTarefa(data);
  }

  async deleteTarefa(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapTarefa(tarefa: Tarefa): Tarefa {
    return {
      ...tarefa,
      motorista_nome: tarefa.usuarios?.nome || 'Não atribuído'
    };
  }
}
