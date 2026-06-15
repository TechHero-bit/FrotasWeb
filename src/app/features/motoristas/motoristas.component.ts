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
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Usuários</h2>
      <button class="btn btn-primary" (click)="openCreateModal()">+ Novo Usuário</button>
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

    <app-table [data]="motoristas" [columns]="columns">
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
        
        <div class="d-flex justify-content-between mt-4">
          <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="motoristaForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : (editingMotorista ? 'Salvar alterações' : 'Salvar') }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class MotoristasComponent implements OnInit {
  motoristas: Motorista[] = [];
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
      telefone: ['', Validators.required]
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
    } catch (err: any) {
      this.error = 'Erro ao carregar usuários: ' + err.message;
    }
  }

  openCreateModal() {
    this.editingMotorista = null;
    this.motoristaForm.reset({ nome: '', email: '', telefone: '' });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  openEditModal(motorista: Motorista) {
    this.editingMotorista = motorista;
    this.motoristaForm.reset({
      nome: motorista.nome,
      email: motorista.email,
      telefone: motorista.telefone
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
