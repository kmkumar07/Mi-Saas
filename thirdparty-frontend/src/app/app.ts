import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);

  protected title = 'thirdparty-frontend';

  protected email = '';
  protected password = '';
  protected loginLoading = false;
  protected loginError: string | null = null;
  protected logoutLoading = false;

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  ngOnInit(): void {
    this.auth.initializeAuthState();
  }

  protected onLoginSubmit(): void {
    if (!this.email || !this.password || this.loginLoading) {
      return;
    }

    this.loginLoading = true;
    this.loginError = null;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loginLoading = false;
        this.password = '';
      },
      error: (err) => {
        this.loginLoading = false;
        this.loginError =
          err?.error?.message ?? 'Login failed. Please check your credentials and try again.';
      },
    });
  }

  protected onLogout(): void {
    if (this.logoutLoading) {
      return;
    }

    this.logoutLoading = true;

    this.auth.logout().subscribe({
      next: () => {
        this.logoutLoading = false;
      },
      error: () => {
        // Even if the backend call fails, we've already cleared local state.
        this.logoutLoading = false;
      },
    });
  }
}


