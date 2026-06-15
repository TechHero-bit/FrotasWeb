import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, from, combineLatest, of } from 'rxjs';
import { takeUntil, catchError, map, startWith } from 'rxjs/operators';

import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
import { VeiculosService, Veiculo } from '../../core/services/veiculos.service';
import { TarefasService, Tarefa } from '../../core/services/tarefas.service';

interface DashboardMetrics {
  totalClientes: number;
  totalVeiculos: number;
  totalOrdens: number;
  ordens: Tarefa[];
  ordensPendentes: number;
  ordensEmAndamento: number;
  ordensConcluidas: number;
  pctPendentes: number;
  pctEmAndamento: number;
  pctConcluidas: number;
  ordensRecentes: Tarefa[];
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
        <p>Visão geral da sua oficina</p>
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
        <!-- Card: Clientes -->
        <div class="stat-card" id="stat-clientes">
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
            <span class="stat-value">{{ metrics.totalClientes }}</span>
            <span class="stat-label">Total de Clientes</span>
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

        <!-- Card: Ordens de Serviço -->
        <div class="stat-card" id="stat-ordens">
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
            <span class="stat-value">{{ metrics.totalOrdens }}</span>
            <span class="stat-label">Total de Ordens</span>
          </div>
        </div>
      </div>

      <!-- Content Grid: Status + Recent Orders -->
      <div class="content-grid">
        <!-- Status das Ordens -->
        <div class="card status-card" id="status-ordens">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Status das Ordens
            </h3>
            <span class="card-count">{{ metrics.totalOrdens }} total</span>
          </div>
          <div class="card-body">
            <!-- Pendentes -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-pending"></span>
                Pendentes
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-pending"
                       [style.width.%]="metrics.pctPendentes"></div>
                </div>
                <span class="status-count">{{ metrics.ordensPendentes }}</span>
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
                <span class="status-count">{{ metrics.ordensEmAndamento }}</span>
              </div>
            </div>

            <!-- Concluídas -->
            <div class="status-item">
              <div class="status-label">
                <span class="status-dot dot-done"></span>
                Concluídas
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar">
                  <div class="status-bar-fill fill-done"
                       [style.width.%]="metrics.pctConcluidas"></div>
                </div>
                <span class="status-count">{{ metrics.ordensConcluidas }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ordens Recentes -->
        <div class="card recent-orders-card" id="recent-orders">
          <div class="card-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M12 7v5l4 2"/>
              </svg>
              Ordens Recentes
            </h3>
            <span class="card-count">Últimas {{ metrics.ordensRecentes.length }}</span>
          </div>

          @if (metrics.ordensRecentes.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
              </div>
              <h4>Nenhuma ordem encontrada</h4>
              <p>Comece criando uma nova ordem de serviço.</p>
            </div>
          } @else {
            <ul class="order-list">
              @for (order of metrics.ordensRecentes; track order.id) {
                <li class="order-item">
                  <div class="order-status-icon" [ngClass]="getStatusIconClass(order.status)">
                    <!-- Pending icon -->
                    @if (isStatusPending(order.status)) {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    }
                    <!-- In progress icon -->
                    @if (isStatusInProgress(order.status)) {
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
                    @if (isStatusDone(order.status)) {
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    }
                  </div>
                  <div class="order-info">
                    <div class="order-title">OS #{{ order.id.substring(0, 8).toUpperCase() }} — {{ order.titulo }}</div>
                    <div class="order-meta">{{ order.motorista_nome }} · {{ formatDate(order.data_limite) }}</div>
                  </div>
                  <span class="order-badge" [ngClass]="getStatusBadgeClass(order.status)">
                    {{ order.status }}
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
            <!-- Novo Cliente -->
            <a routerLink="/usuarios" class="action-btn" id="action-novo-cliente">
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
                <div class="action-title">Novo Cliente</div>
                <div class="action-desc">Cadastrar um novo cliente</div>
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

            <!-- Nova Ordem -->
            <a routerLink="/tarefas" class="action-btn" id="action-nova-ordem">
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
                <div class="action-title">Nova Ordem</div>
                <div class="action-desc">Abrir nova ordem de serviço</div>
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
    private tarefasService: TarefasService
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
    const clientes$ = from(this.motoristasService.getMotoristas()).pipe(
      catchError(() => of([] as Motorista[]))
    );

    const veiculos$ = from(this.veiculosService.getVeiculos()).pipe(
      catchError(() => of([] as Veiculo[]))
    );

    const ordens$ = from(this.tarefasService.getTarefas()).pipe(
      catchError(() => of([] as Tarefa[]))
    );

    combineLatest([clientes$, veiculos$, ordens$])
      .pipe(
        takeUntil(this.destroy$),
        map(([clientes, veiculos, ordens]) => this.computeMetrics(clientes, veiculos, ordens))
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
    clientes: Motorista[],
    veiculos: Veiculo[],
    ordens: Tarefa[]
  ): DashboardMetrics {
    const total = ordens.length;

    const ordensPendentes = ordens.filter(o =>
      this.normalizeStatus(o.status) === 'pendente'
    ).length;

    const ordensEmAndamento = ordens.filter(o =>
      this.normalizeStatus(o.status) === 'em andamento'
    ).length;

    const ordensConcluidas = ordens.filter(o =>
      this.normalizeStatus(o.status) === 'concluída'
    ).length;

    const pctPendentes = total > 0 ? (ordensPendentes / total) * 100 : 0;
    const pctEmAndamento = total > 0 ? (ordensEmAndamento / total) * 100 : 0;
    const pctConcluidas = total > 0 ? (ordensConcluidas / total) * 100 : 0;

    // Sort by date descending and take 5 most recent
    const ordensRecentes = [...ordens]
      .sort((a, b) => {
        const dateA = new Date(a.data_limite).getTime();
        const dateB = new Date(b.data_limite).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalClientes: clientes.length,
      totalVeiculos: veiculos.length,
      totalOrdens: total,
      ordens,
      ordensPendentes,
      ordensEmAndamento,
      ordensConcluidas,
      pctPendentes,
      pctEmAndamento,
      pctConcluidas,
      ordensRecentes
    };
  }

  // ── Template Helpers ──

  isStatusPending(status: string): boolean {
    return this.normalizeStatus(status) === 'pendente';
  }

  isStatusInProgress(status: string): boolean {
    return this.normalizeStatus(status) === 'em andamento';
  }

  isStatusDone(status: string): boolean {
    return this.normalizeStatus(status) === 'concluída';
  }

  getStatusIconClass(status: string): string {
    const s = this.normalizeStatus(status);
    if (s === 'pendente') return 'icon-pending';
    if (s === 'em andamento') return 'icon-progress';
    return 'icon-done';
  }

  getStatusBadgeClass(status: string): string {
    const s = this.normalizeStatus(status);
    if (s === 'pendente') return 'badge-pending';
    if (s === 'em andamento') return 'badge-progress';
    return 'badge-done';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
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
    return (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      // Re-add the expected accented form after normalization for matching
      .replace('concluida', 'concluída');
  }
}
