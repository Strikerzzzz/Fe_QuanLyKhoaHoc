import { Routes } from '@angular/router';
import { EMAIL_CONFIRMATION_ROUTES } from './email-confirmation/email-confirmation.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },{
    path: 'email-confirmation',
    children: EMAIL_CONFIRMATION_ROUTES,
  }
];