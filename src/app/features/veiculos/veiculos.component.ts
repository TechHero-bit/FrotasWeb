import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VeiculosService, Veiculo } from '../../core/services/veiculos.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableComponent,
    ModalComponent
  ],
  template: `
    <!-- Page Header -->
    <div class="page-top">
      <div class="header-text">
        <h2>Veículos</h2>
        <p class="header-subtitle">{{ veiculosFiltered.length }} veículo{{ veiculosFiltered.length !== 1 ? 's' : '' }} encontrado{{ veiculosFiltered.length !== 1 ? 's' : '' }}</p>
      </div>
      <div class="header-actions">
        <!-- Search bar -->
        <div class="search-bar" [class.has-value]="searchQuery">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilter()"
            placeholder="Buscar por placa, modelo..."
            id="veiculos-search"
          />
          @if (searchQuery) {
            <button class="search-clear" (click)="clearSearch()" title="Limpar busca">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          }
        </div>
        <!-- Status filter -->
        <div class="status-filter" [class.has-value]="statusFilter">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <select class="status-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" id="veiculos-status-filter">
            <option value="">Todos os status</option>
            <option value="Disponível">Disponível</option>
            <option value="Em rota">Em rota</option>
            <option value="Manutenção">Manutenção</option>
          </select>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Novo Veículo</button>
      </div>
    </div>

    @if (error) {
      <div class="alert alert-danger mb-4">
        {{ error }}
      </div>
    }

    @if (success) {
      <div class="alert alert-success mb-4">
        {{ success }}
      </div>
    }

    @if ((searchQuery || statusFilter) && veiculosFiltered.length === 0) {
      <div class="empty-search">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <path d="M8 11h6"/>
        </svg>
        <p>Nenhum veículo encontrado para os filtros aplicados.</p>
        <button class="btn btn-outline" (click)="clearSearch()">Limpar filtros</button>
      </div>
    } @else {
    <app-table [data]="veiculosFiltered" [columns]="columns">
      <ng-template #actions let-row>
        <div class="actions-group">
          <button class="btn-icon btn-icon-edit" type="button" title="Editar veículo" aria-label="Editar veículo" (click)="openEditModal(row)">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h4l10-10-4-4L4 16v4Z"></path>
              <path d="M13 7l4 4"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-danger" type="button" title="Excluir veículo" aria-label="Excluir veículo" (click)="deleteVeiculo(row.id)">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M8 6v14h8V6"></path>
              <path d="M10 10v6"></path>
              <path d="M14 10v6"></path>
              <path d="M9 6V4h6v2"></path>
            </svg>
          </button>
        </div>
      </ng-template>
    </app-table>
    }

    <app-modal [(isOpen)]="isModalOpen" [title]="modalTitle">
      <form [formGroup]="veiculoForm" (ngSubmit)="saveVeiculo()">
        <div class="form-group">
          <label for="placa">Placa</label>
          <input id="placa" type="text" formControlName="placa" placeholder="EX: ABC-1234">
        </div>
        <div class="form-group">
          <label for="modelo">Modelo</label>
          <input id="modelo" type="text" formControlName="modelo" placeholder="EX: Fiat Uno">
        </div>
        @if (editingVeiculo) {
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" formControlName="status">
              <option value="Disponível">Disponível</option>
              <option value="Em rota">Em rota</option>
              <option value="Manutenção">Manutenção</option>
            </select>
          </div>
        }
        
        <div class="d-flex justify-content-between mt-4">
          <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="veiculoForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : (editingVeiculo ? 'Salvar alterações' : 'Salvar') }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .page-top {
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .search-bar {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 220px;
    }
    .search-bar:focus-within,
    .search-bar.has-value {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(185,28,28,0.08);
    }
    .search-bar > svg {
      flex-shrink: 0;
      color: var(--color-gray-400, #9ca3af);
      transition: color 0.2s;
    }
    .search-bar:focus-within > svg,
    .search-bar.has-value > svg {
      color: var(--color-primary);
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.875rem;
      color: var(--color-gray-700, #374151);
      min-width: 0;
    }
    .search-input::placeholder { color: var(--color-gray-400, #9ca3af); }
    .search-clear {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: var(--color-gray-400, #9ca3af);
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }
    .search-clear:hover { color: var(--color-primary); }
    /* Status filter */
    .status-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border: 1.5px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
      color: var(--color-gray-400, #9ca3af);
    }
    .status-filter.has-value {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(185,28,28,0.08);
      color: var(--color-primary);
    }
    .status-select {
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.875rem;
      color: var(--color-gray-700, #374151);
      cursor: pointer;
    }
    .empty-search {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: #fff;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 12px;
      gap: 0.75rem;
      color: var(--color-gray-400, #9ca3af);
    }
    .empty-search p { margin: 0; font-size: 0.9rem; color: var(--color-gray-600, #4b5563); }
    .alert-danger {
      padding: 1rem;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .alert-success {
      padding: 1rem;
      background: #d4edda;
      color: #155724;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
  `]
})
export class VeiculosComponent implements OnInit {
  veiculos: Veiculo[] = [];
  veiculosFiltered: Veiculo[] = [];
  searchQuery = '';
  statusFilter = '';
  columns: TableColumn[] = [
    { key: 'placa', label: 'Placa' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'status', label: 'Status' }
  ];

