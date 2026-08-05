import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { TarefasService, Tarefa } from '../../../core/services/tarefas.service';

@Component({
  selector: 'app-motorista-tarefas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './motorista-tarefas.component.html',
  styleUrl: './motorista-tarefas.component.scss'
})
export class MotoristaTarefasComponent implements OnInit {
  activeTab: 'pendentes' | 'concluidas' = 'pendentes';
  loading = true;
  tasks: Tarefa[] = [];

  constructor(private readonly tarefasService: TarefasService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTarefas();
  }

  get currentTasks(): Tarefa[] {
    return this.tasks.filter(t =>
      this.activeTab === 'pendentes'
        ? t.status !== 'Concluída'
        : t.status === 'Concluída'
    );
  }

  get countPendentes(): number {
    return this.tasks.filter(t => t.status !== 'Concluída').length;
  }

  get countConcluidas(): number {
    return this.tasks.filter(t => t.status === 'Concluída').length;
  }

  isConcluida(task: Tarefa): boolean {
    return task.status === 'Concluída';
  }

  getPrioridadeClass(status: string): string {
    switch (status) {
      case 'Pendente': return 'alta';
      case 'Em andamento': return 'media';
      case 'Concluída': return 'normal';
      default: return 'media';
    }
  }

  getTaskIcon(status: string): string {
    switch (status) {
      case 'Pendente': return 'fact_check';
      case 'Em andamento': return 'local_shipping';
      case 'Concluída': return 'check_circle';
      default: return 'assignment';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Hoje às ${time}`;
      if (isYesterday) return `Ontem às ${time}`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ` às ${time}`;
    } catch {
      return dateStr;
    }
  }

  async concluirTarefa(task: Tarefa): Promise<void> {
    try {
      await this.tarefasService.updateTarefa(task.id, {
        titulo: task.titulo,
        descricao: task.descricao,
        status: 'Concluída',
        localizacao: task.localizacao,
        veiculo_id: task.veiculo_id,
        atribuido_a: task.atribuido_a,
        data_limite: task.data_limite
      });
      task.status = 'Concluída';
    } catch {
      alert('Erro ao concluir tarefa. Tente novamente.');
    }
  }

  registrarOcorrencia(task: Tarefa): void {
    alert(`Registrar ocorrência para a tarefa #${task.id}`);
  }

  private async loadTarefas(): Promise<void> {
    this.loading = true;
    try {
      this.tasks = await this.tarefasService.getTarefas();
    } catch {
      this.tasks = [];
    } finally {
      this.loading = false;
    }
  }
}
