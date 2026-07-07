import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, from, combineLatest, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';

import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
import { VeiculosService, Veiculo } from '../../core/services/veiculos.service';
import { TarefasService, Tarefa } from '../../core/services/tarefas.service';
import { HistoricoService, Jornada } from '../../core/services/historico.service';

interface DashboardMetrics {
  totalUsuarios: number;
  totalVeiculos: number;
  totalCorridas: number;
  tarefas: Tarefa[];
  tarefasNaoIniciadas: number;
  tarefasEmAndamento: number;
  tarefasInterrompidas: number;
  tarefasFinalizadas: number;
  pctNaoIniciadas: number;
  pctEmAndamento: number;
  pctInterrompidas: number;
  pctFinalizadas: number;
  historicosRecentes: Jornada[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>Dashboard</h1>
        <p>Visão geral da sua frota</p>
      </div>
      <div class="header-date">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        {{ currentDate }}
      </div>
    </div>

    <!-- Loading State -->
    @if (isLoading) {
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando métricas...</p>
      </div>
    }

    @if (!isLoading && metrics) {
      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- Card: Usuários -->
        <div class="stat-card" id="stat-usuarios">
          <div class="stat-icon icon-clients">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ metrics.totalUsuarios }}</span>
            <span class="stat-label">Total de Usuários</span>
          </div>
        </div>

        <!-- Card: Veículos -->
        <div class="stat-card" id="stat-veiculos">
          <div class="stat-icon icon-vehicles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ metrics.totalVeiculos }}</span>
            <span class="stat-label">Total de Veículos</span>
          </div>
        </div>

        <!-- Card: Corridas -->
        <div class="stat-card" id="stat-corridas">
          <div class="stat-icon icon-orders">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <path d="M12 11h4"/>
              <path d="M12 16h4"/>
              <path d="M8 11h.01"/>
              <path d="M8 16h.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ metrics.totalCorridas }}</span>
            <span class="stat-label">Quantidade de Corridas</span>
          </div>
        </div>
      </div>

      <!-- Content Grid: Status + Recent Orders -->
      <div class="content-grid">
        <!-- Status das Tarefas -->
        <div class="card status-card" id="status-tarefas">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Status das Tarefas
            </h3>
            <span class="card-count">{{ metrics.tarefas.length }} total</span>
          </div>
          <div class="card-body">
            <!-- Não Iniciadas -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-pending"></span>
                Não Iniciadas
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-pending"
                       [style.width.%]="metrics.pctNaoIniciadas"></div>
                </div>
                <span class="status-count">{{ metrics.tarefasNaoIniciadas }}</span>
              </div>
            </div>

            <!-- Em Andamento -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-progress"></span>
                Em Andamento
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-progress"
                       [style.width.%]="metrics.pctEmAndamento"></div>
                </div>
                <span class="status-count">{{ metrics.tarefasEmAndamento }}</span>
              </div>
            </div>

            <!-- Interrompidas -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-interrupted"></span>
                Interrompidas
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-interrupted"
                       [style.width.%]="metrics.pctInterrompidas"></div>
                </div>
                <span class="status-count">{{ metrics.tarefasInterrompidas }}</span>
              </div>
            </div>

