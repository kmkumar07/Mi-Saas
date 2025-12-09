import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UsersService, User } from '../core/users.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h2>Users</h2>
          <p class="page__subtitle">
            View and manage users for the current tenant.
          </p>
        </div>
        <nav class="page__tabs">
          <a
            class="page__tab page__tab--active"
            [routerLink]="['/users']"
            routerLinkActive="page__tab--active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            Users
          </a>
          <a
            class="page__tab"
            [routerLink]="['/invitations']"
            routerLinkActive="page__tab--active"
          >
            Employees
          </a>
        </nav>
      </header>

      <div class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading()">
              <td colspan="3" class="table__empty">Loading users…</td>
            </tr>
            <tr *ngIf="!loading() && error()">
              <td colspan="3" class="table__empty table__empty--error">
                {{ error() }}
              </td>
            </tr>
            <tr *ngIf="!loading() && !error() && users().length === 0">
              <td colspan="3" class="table__empty">
                No users found.
              </td>
            </tr>
            <tr *ngFor="let user of users()">
              <td>
                <div class="user-cell">
                  <div class="user-cell__avatar">
                    {{ user.firstName?.[0] || user.email[0] | uppercase }}
                  </div>
                  <div class="user-cell__info">
                    <div class="user-cell__name">
                      {{ user.firstName || '' }} {{ user.lastName || '' }}
                    </div>
                    <div class="user-cell__email">
                      {{ user.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  [class.badge--success]="user.isActive"
                  [class.badge--muted]="!user.isActive"
                >
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                {{ user.lastLoginAt ? (user.lastLoginAt | date : 'mediumDate') : 'Never' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.listUsers().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.users.set(data);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to load users.');
      },
    });
  }
}


