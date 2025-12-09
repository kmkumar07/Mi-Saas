import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_TENANT_ID } from './api.config';
import { storeAccessToken } from './auth.interceptor';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly isAuthenticated = signal<boolean>(false);

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          storeAccessToken(res.accessToken);
          this.isAuthenticated.set(true);
        }),
      );
  }

  registerUser(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    accountType?: 'individual' | 'company';
  }) {
    return this.http.post(`${API_BASE_URL}/api/users`, {
      tenantId: DEFAULT_TENANT_ID,
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      authProvider: 'local',
      accountType: payload.accountType ?? 'individual',
    });
  }

  logout() {
    storeAccessToken(null);
    this.isAuthenticated.set(false);
    return this.http.post(`${API_BASE_URL}/api/auth/logout`, {});
  }
}


