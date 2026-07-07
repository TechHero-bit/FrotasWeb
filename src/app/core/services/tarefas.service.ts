import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Motorista } from './motoristas.service';

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  localizacao: string;
  veiculo_id?: number;
  atribuido_a: string;
  agendado_em: string;
  data_limite: string;
  usuarios?: Partial<Motorista>; // for join
  motorista_nome?: string; // UI friendly
  veiculo_placa?: string; // UI friendly
}

export type NovaTarefa = Omit<Tarefa, 'id' | 'usuarios' | 'motorista_nome' | 'veiculo_placa' | 'agendado_em'>;
export type AtualizarTarefa = Omit<Tarefa, 'id' | 'usuarios' | 'motorista_nome' | 'veiculo_placa' | 'agendado_em'>;

@Injectable({
  providedIn: 'root'
})
export class TarefasService {
  private readonly TABLE = 'tarefas';

  constructor(private supabase: SupabaseService) { }

  async getTarefas(): Promise<Tarefa[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, usuarios(nome), veiculos(placa)')
      .order('data_limite', { ascending: true });

    if (error) throw error;

    return (data || []).map(t => this.mapTarefa(t));
  }

  async addTarefa(tarefa: NovaTarefa): Promise<Tarefa> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        ...tarefa,
        atribuido_a: tarefa.atribuido_a,
        agendado_em: new Date().toISOString()
      })
      .select('*, usuarios(nome), veiculos(placa)')
      .single();

    if (error) throw error;

    return this.mapTarefa(data);
  }

  async updateTarefa(id: string, tarefa: AtualizarTarefa): Promise<Tarefa> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(tarefa)
      .eq('id', id)
      .select('*, usuarios(nome), veiculos(placa)')
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
      motorista_nome: tarefa.usuarios?.nome || 'Não atribuído',
      veiculo_placa: (tarefa as any)?.veiculos?.placa || 'Sem veículo'
    };
  }
}
