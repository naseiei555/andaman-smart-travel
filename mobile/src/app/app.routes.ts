import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'places/:id',
    loadComponent: () =>
      import('./pages/place-detail-route.page').then((m) => m.PlaceDetailRoutePage),
    data: { homeLink: '/tabs/home' },
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
