import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

type AccountType = 'individual' | 'company';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card auth-card--wide">
        <h2>Register tenant admin</h2>
        <p class="auth-card__subtitle">
          Create the first admin user for your tenant. You can invite employees later.
        </p>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="auth-form auth-form--grid">
          <fieldset class="account-type">
            <legend>Account type</legend>
            <label>
              <input
                type="radio"
                name="accountType"
                value="individual"
                [(ngModel)]="accountType"
                required
              />
              Individual
            </label>
            <label>
              <input
                type="radio"
                name="accountType"
                value="company"
                [(ngModel)]="accountType"
              />
              Company
            </label>
          </fieldset>

          <label class="auth-field">
            <span>First name</span>
            <input type="text" name="firstName" [(ngModel)]="firstName" />
          </label>

          <label class="auth-field">
            <span>Last name</span>
            <input type="text" name="lastName" [(ngModel)]="lastName" />
          </label>

          <label class="auth-field auth-field--full">
            <span>Email</span>
            <input type="email" name="email" [(ngModel)]="email" required />
          </label>

          <label class="auth-field auth-field--full">
            <span>Password</span>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="8"
            />
          </label>

          <div *ngIf="error()" class="auth-error auth-field--full">
            {{ error() }}
          </div>

          <div class="auth-actions auth-field--full">
            <button
              class="btn btn-secondary"
              type="button"
              (click)="goToLogin()"
            >
              Back to login
            </button>
            <button
              class="btn btn-primary"
              type="submit"
              [disabled]="form.invalid || loading()"
            >
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  accountType: AccountType = 'company';
  firstName = '';
  lastName = '';
  email = '';
  password = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .registerUser({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
        accountType: this.accountType,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}


