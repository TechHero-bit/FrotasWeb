import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { VeiculosService, Veiculo } from '../../../core/services/veiculos.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { HistoricoService, Jornada } from '../../../core/services/historico.service';

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
  jornadaAtivaAtual: Jornada | null = null;

  veiculos: Veiculo[] = [];
  meuVeiculo: Veiculo | null = null;

  countDisponiveis = 0;
  countEmRota = 0;
  countManutencao = 0;

  constructor(
    private readonly veiculosService: VeiculosService,
    private readonly supabaseService: SupabaseService,
    private readonly historicoService: HistoricoService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  iniciarJornada(): void {
    if (this.loading) return;

    if (this.jornadaAtivaAtual) {
      this.router.navigate(['/motorista/jornada', this.jornadaAtivaAtual.id]);
      return;
    }

    if (this.meuVeiculo) {
      this.router.navigate(['/motorista/checkin', this.meuVeiculo.id]);
      return;
    }

    this.router.navigate(['/motorista/frota']);
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    try {
      // Load driver name from session
      const session = await this.supabaseService.getCurrentSession();
      if (session?.user) {
        const profile = await this.supabaseService.getUserProfile(session.user.id);
        this.driverName = profile.nome || profile.email || 'Motorista';
        this.jornadaAtivaAtual = await this.historicoService.getJornadaAtivaPorMotorista(session.user.id);
        this.jornadaAtiva = !!this.jornadaAtivaAtual;
      }

      // Load vehicles
      this.veiculos = await this.veiculosService.getVeiculos();

      this.countDisponiveis = this.veiculos.filter(v => v.status === 'Disponível').length;
      this.countEmRota = this.veiculos.filter(v => v.status === 'Em rota').length;
      this.countManutencao = this.veiculos.filter(v => v.status === 'Manutenção').length;

      // Prioriza o veículo da jornada ativa; se não houver, usa um veículo disponível.
      this.meuVeiculo =
        this.veiculos.find(v => v.id === this.jornadaAtivaAtual?.veiculo_id) ||
        this.veiculos.find(v => v.status === 'Disponível') ||
        null;
    } catch {
      // Silently handle — template shows defaults
    } finally {
      this.loading = false;
    }
  }
}
