import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  status: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VeiculosService {
  private readonly TABLE = 'veiculos';

  constructor(private supabase: SupabaseService) {}

  async getVeiculos(): Promise<Veiculo[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addVeiculo(veiculo: Omit<Veiculo, 'id' | 'created_at'>): Promise<Veiculo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert(veiculo)
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
