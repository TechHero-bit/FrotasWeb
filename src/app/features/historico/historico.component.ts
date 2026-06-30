import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HistoricoService, Jornada } from '../../core/services/historico.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [DatePipe],
  template: `
    <div class="header d-flex justify-content-between align-items-center mb-4">
      <h2 style="margin: 0; color: var(--color-primary);">Histórico de Corridas</h2>
    </div>

    @if (error) {
      <div class="alert alert-danger mb-4" style="padding: 1rem; background: #f8d7da; color: #721c24; border-radius: 6px;">
        {{ error }}
      </div>
    }

    <app-table [data]="jornadas" [columns]="columns">
      <ng-template #actions let-row>
        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.85rem;" (click)="verDetalhes(row)">Detalhes</button>
      </ng-template>
    </app-table>
  `,
  styles: []
})
export class HistoricoComponent implements OnInit {
  jornadas: any[] = [];
  columns: TableColumn[] = [
    { key: 'motorista_nome', label: 'Motorista' },
    { key: 'veiculo_placa', label: 'Veículo' },
    { key: 'origem', label: 'Origem' },
    { key: 'destino', label: 'Destino' },
    { key: 'status', label: 'Status' },
    { key: 'data_formatada', label: 'Data' }
  ];
  
  error: string | null = null;

  constructor(
    private historicoService: HistoricoService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadJornadas();
  }

  async loadJornadas() {
    try {
      this.error = null;
      const data = await this.historicoService.getJornadas();
      this.jornadas = data.map(j => ({
        ...j,
        data_formatada: this.datePipe.transform(j.iniciado_em, 'shortDate')
      }));
    } catch (err: any) {
      this.error = 'Erro ao carregar histórico: ' + err.message;
    }
  }

  verDetalhes(jornada: Jornada) {
    this.router.navigate(['/historico', jornada.id]);
  }
}
