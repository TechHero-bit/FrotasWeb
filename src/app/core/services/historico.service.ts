import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Motorista } from './motoristas.service';
import { Veiculo } from './veiculos.service';

export interface Checkin {
  foto_painel_uri?: string;
  selfie_uri?: string;
  foto_frente_uri?: string;
  foto_lateral_direita_uri?: string;
  foto_lateral_esquerda_uri?: string;
  foto_traseira_uri?: string;
  foto_placa_uri?: string; // Mantido para compatibilidade
}

export interface Checkout {
  id?: string;
  foto_painel_uri?: string;
  selfie_uri?: string;
  foto_frente_uri?: string;
  foto_lateral_direita_uri?: string;
  foto_lateral_esquerda_uri?: string;
  foto_traseira_uri?: string;
  foto_veiculo_uri?: string; // Mantido para compatibilidade
  observacoes?: string;
}

export interface Jornada {
  id: string;
  motorista_id: string;
  veiculo_id: string;
  origem: string;
  destino: string;
  status: string;
  iniciado_em: string;
  encerrado_em?: string;
  origem_latitude?: number;
  origem_longitude?: number;
  destino_latitude?: number;
  destino_longitude?: number;
  
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
        checkins!jornada_id (*),
        checkouts!jornada_id (*)
      `)
      .order('iniciado_em', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(j => ({
      ...j,
      motorista_nome: j.usuarios?.nome || 'Desconhecido',
      veiculo_placa: j.veiculos ? `${j.veiculos.modelo} (${j.veiculos.placa})` : 'Desconhecido'
    }));
  }

  async getJornadaAtivaPorMotorista(motoristaId: string): Promise<Jornada | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, veiculos (placa, modelo)')
      .eq('motorista_id', motoristaId)
      .eq('status', 'Em andamento')
      .order('iniciado_em', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
       data.veiculo_placa = data.veiculos ? `${data.veiculos.modelo} (${data.veiculos.placa})` : 'Desconhecido';
    }
    
    return data || null;
  }
  
  async getJornadaById(id: string): Promise<Jornada> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*, veiculos (placa, modelo)')
      .eq('id', id)
      .single();

    if (error) throw error;
    data.veiculo_placa = data.veiculos ? `${data.veiculos.modelo} (${data.veiculos.placa})` : 'Desconhecido';
    return data;
  }

  async iniciarJornada(jornada: Partial<Jornada>, checkin: Checkin): Promise<Jornada> {
    const { data: jornadaData, error: jornadaError } = await this.supabase.client
      .from(this.TABLE)
      .insert(jornada)
      .select()
      .single();

    if (jornadaError) throw jornadaError;

    const { error: checkinError } = await this.supabase.client
      .from('checkins')
      .insert({ ...checkin, jornada_id: jornadaData.id });

    if (checkinError) throw checkinError;

    return jornadaData;
  }

  async finalizarJornada(id: string, checkout: Checkout, kmFinal: number): Promise<void> {
    const { error: checkoutError } = await this.supabase.client
      .from('checkouts')
      .insert({ ...checkout, jornada_id: id });

    if (checkoutError) throw checkoutError;

    const encerrado_em = new Date().toISOString();

    const { error: jornadaError } = await this.supabase.client
      .from(this.TABLE)
      .update({ status: 'Concluída', encerrado_em, km_final: kmFinal })
      .eq('id', id);

    if (jornadaError) throw jornadaError;
  }
}
