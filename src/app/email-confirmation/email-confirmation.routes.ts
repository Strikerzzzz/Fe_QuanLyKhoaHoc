import { Route } from '@angular/router';
import { EmailConfirmationComponent } from './email-confirmation.component';

export const EMAIL_CONFIRMATION_ROUTES: Route[] = [
  {
    path: '',
    component: EmailConfirmationComponent,
  },
];
