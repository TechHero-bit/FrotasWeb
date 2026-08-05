import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SupabaseService, UsuarioPerfil } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-motorista-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './motorista-perfil.component.html',
  styleUrl: './motorista-perfil.component.scss'
})
export class MotoristaPerfilComponent implements OnInit {
  loading = true;
  profile: UsuarioPerfil | null = null;
  email = '';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      const session = await this.supabaseService.getCurrentSession();
      if (session?.user) {
        this.email = session.user.email ?? '';
        this.profile = await this.supabaseService.getUserProfile(session.user.id);
      }
    } catch {
      // silent
    } finally {
      this.loading = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.signOut();
    } catch {
      // Ignorar erros locais
    } finally {
      await this.router.navigateByUrl('/motorista/login');
    }
  }
}
