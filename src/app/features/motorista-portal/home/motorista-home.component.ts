import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VeiculosService, Veiculo } from '../../../core/services/veiculos.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-motorista-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './motorista-home.component.html',
  styleUrl: './motorista-home.component.scss'
})
export class MotoristaHomeComponent implements OnInit {
  jornadaAtiva = false;
  loading = true;
  driverName = '';

  veiculos: Veiculo[] = [];
  meuVeiculo: Veiculo | null = null;

  countDisponiveis = 0;
  countEmRota = 0;
  countManutencao = 0;

  constructor(
    private readonly veiculosService: VeiculosService,
    private readonly supabaseService: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  iniciarJornada(): void {
    this.jornadaAtiva = !this.jornadaAtiva;
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    try {
      // Load driver name from session
      const session = await this.supabaseService.getCurrentSession();
      if (session?.user) {
        const profile = await this.supabaseService.getUserProfile(session.user.id);
        this.driverName = profile.nome || profile.email || 'Motorista';
      }

      // Load vehicles
      this.veiculos = await this.veiculosService.getVeiculos();

      this.countDisponiveis = this.veiculos.filter(v => v.status === 'Disponível').length;
      this.countEmRota = this.veiculos.filter(v => v.status === 'Em rota').length;
      this.countManutencao = this.veiculos.filter(v => v.status === 'Manutenção').length;

      // Pick first "Em rota" vehicle as "meuVeiculo", fallback to first available
      this.meuVeiculo =
        this.veiculos.find(v => v.status === 'Em rota') ||
        this.veiculos.find(v => v.status === 'Disponível') ||
        this.veiculos[0] || null;
    } catch {
      // Silently handle — template shows defaults
    } finally {
      this.loading = false;
    }
  }
}