  isModalOpen = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  editingVeiculo: Veiculo | null = null;

  veiculoForm: FormGroup;

  constructor(
    private veiculosService: VeiculosService,
    private fb: FormBuilder
  ) {
    this.veiculoForm = this.fb.group({
      placa: ['', Validators.required],
      modelo: ['', Validators.required],
      status: ['Disponível', Validators.required]
    });
  }

  get modalTitle(): string {
    return this.editingVeiculo ? 'Editar Veículo' : 'Novo Veículo';
  }

  ngOnInit() {
    this.loadVeiculos();
  }

  async loadVeiculos() {
    try {
      this.error = null;
      this.veiculos = await this.veiculosService.getVeiculos();
      this.veiculosFiltered = [...this.veiculos];
    } catch (err: any) {
      this.error = 'Erro ao carregar veículos: ' + err.message;
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.veiculosFiltered = this.veiculos.filter(v => {
      const matchText = !q ||
        (v.placa || '').toLowerCase().includes(q) ||
        (v.modelo || '').toLowerCase().includes(q) ||
        (v.status || '').toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || v.status === this.statusFilter;
      return matchText && matchStatus;
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.veiculosFiltered = [...this.veiculos];
  }

  openCreateModal() {
    this.editingVeiculo = null;
    this.veiculoForm.reset({ placa: '', modelo: '', status: 'Disponível' });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  openEditModal(veiculo: Veiculo) {
    this.editingVeiculo = veiculo;
    this.veiculoForm.reset({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      status: veiculo.status
    });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingVeiculo = null;
  }

  async saveVeiculo() {
    if (this.veiculoForm.invalid) return;

    this.isSubmitting = true;
    this.error = null;
    this.success = null;
    try {
      const { placa, modelo, status } = this.veiculoForm.value;

      if (this.editingVeiculo) {
        const veiculoAtualizado = await this.veiculosService.updateVeiculo(this.editingVeiculo.id, {
          placa,
          modelo,
          status
        });
        this.veiculos = this.veiculos.map(v => v.id === veiculoAtualizado.id ? veiculoAtualizado : v);
        this.success = 'Veículo alterado com sucesso!';
      } else {
        const newVeiculo = await this.veiculosService.addVeiculo({ placa, modelo });
        this.veiculos = [newVeiculo, ...this.veiculos];
        this.success = 'Veículo cadastrado com sucesso!';
      }
      this.applyFilter();

      this.isModalOpen = false;
      this.editingVeiculo = null;
    } catch (err: any) {
      this.error = 'Erro ao salvar veículo: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteVeiculo(id: string) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;

    this.error = null;
    this.success = null;
    try {
      await this.veiculosService.deleteVeiculo(id);
      this.veiculos = this.veiculos.filter(v => v.id !== id);
      this.success = 'Veículo excluído com sucesso!';
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir veículo.';
    }
  }
}
