import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Motorista } from './motoristas.service';
import { Veiculo } from './veiculos.service';

export interface Checkin {
  selfie_uri: string;
  foto_placa_uri: string;
}

export interface Checkout {
  id?: string;
  // Outros campos se necessário
}

export interface Jornada {
  id: string;
  usuario_id: string;
  veiculo_id: string;
  origem: string;
  destino: string;
  status: string;
  iniciado_em: string;
  hora_inicio?: string;
  hora_fim?: string;
  
  // Relações
  usuarios?: Partial<Motorista>;
  veiculos?: Partial<Veiculo>;
  checkins?: Checkin[];
  checkouts?: Checkout[];

  // Campos amigáveis para UI
  motorista_nome?: string;
  veiculo_placa?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoricoService {
  private readonly TABLE = 'jornadas';

  constructor(private supabase: SupabaseService) {}

  async getJornadas(): Promise<Jornada[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        usuarios (nome),
        veiculos (placa, modelo),
        checkins (selfie_uri, foto_placa_uri),
        checkouts (*)
      `)
      .order('iniciado_em', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(j => ({
      ...j,
      motorista_nome: j.usuarios?.nome || 'Desconhecido',
      veiculo_placa: j.veiculos ? `${j.veiculos.modelo} (${j.veiculos.placa})` : 'Desconhecido'
    }));
  }
}
