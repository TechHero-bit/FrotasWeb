import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VeiculosService, Veiculo } from '../../core/services/veiculos.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableComponent, ModalComponent],
  template: `
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Veículos</h2>
      <button class="btn btn-primary" (click)="openModal()">+ Novo Veículo</button>
    </div>

    @if (error) {
      <div class="alert alert-danger mb-4" style="padding: 1rem; background: #f8d7da; color: #721c24; border-radius: 6px;">
        {{ error }}
      </div>
    }

    <app-table [data]="veiculos" [columns]="columns">
      <ng-template #actions let-row>
        <button class="btn btn-outline btn-danger" style="padding: 4px 8px; font-size: 0.85rem;" (click)="deleteVeiculo(row.id)">Excluir</button>
      </ng-template>
    </app-table>

    <app-modal [(isOpen)]="isModalOpen" title="Novo Veículo">
      <form [formGroup]="veiculoForm" (ngSubmit)="saveVeiculo()">
        <div class="form-group">
          <label for="placa">Placa</label>
          <input id="placa" type="text" formControlName="placa" placeholder="EX: ABC-1234">
        </div>
        <div class="form-group">
          <label for="modelo">Modelo</label>
          <input id="modelo" type="text" formControlName="modelo" placeholder="EX: Fiat Uno">
        </div>
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" formControlName="status">
            <option value="Disponível">Disponível</option>
            <option value="Em rota">Em rota</option>
            <option value="Manutenção">Manutenção</option>
          </select>
        </div>
        
        <div class="d-flex justify-content-between mt-4">
          <button type="button" class="btn btn-outline" (click)="isModalOpen = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="veiculoForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
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

  openModal() {
    this.veiculoForm.reset({ status: 'Disponível' });
    this.isModalOpen = true;
    this.error = null;
  }

  async saveVeiculo() {
    if (this.veiculoForm.invalid) return;
    
    this.isSubmitting = true;
    this.error = null;
    try {
      const newVeiculo = await this.veiculosService.addVeiculo(this.veiculoForm.value);
      this.veiculos = [newVeiculo, ...this.veiculos];
      this.isModalOpen = false;
    } catch (err: any) {
      this.error = 'Erro ao salvar veículo: ' + err.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteVeiculo(id: string) {
    if (!confirm('Deseja realmente excluir este veículo?')) return;
    
    this.error = null;
    try {
      await this.veiculosService.deleteVeiculo(id);
      this.veiculos = this.veiculos.filter(v => v.id !== id);
    } catch (err: any) {
      this.error = err.message || 'Erro ao excluir veículo.';
    }
  }
}
