import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { UAM_API_BASE_URL } from './uam-api.config';

const ACCESS_TOKEN_KEY = 'uam_access_token';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly isAuthenticated = signal<boolean>(false);

  initializeAuthState() {
    this.http
      .get(`${UAM_API_BASE_URL}/api/auth/me`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.isAuthenticated.set(true);
        },
        error: () => {
          this.isAuthenticated.set(false);
        },
      });
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${UAM_API_BASE_URL}/api/auth/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((res) => {
          this.storeAccessToken(res.accessToken);
          this.isAuthenticated.set(true);
        }),
      );
  }

  logout() {
    this.storeAccessToken(null);
    this.isAuthenticated.set(false);

    return this.http.post(
      `${UAM_API_BASE_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  private storeAccessToken(token: string | null): void {
    if (!token) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  }
}



