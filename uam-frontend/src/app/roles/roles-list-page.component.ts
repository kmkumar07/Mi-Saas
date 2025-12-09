import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RolesService, Role } from '../core/roles.service';

@Component({
  selector: 'app-roles-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h2>Roles</h2>
          <p class="page__subtitle">
            View all roles for this tenant and manage their permissions.
          </p>
        </div>
        <div class="page__header-actions">
          <a class="btn btn-primary" [routerLink]="['/roles/create']">
            Create new role
          </a>
        </div>
      </header>

      <div class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Code</th>
              <th>Level</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading()">
              <td colspan="5" class="table__empty">Loading roles…</td>
            </tr>
            <tr *ngIf="!loading() && error()">
              <td colspan="5" class="table__empty table__empty--error">
                {{ error() }}
              </td>
            </tr>
            <tr *ngIf="!loading() && !error() && roles().length === 0">
              <td colspan="5" class="table__empty">
                No roles found. Create your first role to get started.
              </td>
            </tr>
            <tr *ngFor="let role of roles()">
              <td>
                <div class="user-cell">
                  <div class="user-cell__avatar">
                    {{ role.roleName[0] || role.roleCode[0] | uppercase }}
                  </div>
                  <div class="user-cell__info">
                    <div class="user-cell__name">
                      {{ role.roleName }}
                    </div>
                    <div class="user-cell__email">
                      {{ role.description || 'No description' }}
                    </div>
                  </div>
                </div>
              </td>
              <td>{{ role.roleCode }}</td>
              <td>{{ role.hierarchyLevel }}</td>
              <td>
                <span
                  class="badge"
                  [class.badge--muted]="!role.isSystemRole"
                  [class.badge--success]="role.isSystemRole"
                >
                  {{ role.isSystemRole ? 'System' : 'Custom' }}
                </span>
              </td>
              <td class="table__actions">
                <a
                  class="btn btn-secondary"
                  [routerLink]="['/roles', role.id, 'permissions']"
                >
                  Edit permissions
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class RolesListPageComponent implements OnInit {
  private readonly rolesService = inject(RolesService);

  readonly roles = signal<Role[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);

    this.rolesService.listRoles().subscribe({
      next: (roles) => {
        this.loading.set(false);
        this.roles.set(roles);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to load roles.');
      },
    });
  }
}


