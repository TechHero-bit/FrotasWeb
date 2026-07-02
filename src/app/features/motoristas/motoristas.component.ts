import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-motoristas',
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
        <h2>Usuários</h2>
        <p class="header-subtitle">{{ motoristasFiltered.length }} usuário{{ motoristasFiltered.length !== 1 ? 's' : '' }} encontrado{{ motoristasFiltered.length !== 1 ? 's' : '' }}</p>
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
            placeholder="Buscar por nome, email, telefone..."
            id="usuarios-search"
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
        <button class="btn btn-primary" (click)="openCreateModal()">+ Novo Usuário</button>
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

    @if (searchQuery && motoristasFiltered.length === 0) {
      <div class="empty-search">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <path d="M8 11h6"/>
        </svg>
        <p>Nenhum usuário encontrado para <strong>"{{ searchQuery }}"</strong></p>
        <button class="btn btn-outline" (click)="clearSearch()">Limpar busca</button>
      </div>
    } @else {
    <app-table [data]="motoristasFiltered" [columns]="columns">
      <ng-template #actions let-row>
        <div class="actions-group">
          <button class="btn-icon btn-icon-edit" type="button" title="Editar usuário" aria-label="Editar usuário" (click)="openEditModal(row)">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h4l10-10-4-4L4 16v4Z"></path>
              <path d="M13 7l4 4"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-danger" type="button" title="Excluir usuário" aria-label="Excluir usuário" (click)="deleteMotorista(row.id)">
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
      <form [formGroup]="motoristaForm" (ngSubmit)="saveMotorista()">
        <div class="form-group">
          <label for="nome">Nome Completo</label>
          <input id="nome" type="text" formControlName="nome" placeholder="EX: João Silva">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" placeholder="EX: joao@email.com">
        </div>
        <div class="form-group">
          <label for="telefone">Telefone</label>
          <input id="telefone" type="text" formControlName="telefone" placeholder="EX: (11) 99999-9999">
        </div>
        <div class="form-group">
          <label for="role">Cargo</label>
          <select id="role" formControlName="role" class="form-select">
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        
        <div class="d-flex justify-content-between mt-4">
          <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="motoristaForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : (editingMotorista ? 'Salvar alterações' : 'Salvar') }}
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
      min-width: 260px;
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
    .empty-search strong { color: var(--color-gray-800, #1f2937); }
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
export class MotoristasComponent implements OnInit {
  motoristas: Motorista[] = [];
  motoristasFiltered: Motorista[] = [];
  searchQuery = '';
  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'role', label: 'Cargo' }
  ];
  
  isModalOpen = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  editingMotorista: Motorista | null = null;
  
  motoristaForm: FormGroup;

  constructor(
    private motoristasService: MotoristasService,
    private fb: FormBuilder
  ) {
    this.motoristaForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      role: ['driver', Validators.required]
    });
  }

  get modalTitle(): string {
    return this.editingMotorista ? 'Editar Usuário' : 'Novo Usuário';
  }

  ngOnInit() {
    this.loadMotoristas();
  }

  async loadMotoristas() {
    try {
      this.error = null;
      this.motoristas = await this.motoristasService.getMotoristas();
      this.motoristasFiltered = [...this.motoristas];
    } catch (err: any) {
      this.error = 'Erro ao carregar usuários: ' + err.message;
    }
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.motoristasFiltered = [...this.motoristas];
      return;
    }
    this.motoristasFiltered = this.motoristas.filter(m =>
      (m.nome || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.telefone || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.motoristasFiltered = [...this.motoristas];
  }

  openCreateModal() {
    this.editingMotorista = null;
    this.motoristaForm.reset({ nome: '', email: '', telefone: '', role: 'driver' });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  openEditModal(motorista: Motorista) {
    this.editingMotorista = motorista;
    this.motoristaForm.reset({
      nome: motorista.nome,
      email: motorista.email,
      telefone: motorista.telefone,
      role: motorista.role || 'driver'
    });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingMotorista = null;
  }

  async saveMotorista() {
    if (this.motoristaForm.invalid) return;
    
    this.isSubmitting = true;
    this.error = null;
    this.success = null;
    try {
      if (this.editingMotorista) {
        const motoristaAtualizado = await this.motoristasService.updateMotorista(this.editingMotorista.id, this.motoristaForm.value);
        this.motoristas = this.motoristas.map(m => m.id === motoristaAtualizado.id ? motoristaAtualizado : m);
        this.success = 'Usuário alterado com sucesso!';
      } else {
        const newMotorista = await this.motoristasService.addMotorista(this.motoristaForm.value);
        this.motoristas = [newMotorista, ...this.motoristas];
        this.success = 'Usuário cadastrado com sucesso!';
      }
      this.applyFilter();

      this.isModalOpen = false;
      this.editingMotorista = null;
    } catch (err: any) {
      this.error = 'Erro ao salvar usuário: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteMotorista(id: string) {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    
    this.error = null;
    this.success = null;
    try {
      await this.motoristasService.deleteMotorista(id);
      this.motoristas = this.motoristas.filter(m => m.id !== id);
      this.success = 'Usuário excluído com sucesso!';
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir usuário.';
    }
  }
}
