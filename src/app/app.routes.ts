import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: 'home', loadChildren: () => import('./pages/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'navbar', loadChildren: () => import('./shared/components/navbar/navbar.routes').then(m => m.NAVBAR_ROUTES) },
  { path: 'footer', loadChildren: () => import('./shared/components/footer/footer.routes').then(m => m.FOOTER_ROUTES) }
];