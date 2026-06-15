import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard-content">
      <h2>Dashboard</h2>
      <p>Base administrativa protegida por Supabase Auth e RBAC.</p>
    </div>
  `,
  styles: [`
    .dashboard-content h2 {
      margin-top: 0;
      color: var(--color-primary, #0056b3);
    }
  `]
})
export class DashboardComponent {}
