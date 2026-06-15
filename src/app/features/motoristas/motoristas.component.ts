import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-motoristas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableComponent, ModalComponent],
  template: `
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Motoristas</h2>
      <button class="btn btn-primary" (click)="openModal()">+ Novo Motorista</button>
    </div>

    @if (error) {
      <div class="alert alert-danger mb-4" style="padding: 1rem; background: #f8d7da; color: #721c24; border-radius: 6px;">
        {{ error }}
      </div>
    }

    <app-table [data]="motoristas" [columns]="columns">
      <ng-template #actions let-row>
        <button class="btn btn-outline btn-danger" style="padding: 4px 8px; font-size: 0.85rem;" (click)="deleteMotorista(row.id)">Excluir</button>
      </ng-template>
    </app-table>

    <app-modal [(isOpen)]="isModalOpen" title="Novo Motorista">
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
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="motoristaForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
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

  ngOnInit() {
    this.loadMotoristas();
  }

  async loadMotoristas() {
    try {
      this.error = null;
      this.motoristas = await this.motoristasService.getMotoristas();
    } catch (err: any) {
      this.error = 'Erro ao carregar motoristas: ' + err.message;
    }
  }

  openModal() {
    this.motoristaForm.reset();
    this.isModalOpen = true;
    this.error = null;
  }

  async saveMotorista() {
    if (this.motoristaForm.invalid) return;
    
    this.isSubmitting = true;
    this.error = null;
    try {
      const newMotorista = await this.motoristasService.addMotorista(this.motoristaForm.value);
      this.motoristas = [newMotorista, ...this.motoristas];
      this.isModalOpen = false;
    } catch (err: any) {
      this.error = 'Erro ao salvar motorista: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteMotorista(id: string) {
    if (!confirm('Deseja realmente excluir este motorista?')) return;
    
    this.error = null;
    try {
      await this.motoristasService.deleteMotorista(id);
      this.motoristas = this.motoristas.filter(m => m.id !== id);
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir motorista.';
    }
  }
}
