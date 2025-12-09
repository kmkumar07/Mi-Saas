import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL, DEFAULT_TENANT_ID } from './api.config';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  listUsers() {
    return this.http.get<User[]>(`${API_BASE_URL}/api/users`);
  }

  // Simple activation toggle using update-user planned API; for now we can call create user / not used.
  activateUser(userId: string) {
    // Placeholder – when backend exposes activation, wire it here.
    return this.http.post<void>(`${API_BASE_URL}/api/users/${userId}/activate`, {});
  }

  createUser(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    accountType?: 'individual' | 'company';
  }) {
    return this.http.post<User>(`${API_BASE_URL}/api/users`, {
      tenantId: DEFAULT_TENANT_ID,
      authProvider: 'local',
      ...payload,
    });
  }
}


