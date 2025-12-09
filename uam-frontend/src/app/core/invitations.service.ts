import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';

export interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  roleIds: string[];
  createdAt: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private readonly http = inject(HttpClient);

  listInvitations() {
    return this.http.get<Invitation[]>(`${API_BASE_URL}/api/invitations`);
  }

  sendInvitation(email: string, roleIds: string[], expiresAt: string) {
    return this.http.post<Invitation>(`${API_BASE_URL}/api/invitations`, {
      email,
      roleIds,
    });
  }

  revokeInvitation(invitationId: string) {
    return this.http.delete<void>(`${API_BASE_URL}/api/invitations/${invitationId}`);
  }

  activateInvitation(
    invitationId: string,
    password: string,
    roleIds: string[],
    productId?: string | null,
  ) {
    return this.http.post(`${API_BASE_URL}/api/invitations/${invitationId}/activate`, {
      password,
      roleIds,
      productId: productId ?? undefined,
    });
  }
}


