import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/login-page.component';
import { RegisterPageComponent } from './auth/register-page.component';
import { RoleMatrixPageComponent } from './roles/role-matrix-page.component';
import { RolesListPageComponent } from './roles/roles-list-page.component';
import { RolePermissionsPageComponent } from './roles/role-permissions-page.component';
import { UsersPageComponent } from './users/users-page.component';
import { InvitationsPageComponent } from './invitations/invitations-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  { path: 'roles', component: RolesListPageComponent },
  { path: 'roles/create', component: RoleMatrixPageComponent },
  { path: 'roles/:id/permissions', component: RolePermissionsPageComponent },
  { path: 'users', component: UsersPageComponent },
  { path: 'invitations', component: InvitationsPageComponent },
];
