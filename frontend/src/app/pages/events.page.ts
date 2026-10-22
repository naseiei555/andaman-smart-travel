import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { EventsApiService, LocalEvent, LocalEventDraft } from '../core/events-api.service';
import { AuthService } from '../core/auth.service';
import { southernProvinces } from '../../../../shared/data/provinces.data';
import { TripPlanService } from '../core/trip-plan.service';
import { destinations } from '../../../../shared/data/places.data';

const PROVINCES = southernProvinces;
const CATEGORIES = ['culture', 'food', 'music', 'sports', 'tradition', 'tourism', 'other'];

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="events-shell">
      <header class="events-top"><a routerLink="/" class="back-link">← SOUTHERN THAILAND TRAVEL</a><a routerLink="/admin/events" class="admin-link">Admin event management</a></header>
      <section class="events-hero">
        <p class="eyebrow">SOUTHERN THAILAND LOCAL EVENTS</p><h1>Find something <em>happening.</em></h1>
        <p>Explore local events by province and month, and add a little more to your trip.</p>
      </section>
      @if (isAdmin()) {
        <section class="admin-panel"><h2>Event management</h2>
          @if (auth.session()?.role !== 'admin') {
            <p>Sign in with an administrator account to create, publish, verify, or cancel events.</p>
            <a routerLink="/">Return to the home page to sign in</a>
          } @else {
          <p>Verified events need a source URL. Your secure session is used for these changes.</p>
          <button class="primary-button" type="button" (click)="load()">Load/manage events</button>
          @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
          <form (ngSubmit)="createEvent()" class="event-form">
            <label>Event title<input required maxlength="255" [(ngModel)]="draft.title" name="title" /></label>
            <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" [(ngModel)]="draft.slug" name="slug" /></label>
            <label>Province<select required [(ngModel)]="draft.province" name="province">@for (province of provinces; track province) { <option [value]="province">{{ province }}</option> }</select></label>
            <label>Category<select [(ngModel)]="draft.category" name="category">@for (category of categories; track category) { <option [value]="category">{{ category }}</option> }</select></label>
            <label>Start date<input type="date" [(ngModel)]="draft.start_date" name="start_date" /></label>
            <label>End date<input type="date" [(ngModel)]="draft.end_date" name="end_date" /></label>
            <label>Venue<input maxlength="255" [(ngModel)]="draft.venue" name="venue" /></label>
            <label>Source URL<input type="url" [(ngModel)]="draft.source_url" name="source_url" /></label>
            <label class="wide">Description<textarea rows="3" [(ngModel)]="draft.description" name="description"></textarea></label>
            <label>Publication<select [(ngModel)]="draft.publication_status" name="publication_status"><option value="draft">Draft</option><option value="published">Publish</option></select></label>
            <label>Verification<select [(ngModel)]="draft.verification_status" name="verification_status"><option value="unverified">Unverified</option><option value="verified">Verified</option></select></label>
            <button class="primary-button" type="submit">{{ editingId === null ? "Create event" : "Save changes" }}</button>
          </form>
          @if (events().length) { <h3>Events in this month</h3><ul class="admin-list">@for (event of events(); track event.id) { <li><span><strong>{{ event.title }}</strong> · {{ event.publication_status }} · {{ event.verification_status }}</span><span class="admin-actions"><button type="button" (click)="edit(event)">Edit</button> @if (event.publication_status === 'draft') { <button type="button" (click)="publish(event)">Publish</button> } @if (event.verification_status === 'unverified' && event.source_url) { <button type="button" (click)="verify(event)">Mark verified</button> } @if (event.publication_status !== 'cancelled') { <button type="button" (click)="cancel(event)">Cancel</button> }</span></li> }</ul> }
          }
        </section>
      }
      <section class="filters" aria-label="Filter events"><label>Province<select [ngModel]="province()" (ngModelChange)="setProvince($event)"><option>All</option>@for (item of provinces; track item) { <option [value]="item">{{ item }}</option> }</select></label><label>Month<input type="month" [ngModel]="month()" (ngModelChange)="setMonth($event)" /></label><p>Showing events that overlap the selected month.</p></section>
      @if (loading()) { <p class="state" role="status">Loading events…</p> }
      @if (error()) { <p class="state error" role="alert">Events are temporarily unavailable. Please check that the API and database are running, then <button (click)="load()">retry</button>.</p> }
      @if (!loading() && !error()) {
        <div class="calendar"><div class="weekdays">@for (day of weekdays; track day) { <span>{{ day }}</span> }</div>
          @for (week of weeks(); track $index) { <div class="week">@for (day of week; track day.iso) { <div class="day" [class.outside]="!day.inMonth"><time [attr.datetime]="day.iso">{{ day.number }}</time>@for (event of eventsFor(day.iso); track event.id) { <button class="event-chip" [class.unverified]="event.verification_status === 'unverified'" (click)="selectEvent(event)">{{ event.title }} <small>{{ event.verification_status === 'unverified' ? 'Mock / unverified' : 'Verified' }}</small></button> }</div> }</div> }
        </div>
        @if (!events().length) { <p class="state">No events are listed for this province and month yet. Check back later or choose another month.</p> }
        @if (selected(); as event) { <article class="detail"><button class="close" (click)="closeEvent()" aria-label="Close event details">×</button><p class="eyebrow">{{ event.province }} · {{ event.category }}</p><h2>{{ event.title }}</h2><p>{{ event.description || 'More event details will be added by the organizer.' }}</p><dl><div><dt>Date</dt><dd>{{ event.start_date || 'To be announced' }} @if (event.end_date && event.end_date !== event.start_date) { – {{ event.end_date }} }</dd></div><div><dt>Venue</dt><dd>{{ event.venue || 'To be announced' }}</dd></div><div><dt>Information</dt><dd>{{ event.verification_status === 'verified' ? 'Verified from a listed source' : 'Unverified sample information — confirm before travel' }}</dd></div></dl>@if (event.source_url) { <a [href]="event.source_url" target="_blank" rel="noopener noreferrer">{{ event.source_name || 'Event source' }} ↗</a> } @if (event.official_url) { <a [href]="event.official_url" target="_blank" rel="noopener noreferrer">Official event page ↗</a> }<button class="primary-button" (click)="addToTrip(event)">Add event to trip plan</button>@if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }</article> }
      }
      <footer class="events-foot">Always confirm event dates, venue, and availability with the organizer before travelling.</footer>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f3f7f7;color:#17384a;font-family:inherit}.events-shell{max-width:1120px;margin:auto;padding:22px 24px 64px}.events-top{display:flex;justify-content:space-between;align-items:center}.back-link,.admin-link{color:#147b83;text-decoration:none;font-weight:700}.events-hero{padding:58px 0 34px}.eyebrow{color:#118184;font-size:.72rem;letter-spacing:.16em;font-weight:800}.events-hero h1{font-size:clamp(2.4rem,6vw,4.4rem);margin:10px 0;line-height:1.05}.events-hero h1 em{color:#16858a;font-family:Georgia,serif}.events-hero>p:last-child{color:#617486}.filters{display:flex;gap:18px;align-items:end;flex-wrap:wrap;margin:20px 0;padding:18px;background:#fff;border-radius:14px}.filters label,.admin-panel label{display:grid;gap:6px;font-weight:700;font-size:.85rem}.filters select,.filters input,.admin-panel input,.admin-panel select,.admin-panel textarea{min-height:42px;padding:9px 11px;border:1px solid #c7d8dc;border-radius:8px;background:white;color:inherit;font:inherit}.filters p{margin:0 auto 8px 0;color:#607683;font-size:.85rem}.calendar{overflow:hidden;border:1px solid #d6e3e5;border-radius:14px;background:#fff}.weekdays,.week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.weekdays{background:#e8f1f1;font-weight:800;text-align:center}.weekdays span{padding:12px 4px}.day{min-height:105px;padding:8px;border-top:1px solid #e2ebed;border-right:1px solid #e2ebed}.day:nth-child(7){border-right:0}.day time{font-weight:800}.day.outside{background:#f7f9f9;color:#a5b2b7}.event-chip{display:block;width:100%;margin-top:6px;padding:6px;text-align:left;border:0;border-radius:7px;background:#def1ed;color:#135b5a;font-size:.75rem;cursor:pointer}.event-chip.unverified{background:#fff1d4;color:#7a5413}.event-chip small{display:block;font-size:.62rem}.state{padding:22px;text-align:center;color:#637886}.error{color:#9b3838}.detail,.admin-panel{position:relative;margin:20px 0;padding:24px;background:#fff;border:1px solid #d8e4e6;border-radius:14px;box-shadow:0 12px 36px #1232}.detail h2{margin:.3em 0}.detail dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.detail dt{font-size:.75rem;color:#607886}.detail dd{margin:4px 0}.detail>a{margin-right:16px;color:#127d84}.close{float:right;border:0;background:none;font-size:1.8rem;cursor:pointer}.primary-button{padding:10px 15px;border:0;border-radius:8px;background:#087e83;color:white;font-weight:700;cursor:pointer}.detail .primary-button{display:block;margin-top:16px}.event-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.event-form .wide{grid-column:1/-1}.notice{color:#176d4a}.admin-list{padding:0;list-style:none}.admin-list li{display:flex;justify-content:space-between;gap:12px;padding:12px;border-top:1px solid #e2ebed}.admin-actions{display:flex;gap:6px}.admin-actions button{cursor:pointer}.events-foot{margin-top:34px;text-align:center;color:#71858e;font-size:.8rem}@media(max-width:680px){.events-shell{padding:16px}.events-hero{padding:38px 0 24px}.day{min-height:78px;padding:5px 3px;font-size:.78rem}.event-chip{font-size:.65rem;padding:4px}.event-chip small{font-size:.55rem}.event-form{grid-template-columns:1fr}.event-form .wide{grid-column:auto}.admin-list li{display:grid}.filters{align-items:stretch}.filters label{width:100%}}
  `],
})
export class EventsPage {
  private readonly api = inject(EventsApiService);
  protected readonly auth = inject(AuthService);
  private readonly tripPlan = inject(TripPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly provinces = PROVINCES;
  readonly categories = CATEGORIES;
  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly today = new Date();
  readonly month = signal(`${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`);
  readonly province = signal('All');
  readonly events = signal<LocalEvent[]>([]);
  readonly selected = signal<LocalEvent | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly isAdmin = signal(false);
  token = '';
  notice = signal('');
  draft: LocalEventDraft = { title: '', slug: '', province: 'Phuket', category: 'culture', publication_status: 'draft', verification_status: 'unverified' };
  editingId: number | null = null;
  private readonly adminSessionEffect = effect(() => {
    if (this.isAdmin() && this.auth.session()?.role === 'admin') this.load();
  });
  readonly weeks = computed(() => {
    const [year, month] = this.month().split('-').map(Number);
    const first = new Date(Date.UTC(year, month - 1, 1));
    const offset = first.getUTCDay();
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
      const date = new Date(Date.UTC(year, month - 1, 1 - offset + i));
      return { iso: date.toISOString().slice(0, 10), number: date.getUTCDate(), inMonth: date.getUTCMonth() === month - 1 };
    });
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  });
  constructor() {
    this.route.data.subscribe((data) => this.isAdmin.set(data['admin'] === true));
    this.route.queryParamMap.subscribe((params) => { const province = params.get('province'); if (province && PROVINCES.some((supported) => supported === province)) { this.province.set(province); this.load(); } });
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.api.getEvent(slug).subscribe({ next: (event) => this.selected.set(event), error: () => this.notice.set('Event not found or unavailable.') });
    });
    this.load();
  }
  setProvince(value: string) { this.province.set(value); this.load(); }
  setMonth(value: string) { if (/^\d{4}-\d{2}$/.test(value)) { this.month.set(value); this.load(); } }
  eventsFor(day: string) { return this.events().filter((event) => !!event.start_date && !!event.end_date && event.start_date <= day && event.end_date >= day); }
  selectEvent(event: LocalEvent) { this.selected.set(event); this.router.navigate(["/events", event.slug]); }
  closeEvent() { this.selected.set(null); this.router.navigate(["/events"]); }
  load() {
    const [year, month] = this.month().split('-').map(Number);
    this.loading.set(true); this.error.set(false);
    const request = this.isAdmin() && this.auth.session()?.role === 'admin' ? this.api.getAdminEvents(this.token.trim()) : this.api.getMonthly(this.province(), month, year);
    request.pipe(catchError(() => { this.error.set(true); return of([] as LocalEvent[]); })).subscribe((events) => { this.events.set(events); this.loading.set(false); });
  }
  createEvent() {
    if (this.auth.session()?.role !== 'admin') { this.notice.set('Sign in with an administrator account to manage events.'); return; }
    const payload = { ...this.draft, start_date: this.draft.start_date || null, end_date: this.draft.end_date || null, source_url: this.draft.source_url || '' };
    const request = this.editingId === null
      ? this.api.createEvent(payload, this.token.trim())
      : this.api.updateEvent(this.editingId, payload, this.token.trim());
    request.subscribe({ next: () => { this.notice.set(this.editingId === null ? 'Event created.' : 'Event updated.'); this.editingId = null; this.draft = { title: '', slug: '', province: 'Phuket', category: 'culture', publication_status: 'draft', verification_status: 'unverified' }; this.load(); }, error: (e) => this.notice.set(e.error?.message || 'Could not save event.') });
  }
  edit(event: LocalEvent) {
    this.editingId = event.id;
    this.draft = { title: event.title, slug: event.slug, province: event.province, category: event.category, publication_status: event.publication_status === 'cancelled' ? 'draft' : event.publication_status, verification_status: event.verification_status, description: event.description || '', venue: event.venue || '', start_date: event.start_date || null, end_date: event.end_date || null, source_url: event.source_url || '' };
    this.notice.set(`Editing ${event.title}.`);
  }
  publish(event: LocalEvent) { this.api.updateStatus(event.id, { publication_status: 'published' }, this.token.trim()).subscribe({ next: () => this.load(), error: () => this.notice.set('Could not publish this event.') }); }
  verify(event: LocalEvent) { this.api.updateStatus(event.id, { verification_status: 'verified' }, this.token.trim()).subscribe({ next: () => this.load(), error: () => this.notice.set('Could not verify this event.') }); }
  cancel(event: LocalEvent) { this.api.cancelEvent(event.id, this.token.trim()).subscribe({ next: () => { this.notice.set('Event cancelled.'); this.load(); }, error: () => this.notice.set('Could not cancel this event.') }); }
  addToTrip(event: LocalEvent) {
    const place = destinations.find((item) => item.province === event.province);
    if (!place) { this.notice.set(`No destination is available in ${event.province} to add to the itinerary.`); return; }
    if (event.start_date) this.tripPlan.updatePlan({ startDate: event.start_date });
    this.tripPlan.addStop(place.id);
    this.notice.set(`Added ${place.name} to your trip plan${event.start_date ? ` starting ${event.start_date}` : ''}.`);
    this.router.navigate(['/'], { fragment: 'trip-planner' }).then(() => document.getElementById('trip-planner')?.scrollIntoView({ behavior: 'smooth' }));
  }
}









