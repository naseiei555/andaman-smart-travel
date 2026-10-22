import { Routes } from '@angular/router';

const placeDetail = () =>
  import('./pages/place-detail.page').then((m) => m.PlaceDetailPage);
const homeOutlet = () =>
  import('./pages/home-outlet.page').then((m) => m.HomeOutletPage);
const eventsPage = () => import('./pages/events.page').then((m) => m.EventsPage);

export const routes: Routes = [
  { path: 'places/:id', loadComponent: placeDetail, data: { homeLink: '/' } },
  { path: 'events', loadComponent: eventsPage },
  { path: 'events/:slug', loadComponent: eventsPage },
  { path: 'admin/events', loadComponent: eventsPage, data: { admin: true } },
  { path: '', pathMatch: 'full', loadComponent: homeOutlet },
  { path: '**', redirectTo: '' },
];

