import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSession {
  readonly user: { readonly id: string; readonly email: string; readonly role: 'user' | 'admin' };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly session = signal<UserSession['user'] | null>(null);

  register(email: string, password: string) {
    return this.http.post<UserSession>(`${environment.apiUrl}/api/auth/register`, { email, password }, { withCredentials: true })
      .pipe(tap((session) => this.session.set(session.user)));
  }

  login(email: string, password: string) {
    return this.http.post<UserSession>(`${environment.apiUrl}/api/auth/login`, { email, password }, { withCredentials: true })
      .pipe(tap((session) => this.session.set(session.user)));
  }

  restoreSession(): void {
    this.http.get<UserSession>(`${environment.apiUrl}/api/auth/me`, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe((session) => this.session.set(session?.user ?? null));
  }

  logout(): void {
    this.session.set(null);
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).subscribe({ error: () => undefined });
  }
}
