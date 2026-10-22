import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { isWeatherReport, WeatherReport } from '../../../../shared/data/weather.data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly http = inject(HttpClient);

  getWeather(destinationId: string): Observable<WeatherReport> {
    return this.http.get<unknown>(`${environment.apiUrl}/api/weather`, {
      params: { destination: destinationId },
    }).pipe(
      map((value) => {
        if (!isWeatherReport(value)) {
          throw new Error('Weather API returned an invalid response');
        }
        return value;
      }),
    );
  }
}
