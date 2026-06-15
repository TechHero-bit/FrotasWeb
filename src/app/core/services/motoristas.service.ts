import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Motorista {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class MotoristasService {
  private readonly TABLE = 'usuarios';

  constructor(private supabase: SupabaseService) {}

  async getMotoristas(): Promise<Motorista[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .in('role', ['motorista', 'driver'])
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async addMotorista(motorista: Omit<Motorista, 'id' | 'role'>): Promise<Motorista> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({ ...motorista, role: 'motorista' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMotorista(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Não é possível excluir o motorista pois ele possui registros vinculados (tarefas ou jornadas).');
      }
      throw error;
    }
  }
}
