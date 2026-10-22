import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export interface LocalEvent {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  province: string;
  district?: string | null;
  venue?: string | null;
  category: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  estimated_cost?: number | null;
  official_url?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  verification_status: 'verified' | 'unverified';
  publication_status: 'draft' | 'published' | 'cancelled';
  event_status: string;
}

export interface LocalEventDraft {
  title: string;
  slug: string;
  province: string;
  category: string;
  publication_status: 'draft' | 'published';
  description?: string;
  venue?: string;
  start_date?: string | null;
  end_date?: string | null;
  official_url?: string;
  source_name?: string;
  source_url?: string;
  verification_status: 'unverified' | 'verified';
}

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.eventsApiUrl || environment.apiUrl}/api`;

  getMonthly(province: string, month: number, year: number) {
    let params = new HttpParams().set('month', month).set('year', year);
    if (province !== 'All') params = params.set('province', province);
    return this.http.get<LocalEvent[]>(`${this.base}/events/monthly`, { params });
  }

  getEvent(idOrSlug: string) {
    return this.http.get<LocalEvent>(`${this.base}/events/${encodeURIComponent(idOrSlug)}`);
  }

  getAdminEvents(token: string) {
    return this.http.get<LocalEvent[]>(`${this.base}/admin/events`, { headers: { Authorization: `Bearer ${token}` } });
  }
  createEvent(draft: LocalEventDraft, token: string) {
    return this.http.post<LocalEvent>(`${this.base}/admin/events`, draft, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  updateEvent(id: number, draft: LocalEventDraft, token: string) {
    return this.http.put<LocalEvent>(`${this.base}/admin/events/${id}`, draft, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  updateStatus(id: number, status: { publication_status?: string; verification_status?: string }, token: string) {
    return this.http.patch<LocalEvent>(`${this.base}/admin/events/${id}/status`, status, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  cancelEvent(id: number, token: string) {
    return this.http.delete<void>(`${this.base}/admin/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}




