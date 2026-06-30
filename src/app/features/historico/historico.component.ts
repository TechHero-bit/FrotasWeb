import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HistoricoService, Jornada } from '../../core/services/historico.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  providers: [DatePipe],
  template: `
    <!-- Page Header -->
    <div class="historico-header">
      <div class="header-text">
        <h2>Histórico de Corridas</h2>
        <p class="header-subtitle">{{ jornadasFiltradas.length }} corrida{{ jornadasFiltradas.length !== 1 ? 's' : '' }} encontrada{{ jornadasFiltradas.length !== 1 ? 's' : '' }}</p>
      </div>

      <!-- Date Filter -->
      <div class="filter-bar">
        <div class="date-filter-wrapper" [class.active]="selectedDate">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          <input
            type="date"
            class="date-input"
            [(ngModel)]="selectedDate"
            (ngModelChange)="onDateChange()"
            [max]="maxDate"
            id="historico-date-filter"
          />
          <span class="date-label">{{ selectedDate ? formatSelectedDate(selectedDate) : 'Filtrar por data' }}</span>
        </div>

        @if (selectedDate) {
          <button class="clear-btn" (click)="clearFilter()" title="Limpar filtro">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
            Limpar
          </button>
        }
      </div>
    </div>

    @if (error) {
      <div class="alert-danger">
        {{ error }}
      </div>
    }

    @if (isLoading) {
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    } @else {
      @if (selectedDate && jornadasFiltradas.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
              <path d="m14.5 14.5-5 5"/>
              <path d="m9.5 14.5 5 5"/>
            </svg>
          </div>
          <h4>Nenhuma corrida em {{ formatSelectedDate(selectedDate) }}</h4>
          <p>Tente selecionar outra data ou <button class="link-btn" (click)="clearFilter()">ver todas as corridas</button>.</p>
        </div>
      } @else {
        <app-table [data]="jornadasFiltradas" [columns]="columns">
          <ng-template #actions let-row>
            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.85rem;" (click)="verDetalhes(row)">Detalhes</button>
          </ng-template>
        </app-table>
      }
    }
  `,
  styles: [`
    .historico-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-text h2 {
      margin: 0 0 0.25rem;
      color: var(--color-primary);
      font-size: 1.5rem;
      font-weight: 700;
    }

    .header-subtitle {
      margin: 0;
      font-size: 0.85rem;
      color: var(--color-gray-500, #6b7280);
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-filter-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      color: var(--color-gray-600, #4b5563);
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 210px;
    }

    .date-filter-wrapper:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 185,28,28), 0.08);
    }

    .date-filter-wrapper.active {
      border-color: var(--color-primary);
      background: #fff5f5;
      color: var(--color-primary);
    }

    .date-filter-wrapper svg {
      flex-shrink: 0;
      color: var(--color-primary);
    }

    /* Hide native date input visually but keep it functional */
    .date-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      border: none;
      background: transparent;
      z-index: 1;
    }

    .date-label {
      pointer-events: none;
      white-space: nowrap;
    }

    .clear-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.75rem;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: #fff;
      color: var(--color-gray-600, #4b5563);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .clear-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: #fff5f5;
    }

    /* Alert */
    .alert-danger {
      padding: 1rem;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
      color: var(--color-gray-500, #6b7280);
    }

    .loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--color-border, #e0e0e0);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: #fff;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 12px;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      background: #f9fafb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      color: var(--color-gray-400, #9ca3af);
    }

    .empty-icon svg {
      width: 32px;
      height: 32px;
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: var(--color-gray-700, #374151);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-gray-500, #6b7280);
    }

    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--color-primary);
      font-size: inherit;
      cursor: pointer;
      text-decoration: underline;
    }
  `]
})
export class HistoricoComponent implements OnInit {
  jornadas: any[] = [];
  jornadasFiltradas: any[] = [];
  selectedDate: string = '';
  maxDate: string = '';
  isLoading = true;

  columns: TableColumn[] = [
    { key: 'motorista_nome', label: 'Motorista' },
    { key: 'veiculo_placa', label: 'Veículo' },
    { key: 'origem', label: 'Origem' },
    { key: 'destino', label: 'Destino' },
    { key: 'status', label: 'Status' },
    { key: 'data_formatada', label: 'Data' }
  ];

  error: string | null = null;

  constructor(
    private historicoService: HistoricoService,
    private datePipe: DatePipe,
    private router: Router
  ) {
    // Set max date to today
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadJornadas();
  }

  async loadJornadas() {
    try {
      this.isLoading = true;
      this.error = null;
      const data = await this.historicoService.getJornadas();
      this.jornadas = data.map(j => ({
        ...j,
        data_formatada: this.datePipe.transform(j.iniciado_em, 'shortDate'),
        // Store ISO date string for filtering (YYYY-MM-DD)
        _date_key: j.iniciado_em ? new Date(j.iniciado_em).toISOString().split('T')[0] : ''
      }));
      this.jornadasFiltradas = [...this.jornadas];
    } catch (err: any) {
      this.error = 'Erro ao carregar histórico: ' + err.message;
    } finally {
      this.isLoading = false;
    }
  }

  onDateChange() {
    if (!this.selectedDate) {
      this.jornadasFiltradas = [...this.jornadas];
      return;
    }
    this.jornadasFiltradas = this.jornadas.filter(j => j._date_key === this.selectedDate);
  }

  clearFilter() {
    this.selectedDate = '';
    this.jornadasFiltradas = [...this.jornadas];
  }

  formatSelectedDate(dateStr: string): string {
    if (!dateStr) return '';
    // Parse as local date to avoid timezone offset shifting the day
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  verDetalhes(jornada: Jornada) {
    this.router.navigate(['/historico', jornada.id]);
  }
}
