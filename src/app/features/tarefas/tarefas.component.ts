import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TarefasService, Tarefa } from '../../core/services/tarefas.service';
import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
import { VeiculosService, Veiculo } from '../../core/services/veiculos.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-tarefas',
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
        <h2>Tarefas</h2>
        <p class="header-subtitle">{{ tarefasFiltered.length }} tarefa{{ tarefasFiltered.length !== 1 ? 's' : '' }} encontrada{{ tarefasFiltered.length !== 1 ? 's' : '' }}</p>
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
            placeholder="Buscar por título, motorista..."
            id="tarefas-search"
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
          <select class="status-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" id="tarefas-status-filter">
            <option value="">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Interrompido">Interrompido</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Nova Tarefa</button>
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

    @if ((searchQuery || statusFilter) && tarefasFiltered.length === 0) {
      <div class="empty-search">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <path d="M8 11h6"/>
        </svg>
        <p>Nenhuma tarefa encontrada para os filtros aplicados.</p>
        <button class="btn btn-outline" (click)="clearSearch()">Limpar filtros</button>
      </div>
    } @else {
    <app-table [data]="tarefasFiltered" [columns]="columns">
      <ng-template #actions let-row>
        <div class="actions-group">
          <button class="btn-icon btn-icon-info" type="button" title="Detalhes" aria-label="Detalhes" (click)="verDetalhes(row)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon btn-icon-edit" type="button" title="Editar tarefa" aria-label="Editar tarefa" (click)="openEditModal(row)">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h4l10-10-4-4L4 16v4Z"></path>
              <path d="M13 7l4 4"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-danger" type="button" title="Excluir tarefa" aria-label="Excluir tarefa" (click)="deleteTarefa(row.id)">
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
      <form [formGroup]="tarefaForm" (ngSubmit)="saveTarefa()">
        <div class="form-group">
          <label for="titulo">Título</label>
          <input id="titulo" type="text" formControlName="titulo" placeholder="EX: Entrega em São Paulo">
        </div>
        <div class="form-group">
          <label for="descricao">Descrição</label>
          <textarea id="descricao" formControlName="descricao" placeholder="Descreva os detalhes da tarefa..."></textarea>
        </div>
        <div class="form-group">
          <label for="localizacao">Localização</label>
          <input id="localizacao" type="text" formControlName="localizacao" placeholder="EX: Rua das Flores, 123">
        </div>
        <div class="form-group">
          <label for="veiculo_id">Veículo</label>
          <select id="veiculo_id" formControlName="veiculo_id">
            <option value="" disabled>Selecione um veículo</option>
            <option *ngFor="let v of veiculos" [value]="v.id">{{ v.placa }} - {{ v.modelo }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="atribuido_a">Motorista Atribuído</label>
          <select id="atribuido_a" formControlName="atribuido_a">
            <option value="" disabled>Selecione um motorista</option>
            <option *ngFor="let m of motoristas" [value]="m.id">{{ m.nome }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="data_limite">Data e Hora Limite</label>
          <input id="data_limite" type="datetime-local" formControlName="data_limite">
        </div>
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" formControlName="status">
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Interrompido">Interrompido</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>
        
        <div class="d-flex justify-content-between mt-4">
          <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="tarefaForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : (editingTarefa ? 'Salvar alterações' : 'Salvar') }}
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
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(185,28,28,0.08);
    }
    .d-flex {
      display: flex;
    }
    .justify-content-between {
      justify-content: space-between;
    }
    .mt-4 {
      margin-top: 1.5rem;
    }
    .mb-4 {
      margin-bottom: 1.5rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--color-primary);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-outline {
      background: transparent;
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
    }
    .btn-outline:hover {
      background: rgba(185,28,28,0.08);
    }
  `]
})
export class TarefasComponent implements OnInit {
  tarefas: Tarefa[] = [];
  tarefasFiltered: Tarefa[] = [];
  motoristas: Motorista[] = [];
  veiculos: Veiculo[] = [];
  searchQuery = '';
  statusFilter = '';
  columns: TableColumn[] = [
    { key: 'titulo', label: 'Título' },
    { key: 'status', label: 'Status' },
    { key: 'motorista_nome', label: 'Motorista' },
    { key: 'veiculo_placa', label: 'Veículo' },
    { key: 'data_limite', label: 'Data Limite', format: (value: any) => this.formatDateTime(value) }
  ];
  
  isModalOpen = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  editingTarefa: Tarefa | null = null;
  
  tarefaForm: FormGroup;

  constructor(
    private tarefasService: TarefasService,
    private motoristasService: MotoristasService,
    private veiculosService: VeiculosService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.tarefaForm = this.fb.group({
      titulo: ['', Validators.required],
      descricao: ['', Validators.required],
      localizacao: ['', Validators.required],
      veiculo_id: ['', Validators.required],
      atribuido_a: ['', Validators.required],
      data_limite: ['', Validators.required],
      status: ['Pendente', Validators.required]
    });
  }

  get modalTitle(): string {
    return this.editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa';
  }

  ngOnInit() {
    this.loadTarefas();
    this.loadMotoristas();
    this.loadVeiculos();
  }

  async loadTarefas() {
    try {
      this.error = null;
      this.tarefas = await this.tarefasService.getTarefas();
      this.tarefasFiltered = [...this.tarefas];
    } catch (err: any) {
      this.error = 'Erro ao carregar tarefas: ' + err.message;
    }
  }

  async loadMotoristas() {
    try {
      this.motoristas = await this.motoristasService.getMotoristas();
    } catch (err: any) {
      console.error('Erro ao carregar motoristas', err);
    }
  }

  async loadVeiculos() {
    try {
      this.veiculos = await this.veiculosService.getVeiculos();
    } catch (err: any) {
      console.error('Erro ao carregar veículos', err);
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.tarefasFiltered = this.tarefas.filter(t => {
      const matchText = !q ||
        (t.titulo || '').toLowerCase().includes(q) ||
        (t.motorista_nome || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || t.status === this.statusFilter;
      return matchText && matchStatus;
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.tarefasFiltered = [...this.tarefas];
  }

  openCreateModal() {
    this.editingTarefa = null;
    this.tarefaForm.reset({ 
      titulo: '', 
      descricao: '',
      localizacao: '',
      veiculo_id: '',
      atribuido_a: '',
      data_limite: '',
      status: 'Pendente'
    });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  openEditModal(tarefa: Tarefa) {
    this.editingTarefa = tarefa;
    this.tarefaForm.reset({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      localizacao: tarefa.localizacao,
      veiculo_id: tarefa.veiculo_id || '',
      atribuido_a: tarefa.atribuido_a,
      data_limite: tarefa.data_limite,
      status: tarefa.status
    });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingTarefa = null;
  }

  async saveTarefa() {
    if (this.tarefaForm.invalid) return;
    
    this.isSubmitting = true;
    this.error = null;
    this.success = null;
    try {
      if (this.editingTarefa) {
        const tarefaAtualizada = await this.tarefasService.updateTarefa(this.editingTarefa.id, this.tarefaForm.value);
        this.tarefas = this.tarefas.map(t => t.id === tarefaAtualizada.id ? tarefaAtualizada : t);
        this.success = 'Tarefa alterada com sucesso!';
      } else {
        const novaTarefa = await this.tarefasService.addTarefa(this.tarefaForm.value);
        this.tarefas = [...this.tarefas, novaTarefa];
        this.success = 'Tarefa cadastrada com sucesso!';
      }
      this.applyFilter();

      this.isModalOpen = false;
      this.editingTarefa = null;
    } catch (err: any) {
      this.error = 'Erro ao salvar tarefa: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteTarefa(id: string) {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    
    this.error = null;
    this.success = null;
    try {
      await this.tarefasService.deleteTarefa(id);
      this.tarefas = this.tarefas.filter(t => t.id !== id);
      this.tarefasFiltered = this.tarefasFiltered.filter(t => t.id !== id);
      this.success = 'Tarefa excluída com sucesso!';
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir tarefa.';
    }
  }

  formatDateTime(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const pad = (number: number) => String(number).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}/${month}/${year}-${hours}:${minutes}`;
  }

  verDetalhes(tarefa: Tarefa) {
    this.router.navigate(['/tarefas', tarefa.id]);
  }
}
