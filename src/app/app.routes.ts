import { Routes } from '@angular/router';
import { EMAIL_CONFIRMATION_ROUTES } from './email-confirmation/email-confirmation.routes';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: 'home', loadChildren: () => import('./pages/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'email-confirmation', loadChildren: () => import('./email-confirmation/email-confirmation.routes').then(m => EMAIL_CONFIRMATION_ROUTES) },
  { path: 'admin', loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES), canActivate: [AuthGuard] }
];