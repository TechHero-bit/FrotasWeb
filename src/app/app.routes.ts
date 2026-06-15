import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'veiculos',
        loadComponent: () =>
          import('./features/veiculos/veiculos.component').then((m) => m.VeiculosComponent)
      },
      {
        path: 'motoristas',
        loadComponent: () =>
          import('./features/motoristas/motoristas.component').then((m) => m.MotoristasComponent)
      },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./features/tarefas/tarefas.component').then((m) => m.TarefasComponent)
      },
      {
        path: 'historico',
        loadComponent: () =>
          import('./features/historico/historico.component').then((m) => m.HistoricoComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
