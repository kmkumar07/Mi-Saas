import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService, PermissionMatrixRow } from '../core/roles.service';

@Component({
  selector: 'app-role-matrix-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h2>Create role</h2>
          <p class="page__subtitle">
            Choose the features this role can read, write, and delete.
          </p>
        </div>
      </header>

      <form (ngSubmit)="onSubmit()" class="role-form">
        <div class="role-form__meta">
          <label>
            <span>Role name</span>
            <input type="text" [(ngModel)]="roleName" name="roleName" required />
          </label>
          <label>
            <span>Role code</span>
            <input type="text" [(ngModel)]="roleCode" name="roleCode" required />
          </label>
          <label>
            <span>Hierarchy level (1–4)</span>
            <input
              type="number"
              [(ngModel)]="hierarchyLevel"
              name="hierarchyLevel"
              min="1"
              max="4"
              required
            />
          </label>
        </div>

        <div class="matrix-card">
          <table class="matrix">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Read</th>
                <th>Write</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of rows()"
                [class.matrix__group-row]="isGroupHeader(row)"
              >
                <td class="matrix__feature">
                  {{ row.featureName }}
                </td>
                <td class="matrix__cell">
                  <input
                    type="checkbox"
                    [(ngModel)]="row.canRead"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </td>
                <td class="matrix__cell">
                  <input
                    type="checkbox"
                    [(ngModel)]="row.canWrite"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </td>
                <td class="matrix__cell">
                  <input
                    type="checkbox"
                    [(ngModel)]="row.canExecute"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="error()" class="role-error">
          {{ error() }}
        </div>
        <div *ngIf="success()" class="role-success">
          {{ success() }}
        </div>

        <div class="role-actions">
          <button
            class="btn btn-primary"
            type="submit"
            [disabled]="submitting() || !hasAnyPermission()"
          >
            {{ submitting() ? 'Creating role…' : 'Create role with permissions' }}
          </button>
        </div>
      </form>
    </section>
  `,
})
export class RoleMatrixPageComponent implements OnInit {
  private readonly rolesService = inject(RolesService);

  roleName = '';
  roleCode = '';
  hierarchyLevel = 3;

  private readonly _rows = signal<PermissionMatrixRow[]>([]);

  readonly rows = computed(() => this._rows());

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  ngOnInit(): void {
    this.loadFeatures();
  }

  isGroupHeader(_row: PermissionMatrixRow): boolean {
    // kept for styling hook if needed later
    return false;
  }

  hasAnyPermission(): boolean {
    return this._rows().some((r) => r.canRead || r.canWrite || r.canExecute);
  }

  onSubmit() {
    if (!this.roleName || !this.roleCode || !this.hasAnyPermission()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.rolesService
      .createRole({
        roleName: this.roleName,
        roleCode: this.roleCode,
        hierarchyLevel: this.hierarchyLevel,
      })
      .subscribe({
        next: (role) => {
          this.rolesService
            .bulkAssignPermissions(role.id, this._rows())
            .subscribe({
              next: () => {
                this.submitting.set(false);
                this.success.set('Role and permissions created successfully.');
              },
              error: (err) => {
                this.submitting.set(false);
                this.error.set(
                  err?.error?.message ?? 'Role created, but assigning permissions failed.',
                );
              },
            });
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.error?.message ?? 'Failed to create role.');
        },
      });
  }

  private loadFeatures() {
    this.error.set(null);
    this.rolesService.loadPermissionMatrix().subscribe({
      next: (rows) => {
        this._rows.set(rows);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Failed to load features for this tenant.');
      },
    });
  }
}


