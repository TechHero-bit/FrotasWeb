import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'motorista/login',
    loadComponent: () =>
      import('./features/motorista-portal/login/motorista-login.component').then(
        (m) => m.MotoristaLoginComponent
      )
  },
  {
    path: 'motorista',
    loadComponent: () =>
      import('./features/motorista-portal/layout/motorista-layout.component').then(
        (m) => m.MotoristaLayoutComponent
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home'
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/motorista-portal/home/motorista-home.component').then(
            (m) => m.MotoristaHomeComponent
          )
      },
      {
        path: 'frota',
        loadComponent: () =>
          import('./features/motorista-portal/frota/motorista-frota.component').then(
            (m) => m.MotoristaFrotaComponent
          )
      },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./features/motorista-portal/tarefas/motorista-tarefas.component').then(
            (m) => m.MotoristaTarefasComponent
          )
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/motorista-portal/perfil/motorista-perfil.component').then(
            (m) => m.MotoristaPerfilComponent
          )
      },
      {
        path: 'checkin/:id',
        loadComponent: () =>
          import('./features/motorista-portal/checkin/checkin.component').then(
            (m) => m.CheckinComponent
          )
      },
      {
        path: 'jornada/:id',
        loadComponent: () =>
          import('./features/motorista-portal/jornada-ativa/jornada-ativa.component').then(
            (m) => m.JornadaAtivaComponent
          )
      },
      {
        path: 'jornada-ativa/:id',
        redirectTo: 'jornada/:id'
      },
      {
        path: 'checkout/:id',
        loadComponent: () =>
          import('./features/motorista-portal/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          )
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
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
        path: 'usuarios',
        loadComponent: () =>
          import('./features/motoristas/motoristas.component').then((m) => m.MotoristasComponent)
      },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./features/tarefas/tarefas.component').then((m) => m.TarefasComponent)
      },
      {
        path: 'tarefas/:id',
        loadComponent: () =>
          import('./features/tarefas/tarefas-detalhes.component').then(
            (m) => m.TarefasDetalhesComponent
          )
      },
      {
        path: 'historico',
        loadComponent: () =>
          import('./features/historico/historico.component').then((m) => m.HistoricoComponent)
      },
      {
        path: 'historico/:id',
        loadComponent: () =>
          import('./features/historico/historico-detalhes.component').then(
            (m) => m.HistoricoDetalhesComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
