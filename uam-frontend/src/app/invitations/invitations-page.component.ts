import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationsService, Invitation } from '../core/invitations.service';
import { RolesService, Role } from '../core/roles.service';

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
            Invite employees to the platform. You can assign roles later once the user is registered.
          </p>
        </div>
      </header>

      <form class="invite-form" (ngSubmit)="onInvite()">
        <label>
          <span>Email</span>
          <input type="email" name="email" [(ngModel)]="email" required />
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
              <th>Actions</th>
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
                <ng-container *ngIf="inv.status === 'pending'; else nonPendingActions">
                  <div *ngIf="activatingId === inv.id; else activateButtonRow" class="activate-row">
                    <input
                      type="password"
                      class="input"
                      placeholder="Set password"
                      name="password-{{ inv.id }}"
                      [(ngModel)]="activatePassword"
                    />
                    <div class="roles-select">
                      <label *ngFor="let role of roles()">
                        <input
                          type="checkbox"
                          [checked]="isRoleSelected(inv.id, role.id)"
                          (change)="toggleRole(inv.id, role.id, $event.target.checked)"
                        />
                        {{ role.roleName }}
                      </label>
                    </div>
                    <div class="product-select" *ngIf="products().length > 0">
                      <label>
                        <span>Product</span>
                        <select
                          name="product-{{ inv.id }}"
                          [(ngModel)]="selectedProductId"
                          class="input"
                        >
                          <option [ngValue]="null">All products</option>
                          <option
                            *ngFor="let p of products()"
                            [ngValue]="p.productId"
                          >
                            {{ p.productName }}
                          </option>
                        </select>
                      </label>
                    </div>
                    <button
                      class="btn btn-primary"
                      type="button"
                      (click)="activate(inv)"
                      [disabled]="!activatePassword"
                    >
                      Activate
                    </button>
                    <button
                      class="btn btn-secondary"
                      type="button"
                      (click)="cancelActivate()"
                    >
                      Cancel
                    </button>
                  </div>
                  <ng-template #activateButtonRow>
                    <button
                      class="btn btn-primary btn--sm"
                      type="button"
                      (click)="startActivate(inv)"
                    >
                      Activate
                    </button>
                    <button
                      class="btn btn-secondary btn--sm"
                      type="button"
                      (click)="revoke(inv)"
                    >
                      Revoke
                    </button>
                  </ng-template>
                </ng-container>
                <ng-template #nonPendingActions>
                  <button
                    class="btn btn-secondary btn--sm"
                    type="button"
                    (click)="revoke(inv)"
                  >
                    Revoke
                  </button>
                </ng-template>
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
  private readonly rolesService = inject(RolesService);

  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  email = '';
  readonly inviting = signal(false);
  readonly inviteError = signal<string | null>(null);

  activatingId: string | null = null;
  activatePassword = '';

  // Available roles for the tenant
  readonly roles = signal<Role[]>([]);
  // Selected role IDs per invitation
  private selectedRoleIdsByInvitation: Record<string, string[]> = {};

  // Available products for the tenant (loaded via RolesService)
  readonly products = signal<{ productId: string; productName: string }[]>([]);
  // Selected product for the currently activating invitation
  selectedProductId: string | null = null;

  ngOnInit(): void {
    this.load();
    this.loadRoles();
    this.loadProducts();
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

    this.inviting.set(true);
    this.inviteError.set(null);

    // We only send email; roles will be assigned later from the admin UI.
    this.invitationsService.sendInvitation(this.email, [], '').subscribe({
      next: () => {
        this.inviting.set(false);
        this.email = '';
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

  startActivate(inv: Invitation) {
    this.activatingId = inv.id;
    this.activatePassword = '';
    this.inviteError.set(null);
    this.selectedProductId = null;
  }

  cancelActivate() {
    this.activatingId = null;
    this.activatePassword = '';
  }

  private loadRoles() {
    this.rolesService.listRoles().subscribe({
      next: (roles) => this.roles.set(roles),
    });
  }

  private loadProducts() {
    this.rolesService.loadTenantProducts().subscribe({
      next: (products) => this.products.set(products),
    });
  }

  isRoleSelected(invitationId: string, roleId: string): boolean {
    return this.selectedRoleIdsByInvitation[invitationId]?.includes(roleId) ?? false;
  }

  toggleRole(invitationId: string, roleId: string, checked: boolean) {
    const current = this.selectedRoleIdsByInvitation[invitationId] ?? [];
    if (checked) {
      if (!current.includes(roleId)) {
        this.selectedRoleIdsByInvitation[invitationId] = [...current, roleId];
      }
    } else {
      this.selectedRoleIdsByInvitation[invitationId] = current.filter((id) => id !== roleId);
    }
  }

  activate(inv: Invitation) {
    if (!this.activatePassword) {
      return;
    }

    this.inviting.set(true);
    this.inviteError.set(null);

    const roleIds = this.selectedRoleIdsByInvitation[inv.id] ?? [];

    const productId = this.selectedProductId;

    this.invitationsService
      .activateInvitation(inv.id, this.activatePassword, roleIds, productId)
      .subscribe({
      next: () => {
        this.inviting.set(false);
        this.activatingId = null;
        this.activatePassword = '';
        this.selectedRoleIdsByInvitation[inv.id] = [];
        this.selectedProductId = null;
        this.load();
      },
      error: (err) => {
        this.inviting.set(false);
        this.inviteError.set(err?.error?.message ?? 'Failed to activate user.');
      },
      });
  }
}


