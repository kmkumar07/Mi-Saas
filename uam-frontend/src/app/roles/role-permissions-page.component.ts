import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RolesService, PermissionMatrixRow, Role } from '../core/roles.service';

@Component({
  selector: 'app-role-permissions-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h2>Edit role permissions</h2>
          <p class="page__subtitle">
            Update which features this role can read, write, and delete.
          </p>
          <div *ngIf="role()">
            <strong>{{ role()?.roleName }}</strong>
            <span class="page__subtitle-muted">
              ({{ role()?.roleCode }} · level {{ role()?.hierarchyLevel }})
            </span>
          </div>
        </div>
      </header>

      <form (ngSubmit)="onSubmit()" class="role-form">
        <div class="matrix-card">
          <table class="matrix">
            <thead>
              <tr>
                <th>Feature</th>
                <th class="matrix__cell">
                  <input
                    type="checkbox"
                    [checked]="isColumnSelected('read')"
                    (change)="toggleColumn('read', $event.target.checked)"
                  />
                  <span>Read</span>
                </th>
                <th class="matrix__cell">
                  <input
                    type="checkbox"
                    [checked]="isColumnSelected('write')"
                    (change)="toggleColumn('write', $event.target.checked)"
                  />
                  <span>Write</span>
                </th>
                <th class="matrix__cell">
                  <input
                    type="checkbox"
                    [checked]="isColumnSelected('execute')"
                    (change)="toggleColumn('execute', $event.target.checked)"
                  />
                  <span>Delete</span>
                </th>
                <th class="matrix__cell">
                  <input
                    type="checkbox"
                    [checked]="areAllSelected()"
                    (change)="toggleAll($event.target.checked)"
                  />
                  <span>All</span>
                </th>
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
                <td class="matrix__cell">
                  <input
                    type="checkbox"
                    [checked]="row.canRead && row.canWrite && row.canExecute"
                    (change)="toggleRow(row, $event.target.checked)"
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
            {{ submitting() ? 'Saving…' : 'Save permissions' }}
          </button>
        </div>
      </form>
    </section>
  `,
})
export class RolePermissionsPageComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly route = inject(ActivatedRoute);

  private readonly _rows = signal<PermissionMatrixRow[]>([]);
  readonly rows = computed(() => this._rows());

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly role = signal<Role | null>(null);

  private roleId: string | null = null;

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    if (!this.roleId) {
      this.error.set('Missing role identifier in URL.');
      return;
    }

    this.loadRoleAndPermissions(this.roleId);
  }

  isGroupHeader(_row: PermissionMatrixRow): boolean {
    // kept for styling hook if needed later
    return false;
  }

  hasAnyPermission(): boolean {
    return this._rows().some((r) => r.canRead || r.canWrite || r.canExecute);
  }

  isColumnSelected(column: 'read' | 'write' | 'execute'): boolean {
    const rows = this._rows();
    if (!rows.length) return false;
    return rows.every((r) => {
      if (column === 'read') return r.canRead;
      if (column === 'write') return r.canWrite;
      return r.canExecute;
    });
  }

  areAllSelected(): boolean {
    const rows = this._rows();
    if (!rows.length) return false;
    return rows.every((r) => r.canRead && r.canWrite && r.canExecute);
  }

  toggleColumn(column: 'read' | 'write' | 'execute', checked: boolean): void {
    const updated = this._rows().map((r) => {
      if (column === 'read') {
        return { ...r, canRead: checked };
      }
      if (column === 'write') {
        return { ...r, canWrite: checked };
      }
      return { ...r, canExecute: checked };
    });
    this._rows.set(updated);
  }

  toggleRow(row: PermissionMatrixRow, checked: boolean): void {
    const updated = this._rows().map((r) =>
      r.featureId === row.featureId
        ? { ...r, canRead: checked, canWrite: checked, canExecute: checked }
        : r,
    );
    this._rows.set(updated);
  }

  toggleAll(checked: boolean): void {
    const updated = this._rows().map((r) => ({
      ...r,
      canRead: checked,
      canWrite: checked,
      canExecute: checked,
    }));
    this._rows.set(updated);
  }

  onSubmit() {
    if (!this.roleId || !this.hasAnyPermission()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.rolesService.bulkAssignPermissions(this.roleId, this._rows()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set('Permissions updated successfully.');
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Failed to update permissions.');
      },
    });
  }

  private loadRoleAndPermissions(roleId: string) {
    this.error.set(null);

    // Load the role details and its permissions, plus the tenant feature matrix
    this.rolesService.getRole(roleId).subscribe({
      next: (role) => this.role.set(role),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load role details.');
      },
    });

    this.rolesService.loadPermissionMatrix().subscribe({
      next: (rows) => {
        // Once we have the base matrix, overlay existing permissions
        this.rolesService.getRolePermissions(roleId).subscribe({
          next: (perms) => {
            const byFeature = new Map(
              perms.map((p) => [
                p.featureId,
                {
                  canRead: p.canRead,
                  canWrite: p.canWrite,
                  canExecute: p.canExecute,
                },
              ]),
            );

            const merged = rows.map((row) => {
              const existing = byFeature.get(row.featureId);
              if (!existing) return row;
              return {
                ...row,
                canRead: existing.canRead,
                canWrite: existing.canWrite,
                canExecute: existing.canExecute,
              };
            });

            this._rows.set(merged);
          },
          error: (err) => {
            // If permissions fail to load, still show matrix with defaults
            this._rows.set(rows);
            this.error.set(
              err?.error?.message ??
                'Failed to load existing permissions. You can still set new ones.',
            );
          },
        });
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Failed to load features for this tenant.');
      },
    });
  }
}


