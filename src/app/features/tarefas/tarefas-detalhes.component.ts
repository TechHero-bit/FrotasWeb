import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TarefasService, Tarefa } from '../../core/services/tarefas.service';

@Component({
  selector: 'app-tarefas-detalhes',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header d-flex align-items-center gap-3 mb-4">
      <button class="btn btn-outline btn-icon" (click)="voltar()" title="Voltar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <h2 style="margin: 0; color: var(--color-primary);">Detalhes da Tarefa</h2>
    </div>

    @if (loading) {
      <div class="text-center mt-5 text-muted">
        Carregando detalhes...
      </div>
    } @else if (error) {
      <div class="alert alert-danger">{{ error }}</div>
    } @else if (tarefa) {
      <div class="details-grid">
        <div class="info-card mb-4" style="grid-column: 1 / -1;">
          <div class="card-header">
            <h3>Visão Geral</h3>
            <span class="status-badge" [ngClass]="getStatusBadgeClass(tarefa.status)">{{ tarefa.status }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <div class="info-group">
                <span class="label">Título</span>
                <span class="value">{{ tarefa.titulo }}</span>
              </div>
              <div class="info-group">
                <span class="label">Data Limite</span>
                <span class="value">{{ tarefa.data_limite ? (tarefa.data_limite | date:'short') : 'Não informada' }}</span>
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-group" style="flex: 1 1 100%;">
                <span class="label">Descrição</span>
                <p class="desc-text">{{ tarefa.descricao || 'Nenhuma descrição fornecida.' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-header">
            <h3>Localização e Veículo</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <div class="info-group">
                <span class="label">Localização</span>
                <span class="value">{{ tarefa.localizacao || 'Não informada' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-group">
                <span class="label">Veículo Designado</span>
                <span class="value">{{ tarefa.veiculo_placa || 'Sem veículo' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-header">
            <h3>Motorista</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <div class="info-group">
                <span class="label">Atribuído a</span>
                <span class="value">{{ tarefa.motorista_nome || 'Não atribuído' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./tarefas-detalhes.component.scss']
})
export class TarefasDetalhesComponent implements OnInit {
  tarefa: Tarefa | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private tarefasService: TarefasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadTarefaDetails(id);
      } else {
        this.error = 'ID da tarefa não fornecido.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async loadTarefaDetails(id: string) {
    try {
      this.loading = true;
      this.cdr.detectChanges();
      const tarefas = await this.tarefasService.getTarefas();
      const tarefa = tarefas.find(t => t.id.toString() === id.toString());
      
      if (tarefa) {
        this.tarefa = tarefa;
      } else {
        this.error = 'Tarefa não encontrada.';
      }
    } catch (err: any) {
      this.error = 'Erro ao carregar detalhes: ' + err.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  voltar() {
    this.location.back();
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s === 'pendente' || s === 'nao iniciada') return 'badge-pending';
    if (s === 'em andamento' || s === 'andamento') return 'badge-progress';
    if (s === 'interrompido') return 'badge-interrupted';
    return 'badge-done';
  }
}
