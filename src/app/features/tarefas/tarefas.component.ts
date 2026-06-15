import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TarefasService, Tarefa } from '../../core/services/tarefas.service';
import { MotoristasService, Motorista } from '../../core/services/motoristas.service';
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
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Tarefas</h2>
      <button class="btn btn-primary" (click)="openCreateModal()">+ Nova Tarefa</button>
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

    <app-table [data]="tarefas" [columns]="columns">
      <ng-template #actions let-row>
        <div class="actions-group">
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

    <app-modal [(isOpen)]="isModalOpen" [title]="modalTitle">
      <form [formGroup]="tarefaForm" (ngSubmit)="saveTarefa()">
        <div class="form-group">
          <label for="titulo">Título</label>
          <input id="titulo" type="text" formControlName="titulo" placeholder="EX: Entrega em São Paulo">
        </div>
        <div class="form-group">
          <label for="usuario_id">Motorista Atribuído</label>
          <select id="usuario_id" formControlName="usuario_id">
            <option value="" disabled>Selecione um motorista</option>
            <option *ngFor="let m of motoristas" [value]="m.id">{{ m.nome }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="data_limite">Data Limite</label>
          <input id="data_limite" type="date" formControlName="data_limite">
        </div>
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" formControlName="status">
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
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
  `
})
export class TarefasComponent implements OnInit {
  tarefas: Tarefa[] = [];
  motoristas: Motorista[] = [];
  columns: TableColumn[] = [
    { key: 'titulo', label: 'Título' },
    { key: 'status', label: 'Status' },
    { key: 'motorista_nome', label: 'Motorista' },
    { key: 'data_limite', label: 'Data Limite' }
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
    private fb: FormBuilder
  ) {
    this.tarefaForm = this.fb.group({
      titulo: ['', Validators.required],
      status: ['Pendente', Validators.required],
      data_limite: ['', Validators.required],
      usuario_id: ['', Validators.required]
    });
  }

  get modalTitle(): string {
    return this.editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa';
  }

  ngOnInit() {
    this.loadTarefas();
    this.loadMotoristas();
  }

  async loadTarefas() {
    try {
      this.error = null;
      this.tarefas = await this.tarefasService.getTarefas();
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

  openCreateModal() {
    this.editingTarefa = null;
    this.tarefaForm.reset({ titulo: '', status: 'Pendente', data_limite: '', usuario_id: '' });
    this.isModalOpen = true;
    this.error = null;
    this.success = null;
  }

  openEditModal(tarefa: Tarefa) {
    this.editingTarefa = tarefa;
    this.tarefaForm.reset({
      titulo: tarefa.titulo,
      status: tarefa.status,
      data_limite: tarefa.data_limite,
      usuario_id: tarefa.usuario_id
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
      this.success = 'Tarefa excluída com sucesso!';
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir tarefa.';
    }
  }
}
