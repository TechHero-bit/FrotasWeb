import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VeiculosService, Veiculo } from '../../../core/services/veiculos.service';

@Component({
  selector: 'app-motorista-frota',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './motorista-frota.component.html',
  styleUrl: './motorista-frota.component.scss'
})
export class MotoristaFrotaComponent implements OnInit {
  selectedFilter = 'todos';
  loading = true;
  vehicles: Veiculo[] = [];

  constructor(private readonly veiculosService: VeiculosService) {}

  async ngOnInit(): Promise<void> {
    await this.loadVeiculos();
  }

  get filters() {
    return [
      { id: 'todos', label: 'Todos', count: this.vehicles.length },
      { id: 'disponivel', label: 'Disponíveis', count: this.vehicles.filter(v => v.status === 'Disponível').length },
      { id: 'operacao', label: 'Em Rota', count: this.vehicles.filter(v => v.status === 'Em rota').length },
      { id: 'manutencao', label: 'Manutenção', count: this.vehicles.filter(v => v.status === 'Manutenção').length }
    ];
  }

  get filteredVehicles(): Veiculo[] {
    if (this.selectedFilter === 'todos') return this.vehicles;
    if (this.selectedFilter === 'disponivel') return this.vehicles.filter(v => v.status === 'Disponível');
    if (this.selectedFilter === 'operacao') return this.vehicles.filter(v => v.status === 'Em rota');
    if (this.selectedFilter === 'manutencao') return this.vehicles.filter(v => v.status === 'Manutenção');
    return this.vehicles;
  }

  setFilter(filterId: string): void {
    this.selectedFilter = filterId;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Em rota': return 'status-operacao';
      case 'Disponível': return 'status-disponivel';
      case 'Manutenção': return 'status-manutencao';
      default: return '';
    }
  }

  private async loadVeiculos(): Promise<void> {
    this.loading = true;
    try {
      this.vehicles = await this.veiculosService.getVeiculos();
    } catch {
      this.vehicles = [];
    } finally {
      this.loading = false;
    }
  }
}
