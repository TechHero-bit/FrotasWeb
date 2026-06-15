import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>Frotas Web</h1>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active">
            <span class="icon">📊</span> Dashboard
          </a>
          <a routerLink="/veiculos" routerLinkActive="active">
            <span class="icon">🚚</span> Veículos
          </a>
          <a routerLink="/motoristas" routerLinkActive="active">
            <span class="icon">🧑‍✈️</span> Motoristas
          </a>
          <a routerLink="/tarefas" routerLinkActive="active">
            <span class="icon">📋</span> Tarefas
          </a>
          <a routerLink="/historico" routerLinkActive="active">
            <span class="icon">🕰️</span> Histórico
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-outline" (click)="logout()">Sair</button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
