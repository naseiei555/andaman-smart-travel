import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/angular';
import { catchError, of } from 'rxjs';
import { EventsApiService, LocalEvent } from '../core/events-api.service';
import { southernProvinces } from '../../../../shared/data/provinces.data';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption],
  template: `
    <main class="events-page"><header><p>SOUTHERN THAILAND LOCAL EVENTS</p><h1>Events near your trip</h1><span>Choose a province and month to explore local happenings.</span></header>
      <section class="filters"><ion-item><ion-label>Province</ion-label><ion-select [value]="province()" (ionChange)="setProvince($event.detail.value)"><ion-select-option value="All">All provinces</ion-select-option>@for (p of provinces; track p) { <ion-select-option [value]="p">{{ p }}</ion-select-option> }</ion-select></ion-item><ion-item><ion-label>Month</ion-label><ion-input type="month" [value]="month()" (ionChange)="setMonth($event.detail.value)"></ion-input></ion-item></section>
      @if (loading()) { <p class="state">Loading events…</p> } @else if (error()) { <p class="state">Events are unavailable right now. Check your connection and retry. <ion-button fill="clear" (click)="load()">Retry</ion-button></p> } @else if (!events().length) { <p class="state">No events are listed for these filters yet.</p> }
      <section class="event-list">@for (event of events(); track event.id) { <ion-card><ion-card-header><ion-card-subtitle>{{ event.province }} · {{ event.category }} · {{ event.verification_status === 'verified' ? 'Verified source' : 'Mock / unverified' }}</ion-card-subtitle><ion-card-title>{{ event.title }}</ion-card-title></ion-card-header><ion-card-content><p>{{ event.start_date || 'Date to be announced' }} @if (event.end_date && event.end_date !== event.start_date) { – {{ event.end_date }} }</p><p>{{ event.venue || 'Venue to be announced' }}</p><p>{{ event.description }}</p>@if (event.source_url) { <a [href]="event.source_url" target="_blank" rel="noopener">View event source ↗</a> } @if (event.verification_status === 'unverified') { <p class="disclaimer">Sample information only. Confirm dates and details with local organizers.</p> }</ion-card-content></ion-card> }</section>
      <p class="disclaimer">Confirm event information with organizers before travelling.</p>
    </main>
  `,
  styles: [`:host{display:block}.events-page{padding:18px 14px 34px}header p{font-size:.7rem;letter-spacing:.14em;color:#128087;font-weight:800}header h1{margin:4px 0 8px;font-size:1.8rem}header span,.state,.disclaimer{color:#627782;font-size:.85rem}.filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.event-list{display:grid;gap:4px}ion-card{margin:8px 0;border-radius:14px}ion-card-subtitle{color:#078184}.disclaimer{padding-top:6px;color:#806123}`],
})
export class MobileEventsPage {
  private readonly api = inject(EventsApiService);
  readonly provinces = southernProvinces;
  private readonly now = new Date();
  readonly month = signal(String(this.now.getFullYear()) + '-' + String(this.now.getMonth() + 1).padStart(2, '0'));
  readonly province = signal('All');
  readonly events = signal<LocalEvent[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  constructor() { this.load(); }
  setProvince(value: string) { this.province.set(value); this.load(); }
  setMonth(value: string | null | undefined) { if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) { this.month.set(value); this.load(); } }
  load() { const [year, month] = this.month().split('-').map(Number); this.loading.set(true); this.error.set(false); this.api.getMonthly(this.province(), month, year).pipe(catchError(() => { this.error.set(true); return of([] as LocalEvent[]); })).subscribe((events) => { this.events.set(events); this.loading.set(false); }); }
}




