import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  AdminAccessDeniedError,
  SupabaseService
} from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  errorMessage = this.getInitialErrorMessage();
  isRoleError = this.route.snapshot.queryParamMap.get('reason') === 'restricted';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supabaseService: SupabaseService
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.isRoleError = false;

    const { email, password } = this.form.getRawValue();

    try {
      await this.supabaseService.signInWithPassword(email, password);
      await this.router.navigateByUrl(this.getReturnUrl());
    } catch (error) {
      this.isRoleError = error instanceof AdminAccessDeniedError;
      this.errorMessage = this.isRoleError
        ? 'Este painel e restrito a administradores. Use uma conta com permissao adm.'
        : this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  fieldHasError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/dashboard';
  }

  private getInitialErrorMessage(): string {
    return this.route.snapshot.queryParamMap.get('reason') === 'restricted'
      ? 'Sessao encerrada: o painel Web e restrito a administradores.'
      : '';
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Nao foi possivel entrar. Verifique suas credenciais.';
  }
}
