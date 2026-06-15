import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="dashboard-shell">
      <nav class="dashboard-nav" aria-label="Navegacao principal">
        <h1>Frotas Web</h1>
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/veiculos" routerLinkActive="active">Veiculos</a>
        <a routerLink="/motoristas" routerLinkActive="active">Motoristas</a>
      </nav>

      <main class="dashboard-content">
        <h2>Dashboard</h2>
        <p>Base administrativa protegida por Supabase Auth e RBAC.</p>
      </main>
    </section>
  `,
  styles: [`
    .dashboard-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .dashboard-nav h1 {
      margin: 0 0 var(--space-6);
      font-size: 1.25rem;
    }

    .dashboard-nav a {
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      color: var(--text-on-dark-muted);
      text-decoration: none;
    }

    .dashboard-nav a.active,
    .dashboard-nav a:hover {
      background: var(--color-primary);
      color: var(--color-white);
    }

    .dashboard-content h2 {
      margin-top: 0;
    }
  `]
})
export class DashboardComponent {}
