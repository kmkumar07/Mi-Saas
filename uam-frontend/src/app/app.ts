import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('uam-frontend');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Expose auth state signal to the template
  readonly isAuthenticated = this.auth.isAuthenticated;

  ngOnInit(): void {
    // On first load, check if there is a valid session (cookie/token) so
    // the logout button shows even if the user came via SSO/redirect.
    this.auth.initializeAuthState();
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Even if the backend call fails, clear local state and go to login
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
