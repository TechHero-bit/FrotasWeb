import { Injectable } from '@angular/core';
import {
  AuthError,
  createClient,
  Session,
  SupabaseClient,
  User
} from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

export const ADMIN_ROLE = 'adm' as const;

export interface UsuarioPerfil {
  id: string;
  nome: string | null;
  email: string | null;
  role: string;
}

export interface SessaoAdministrativa {
  session: Session;
  user: User;
  profile: UsuarioPerfil;
}

export class AdminAccessDeniedError extends Error {
  constructor() {
    super('Este painel e restrito a administradores.');
    this.name = 'AdminAccessDeniedError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async signInWithPassword(email: string, password: string): Promise<SessaoAdministrativa> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      throw this.normalizeAuthError(error);
    }

    if (!data.session || !data.user) {
      throw new Error('Nao foi possivel iniciar a sessao. Tente novamente.');
    }

    const profile = await this.getUserProfile(data.user.id);

    if (!this.isAdm(profile)) {
      await this.safeSignOut();
      throw new AdminAccessDeniedError();
    }

    return {
      session: data.session,
      user: data.user,
      profile
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async getCurrentAdminSession(): Promise<SessaoAdministrativa | null> {
    const session = await this.getCurrentSession();

    if (!session?.user) {
      return null;
    }

    const profile = await this.getUserProfile(session.user.id);

    if (!this.isAdm(profile)) {
      await this.safeSignOut();
      throw new AdminAccessDeniedError();
    }

    return {
      session,
      user: session.user,
      profile
    };
  }

  async getUserProfile(userId: string): Promise<UsuarioPerfil> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nome, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error('Nao foi possivel validar o perfil do usuario.');
    }

    return data as UsuarioPerfil;
  }

  private isAdm(profile: UsuarioPerfil | null): profile is UsuarioPerfil {
    return profile?.role === ADMIN_ROLE;
  }

  private normalizeAuthError(error: AuthError): Error {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return new Error('E-mail ou senha invalidos.');
    }

    return error;
  }

  private async safeSignOut(): Promise<void> {
    try {
      await this.signOut();
    } catch {
      await this.supabase.auth.signOut({ scope: 'local' });
    }
  }
}
