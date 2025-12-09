import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
            <span>{{ accountType === 'company' ? 'Company name' : 'Workspace name' }}</span>
            <input
              type="text"
              name="tenantName"
              [(ngModel)]="tenantName"
              required
            />
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
  private readonly route = inject(ActivatedRoute);

  accountType: AccountType = 'company';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  tenantName = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private redirectUrl: string | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.redirectUrl = params.get('redirect');
    });
  }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .registerTenant({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
        accountType: this.accountType,
        companyName: this.accountType === 'company' ? this.tenantName : undefined,
        workspaceName: this.accountType === 'individual' ? this.tenantName : undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          if (this.redirectUrl) {
            this.router.navigate(['/auth/login'], {
              queryParams: { redirect: this.redirectUrl },
            });
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
        },
      });
  }

  goToLogin() {
    if (this.redirectUrl) {
      this.router.navigate(['/auth/login'], {
        queryParams: { redirect: this.redirectUrl },
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}


