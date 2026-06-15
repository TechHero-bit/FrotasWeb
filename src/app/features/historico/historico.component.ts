import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoricoService, Jornada } from '../../core/services/historico.service';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, TableComponent, ModalComponent],
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

    <app-modal [(isOpen)]="isModalOpen" title="Detalhes da Jornada">
      @if (jornadaSelecionada) {
        <div class="jornada-details">
          <div class="mb-3">
            <strong>Motorista:</strong> {{ jornadaSelecionada.motorista_nome }}<br>
            <strong>Veículo:</strong> {{ jornadaSelecionada.veiculo_placa }}<br>
            <strong>Origem:</strong> {{ jornadaSelecionada.origem }}<br>
            <strong>Destino:</strong> {{ jornadaSelecionada.destino }}<br>
            <strong>Status:</strong> {{ jornadaSelecionada.status }}<br>
            <strong>Início:</strong> {{ jornadaSelecionada.hora_inicio ? (jornadaSelecionada.hora_inicio | date:'short') : 'N/A' }}<br>
            <strong>Fim:</strong> {{ jornadaSelecionada.hora_fim ? (jornadaSelecionada.hora_fim | date:'short') : 'N/A' }}
          </div>

          @if (jornadaSelecionada.checkins && jornadaSelecionada.checkins.length > 0) {
            <h4 class="mt-4 mb-3">Fotos de Check-in</h4>
            <div class="d-flex gap-3 images-container">
              @if (jornadaSelecionada.checkins[0].selfie_uri) {
                <div class="img-wrapper">
                  <p>Selfie do Motorista</p>
                  <img [src]="jornadaSelecionada.checkins[0].selfie_uri" alt="Selfie" class="preview-img">
                </div>
              }
              @if (jornadaSelecionada.checkins[0].foto_placa_uri) {
                <div class="img-wrapper">
                  <p>Foto da Placa</p>
                  <img [src]="jornadaSelecionada.checkins[0].foto_placa_uri" alt="Placa" class="preview-img">
                </div>
              }
            </div>
          } @else {
            <p class="text-muted mt-4">Nenhuma foto de check-in encontrada para esta jornada.</p>
          }

          @if (jornadaSelecionada.checkouts && jornadaSelecionada.checkouts.length > 0) {
            <h4 class="mt-4 mb-3">Detalhes de Check-out</h4>
            <div class="d-flex gap-3 images-container">
              @if (jornadaSelecionada.checkouts[0].selfie_uri) {
                <div class="img-wrapper">
                  <p>Selfie do Motorista</p>
                  <img [src]="jornadaSelecionada.checkouts[0].selfie_uri" alt="Selfie Checkout" class="preview-img">
                </div>
              }
              @if (jornadaSelecionada.checkouts[0].foto_veiculo_uri) {
                <div class="img-wrapper">
                  <p>Foto do Veículo</p>
                  <img [src]="jornadaSelecionada.checkouts[0].foto_veiculo_uri" alt="Veículo Checkout" class="preview-img">
                </div>
              }
            </div>
            @if (jornadaSelecionada.checkouts[0].observacoes) {
              <div class="mt-3">
                <strong>Observações do Motorista:</strong>
                <p style="background: var(--color-gray-100); padding: 0.5rem; border-radius: 4px;">
                  {{ jornadaSelecionada.checkouts[0].observacoes }}
                </p>
              </div>
            }
          }
        </div>
      }
      <div class="d-flex justify-content-end mt-4">
        <button type="button" class="btn btn-primary" (click)="isModalOpen = false">Fechar</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .images-container {
      flex-wrap: wrap;
    }
    .img-wrapper {
      flex: 1;
      min-width: 150px;
      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--color-text-secondary);
      }
    }
    .preview-img {
      width: 100%;
      max-width: 200px;
      height: auto;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      object-fit: cover;
    }
  `]
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
  
  isModalOpen = false;
  error: string | null = null;
  jornadaSelecionada: Jornada | null = null;

  constructor(
    private historicoService: HistoricoService,
    private datePipe: DatePipe
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
    this.jornadaSelecionada = jornada;
    this.isModalOpen = true;
  }
}