            <!-- Finalizadas -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-done"></span>
                Finalizadas
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-done"
                       [style.width.%]="metrics.pctFinalizadas"></div>
                </div>
                <span class="status-count">{{ metrics.tarefasFinalizadas }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Históricos Recentes -->
        <div class="card recent-orders-card" id="recent-histories">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M12 7v5l4 2"/>
              </svg>
              Históricos Recentes
            </h3>
            <span class="card-count">Últimas {{ metrics.historicosRecentes.length }}</span>
          </div>

          @if (metrics.historicosRecentes.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
              </div>
              <h4>Nenhum histórico encontrado</h4>
              <p>Os registros de jornadas aparecerão aqui.</p>
            </div>
          } @else {
            <ul class="order-list">
              @for (historico of metrics.historicosRecentes; track historico.id) {
                <li class="order-item">
                  <div class="order-status-icon" [ngClass]="getStatusIconClass(historico.status)">
                    <!-- Pending icon -->
                    @if (isStatusPending(historico.status)) {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    }
                    <!-- In progress icon -->
                    @if (isStatusInProgress(historico.status)) {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2v4"/>
                        <path d="M12 18v4"/>
                        <path d="m4.93 4.93 2.83 2.83"/>
                        <path d="m16.24 16.24 2.83 2.83"/>
                        <path d="M2 12h4"/>
                        <path d="M18 12h4"/>
                        <path d="m4.93 19.07 2.83-2.83"/>
                        <path d="m16.24 4.93 2.83-2.83"/>
                      </svg>
                    }
                    <!-- Done icon -->
                    @if (isStatusDone(historico.status)) {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    }
                  </div>
                  <div class="order-info">
                    <div class="order-title">{{ historico.motorista_nome }} · {{ historico.veiculo_placa }}</div>
                    <div class="order-meta">{{ historico.origem }} ➔ {{ historico.destino }}</div>
                  </div>
                  <span class="order-badge" [ngClass]="getStatusBadgeClass(historico.status)">
                    {{ historico.status }}
                  </span>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card quick-actions-card" id="quick-actions">
        <div class="card-header">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Ações Rápidas
          </h3>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <!-- Novo Usuário -->
            <a routerLink="/usuarios" class="action-btn" id="action-novo-usuario">
              <div class="action-icon icon-client">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div class="action-text">
                <div class="action-title">Novo Usuário</div>
                <div class="action-desc">Cadastrar um novo usuário</div>
              </div>
              <svg class="action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>

            <!-- Novo Veículo -->
            <a routerLink="/veiculos" class="action-btn" id="action-novo-veiculo">
              <div class="action-icon icon-vehicle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                  <circle cx="17" cy="18" r="2"/>
                  <circle cx="7" cy="18" r="2"/>
                </svg>
              </div>
              <div class="action-text">
                <div class="action-title">Novo Veículo</div>
                <div class="action-desc">Registrar um novo veículo</div>
              </div>
              <svg class="action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>

            <!-- Nova Tarefa -->
            <a routerLink="/tarefas" class="action-btn" id="action-nova-tarefa">
              <div class="action-icon icon-order">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <line x1="12" y1="11" x2="12" y2="17"/>
                  <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <div class="action-text">
                <div class="action-title">Nova Tarefa</div>
                <div class="action-desc">Atribuir nova tarefa</div>
              </div>
              <svg class="action-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentDate = '';
  isLoading = true;
  metrics: DashboardMetrics | null = null;

  constructor(
    private motoristasService: MotoristasService,
    private veiculosService: VeiculosService,
    private tarefasService: TarefasService,
    private historicoService: HistoricoService
  ) {
    this.currentDate = this.formatCurrentDate();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    const usuarios$ = from(this.motoristasService.getMotoristas()).pipe(
      catchError(() => of([] as Motorista[]))
    );

    const veiculos$ = from(this.veiculosService.getVeiculos()).pipe(
      catchError(() => of([] as Veiculo[]))
    );

    const tarefas$ = from(this.tarefasService.getTarefas()).pipe(
      catchError(() => of([] as Tarefa[]))
    );

    const historicos$ = from(this.historicoService.getJornadas()).pipe(
      catchError(() => of([] as Jornada[]))
    );

    combineLatest([usuarios$, veiculos$, tarefas$, historicos$])
      .pipe(
        takeUntil(this.destroy$),
        map(([usuarios, veiculos, tarefas, historicos]) => this.computeMetrics(usuarios, veiculos, tarefas, historicos))
      )
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private computeMetrics(
    usuarios: Motorista[],
    veiculos: Veiculo[],
    tarefas: Tarefa[],
    historicos: Jornada[]
  ): DashboardMetrics {
    const totalTarefas = tarefas.length;

    const tarefasNaoIniciadas = tarefas.filter(o => {
      const normalized = this.normalizeStatus(o.status);
      return normalized === 'pendente' || normalized === 'nao iniciada';
    }).length;

    const tarefasEmAndamento = tarefas.filter(o => {
      const normalized = this.normalizeStatus(o.status);
      return normalized === 'em andamento' || normalized === 'emandamento' || normalized === 'andamento';
    }).length;

    const tarefasInterrompidas = tarefas.filter(o => {
      const normalized = this.normalizeStatus(o.status);
      return normalized === 'interrompido' || normalized === 'interrompida';
    }).length;

    const tarefasFinalizadas = tarefas.filter(o => {
      const normalized = this.normalizeStatus(o.status);
      return normalized === 'concluida' || normalized === 'concluído' || normalized === 'finalizada' || normalized === 'finalizado' || normalized === 'concluido';
    }).length;

    const pctNaoIniciadas = totalTarefas > 0 ? (tarefasNaoIniciadas / totalTarefas) * 100 : 0;
    const pctEmAndamento = totalTarefas > 0 ? (tarefasEmAndamento / totalTarefas) * 100 : 0;
    const pctInterrompidas = totalTarefas > 0 ? (tarefasInterrompidas / totalTarefas) * 100 : 0;
    const pctFinalizadas = totalTarefas > 0 ? (tarefasFinalizadas / totalTarefas) * 100 : 0;

    // Sort by date descending and take 5 most recent
    const historicosRecentes = [...historicos]
      .sort((a, b) => {
        const dateA = new Date(a.iniciado_em).getTime();
        const dateB = new Date(b.iniciado_em).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalUsuarios: usuarios.length,
      totalVeiculos: veiculos.length,
      totalCorridas: historicos.length,
      tarefas,
      tarefasNaoIniciadas,
      tarefasEmAndamento,
      tarefasInterrompidas,
      tarefasFinalizadas,
      pctNaoIniciadas,
      pctEmAndamento,
      pctInterrompidas,
      pctFinalizadas,
      historicosRecentes
    };
  }

  // ── Template Helpers ──

  isStatusPending(status: string): boolean {
    const s = this.normalizeStatus(status);
    return s === 'pendente' || s === 'nao iniciada';
  }

  isStatusInProgress(status: string): boolean {
    const s = this.normalizeStatus(status);
    return s === 'em andamento' || s === 'andamento';
  }

  isStatusDone(status: string): boolean {
    const s = this.normalizeStatus(status);
    return s === 'concluida' || s === 'finalizada';
  }

  getStatusIconClass(status: string): string {
    if (this.isStatusPending(status)) return 'icon-pending';
    if (this.isStatusInProgress(status)) return 'icon-progress';
    return 'icon-done';
  }

  getStatusBadgeClass(status: string): string {
    if (this.isStatusPending(status)) return 'badge-pending';
    if (this.isStatusInProgress(status)) return 'badge-progress';
    return 'badge-done';
  }

  private formatCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const formatted = now.toLocaleDateString('pt-BR', options);
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private normalizeStatus(status: string): string {
    if (!status) return '';
    return status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
