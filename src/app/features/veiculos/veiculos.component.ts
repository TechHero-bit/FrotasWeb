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
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Veículos</h2>
      <button class="btn btn-primary" (click)="openCreateModal()">+ Novo Veículo</button>
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

    <app-table [data]="veiculos" [columns]="columns">
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
  `
})
export class VeiculosComponent implements OnInit {
  veiculos: Veiculo[] = [];
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
    } catch (err: any) {
      this.error = 'Erro ao carregar veículos: ' + err.message;
    }
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
