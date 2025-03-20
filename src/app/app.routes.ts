import { Routes } from '@angular/router';
import { EMAIL_CONFIRMATION_ROUTES } from './email-confirmation/email-confirmation.routes';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: 'home', loadChildren: () => import('./pages/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'email-confirmation', loadChildren: () => import('./email-confirmation/email-confirmation.routes').then(m => EMAIL_CONFIRMATION_ROUTES) },
  { path: 'admin', loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES), canActivate: [AuthGuard], data: { role: 'Admin' } },
  { path: 'lecturer', loadChildren: () => import('./pages/lecturer/lecturer.routes').then(m => m.LECTURER_ROUTES), canActivate: [AuthGuard], data: { role: 'Lecturer' } },
  { path: 'learning', loadChildren: () => import('./pages/learning/learning.routes').then(m => m.LEARNING_ROUTES) },
  { path: 'my-learning', loadChildren: () => import('./pages/my-learning/my-learning.routes').then(m => m.MYLEARNING_ROUTES), canActivate: [AuthGuard] },
  { path: 'profile', loadChildren: () => import('./pages/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [AuthGuard] }
];