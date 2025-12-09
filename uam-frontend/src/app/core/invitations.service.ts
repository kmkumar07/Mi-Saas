import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL, DEFAULT_TENANT_ID, SYSTEM_ADMIN_USER_ID } from './api.config';

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
    // Backend expects tenantId and invitedBy but currently injects them;
    // we still send tenantId for clarity.
    return this.http.post<Invitation>(`${API_BASE_URL}/api/invitations`, {
      tenantId: DEFAULT_TENANT_ID,
      invitedBy: SYSTEM_ADMIN_USER_ID,
      email,
      roleIds,
      expiresAt,
    });
  }

  revokeInvitation(invitationId: string) {
    return this.http.delete<void>(`${API_BASE_URL}/api/invitations/${invitationId}`);
  }
}


