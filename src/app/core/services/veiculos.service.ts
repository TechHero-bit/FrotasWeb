import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Motorista } from './motoristas.service';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  status: string;
  responsavel_id?: string;
  responsavel?: Partial<Motorista>;
  responsavel_nome?: string;
}

export type NovoVeiculo = Omit<Veiculo, 'id' | 'status' | 'responsavel' | 'responsavel_nome'>;
export type AtualizarVeiculo = Omit<Veiculo, 'id' | 'responsavel' | 'responsavel_nome'>;

@Injectable({
  providedIn: 'root'
})
export class VeiculosService {
  private readonly TABLE = 'veiculos';

  constructor(private supabase: SupabaseService) { }

  async getVeiculos(): Promise<Veiculo[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, responsavel:usuarios!responsavel_id(nome)')
      .order('id', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(v => ({
      ...v,
      responsavel_nome: v.responsavel?.nome || 'Não atribuído'
    }));
  }

  async addVeiculo(veiculo: NovoVeiculo): Promise<Veiculo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({ ...veiculo, status: 'Disponível' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVeiculo(id: string, veiculo: AtualizarVeiculo): Promise<Veiculo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(veiculo)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVeiculo(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Não é possível excluir o veículo pois ele possui registros vinculados (tarefas ou jornadas).');
      }
      throw error;
    }
  }
}
