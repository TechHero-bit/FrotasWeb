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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableComponent, ModalComponent],
  template: `
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Tarefas</h2>
      <button class="btn btn-primary" (click)="openModal()">+ Nova Tarefa</button>
    </div>

    @if (error) {
      <div class="alert alert-danger mb-4" style="padding: 1rem; background: #f8d7da; color: #721c24; border-radius: 6px;">
        {{ error }}
      </div>
    }

    <app-table [data]="tarefas" [columns]="columns">
      <ng-template #actions let-row>
        <button class="btn btn-outline btn-danger" style="padding: 4px 8px; font-size: 0.85rem;" (click)="deleteTarefa(row.id)">Excluir</button>
      </ng-template>
    </app-table>

    <app-modal [(isOpen)]="isModalOpen" title="Nova Tarefa">
      <form [formGroup]="tarefaForm" (ngSubmit)="saveTarefa()">
        <div class="form-group">
          <label for="titulo">Título</label>
          <input id="titulo" type="text" formControlName="titulo" placeholder="EX: Entrega em São Paulo">
        </div>
        <div class="form-group">
          <label for="usuario_id">Motorista Atribuído</label>
          <select id="usuario_id" formControlName="usuario_id">
            <option value="" disabled selected>Selecione um motorista</option>
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
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="tarefaForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
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

  openModal() {
    this.tarefaForm.reset({ status: 'Pendente', usuario_id: '' });
    this.isModalOpen = true;
    this.error = null;
  }

  async saveTarefa() {
    if (this.tarefaForm.invalid) return;
    
    this.isSubmitting = true;
    this.error = null;
    try {
      const novaTarefa = await this.tarefasService.addTarefa(this.tarefaForm.value);
      this.tarefas = [...this.tarefas, novaTarefa];
      this.isModalOpen = false;
    } catch (err: any) {
      this.error = 'Erro ao salvar tarefa: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteTarefa(id: string) {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    
    this.error = null;
    try {
      await this.tarefasService.deleteTarefa(id);
      this.tarefas = this.tarefas.filter(t => t.id !== id);
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir tarefa.';
    }
  }
}
