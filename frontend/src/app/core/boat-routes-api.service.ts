import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BoatRoute, isBoatRouteList } from '../../../../shared/data/boat-routes.data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BoatRoutesApiService {
  private readonly http = inject(HttpClient);

  getRoutes(destinationId?: string): Observable<BoatRoute[]> {
    const params: Record<string, string> = destinationId ? { destinationId } : {};
    return this.http.get<unknown>(`${environment.apiUrl}/api/boat-routes`, { params }).pipe(
      map((value) => {
        if (!isBoatRouteList(value)) {
          throw new Error('Boat routes API returned an invalid response');
        }
        return value;
      }),
    );
  }
}
