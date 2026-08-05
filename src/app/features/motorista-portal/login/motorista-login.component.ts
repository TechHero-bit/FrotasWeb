import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-motorista-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './motorista-login.component.html',
  styleUrl: './motorista-login.component.scss'
})
export class MotoristaLoginComponent {
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly supabaseService: SupabaseService
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fieldHasError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();

    try {
      // Sign in driver
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await this.router.navigateByUrl('/motorista/home');
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Não foi possível fazer login. Verifique suas credenciais.';
    } finally {
      this.loading = false;
    }
  }
}
