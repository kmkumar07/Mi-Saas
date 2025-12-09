import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationsService, Invitation } from '../core/invitations.service';

@Component({
  selector: 'app-invitations-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h2>Invitations</h2>
          <p class="page__subtitle">
            Invite employees to the platform and assign roles.
          </p>
        </div>
      </header>

      <form class="invite-form" (ngSubmit)="onInvite()">
        <label>
          <span>Email</span>
          <input type="email" name="email" [(ngModel)]="email" required />
        </label>
        <label>
          <span>Comma separated role IDs</span>
          <input type="text" name="roles" [(ngModel)]="roleIdsRaw" />
        </label>
        <button class="btn btn-primary" type="submit" [disabled]="inviting()">
          {{ inviting() ? 'Sending…' : 'Send invitation' }}
        </button>
      </form>

      <div *ngIf="inviteError()" class="role-error">
        {{ inviteError() }}
      </div>

      <div class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading()">
              <td colspan="4" class="table__empty">Loading invitations…</td>
            </tr>
            <tr *ngIf="!loading() && error()">
              <td colspan="4" class="table__empty table__empty--error">
                {{ error() }}
              </td>
            </tr>
            <tr *ngFor="let inv of invitations()">
              <td>{{ inv.email }}</td>
              <td>
                <span
                  class="badge"
                  [class.badge--success]="inv.status === 'accepted'"
                  [class.badge--muted]="inv.status !== 'accepted'"
                >
                  {{ inv.status }}
                </span>
              </td>
              <td>{{ inv.expiresAt | date: 'short' }}</td>
              <td>
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="revoke(inv)"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class InvitationsPageComponent implements OnInit {
  private readonly invitationsService = inject(InvitationsService);

  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  email = '';
  roleIdsRaw = '';
  readonly inviting = signal(false);
  readonly inviteError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);

    this.invitationsService.listInvitations().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.invitations.set(data);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to load invitations.');
      },
    });
  }

  onInvite() {
    if (!this.email) return;
    const roleIds = this.roleIdsRaw
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    this.inviting.set(true);
    this.inviteError.set(null);

    this.invitationsService.sendInvitation(this.email, roleIds, expiresAt.toISOString()).subscribe({
      next: () => {
        this.inviting.set(false);
        this.email = '';
        this.roleIdsRaw = '';
        this.load();
      },
      error: (err) => {
        this.inviting.set(false);
        this.inviteError.set(err?.error?.message ?? 'Failed to send invitation.');
      },
    });
  }

  revoke(inv: Invitation) {
    this.invitationsService.revokeInvitation(inv.id).subscribe({
      next: () => this.load(),
    });
  }
}


