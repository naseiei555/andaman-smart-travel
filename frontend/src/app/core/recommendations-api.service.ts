import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  isRecommendationMatchList,
  RecommendationMatch,
} from '../../../../shared/data/recommendations.data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationsApiService {
  private readonly http = inject(HttpClient);

  getRecommendations(
    interests: readonly string[],
    favoriteIds: readonly string[],
  ): Observable<RecommendationMatch[]> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/api/recommendations`, {
        params: {
          interest: interests.join(','),
          favorite: favoriteIds.join(','),
        },
      })
      .pipe(
        map((value) => {
          if (!isRecommendationMatchList(value)) {
            throw new Error('Recommendations API returned an invalid response');
          }
          return value;
        }),
      );
  }
}
