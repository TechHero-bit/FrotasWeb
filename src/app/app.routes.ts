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
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
