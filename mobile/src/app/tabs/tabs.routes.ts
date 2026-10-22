import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const home = () => import('../pages/home.page').then((m) => m.HomePage);
const map = () => import('../pages/map-route.page').then((m) => m.MapRoutePage);
const favorites = () => import('../pages/favorites.page').then((m) => m.FavoritesPage);
const trips = () => import('../pages/trips.page').then((m) => m.TripsPage);
const boatRoutes = () => import('../pages/boat-routes.page').then((m) => m.BoatRoutesPage);
const events = () => import('../pages/events.page').then((m) => m.MobileEventsPage);

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      { path: 'home', loadComponent: home, data: { title: 'Home' } },
      { path: 'explore', loadComponent: boatRoutes, data: { title: 'Boat Routes' } },
      { path: 'events', loadComponent: events, data: { title: 'Events' } },
      { path: 'map', loadComponent: map, data: { title: 'Map' } },
      { path: 'favorites', loadComponent: favorites, data: { title: 'Favorites' } },
      { path: 'trips', loadComponent: trips, data: { title: 'Trips' } },
      { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
];
