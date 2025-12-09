import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <h2>Sign in</h2>
        <p class="auth-card__subtitle">Use your admin credentials to access the UAM console.</p>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="auth-form">
          <label class="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
            />
          </label>

          <label class="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
            />
          </label>

          <div *ngIf="error()" class="auth-error">
            {{ error() }}
          </div>

          <button
            class="btn btn-primary auth-submit"
            type="submit"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-card__footer">
          Need a workspace?
          <button type="button" class="auth-link" (click)="goToRegister()">
            Register tenant admin
          </button>
        </p>
      </div>
    </section>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private redirectUrl: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.redirectUrl = params.get('redirect');
    });
  }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.redirectUrl) {
          window.location.href = this.redirectUrl;
        } else {
          this.router.navigate(['/roles']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Login failed. Check your credentials.');
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
