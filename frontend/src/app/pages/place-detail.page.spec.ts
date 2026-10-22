import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PlaceDetailPage } from './place-detail.page';
import { WeatherApiService } from '../core/weather-api.service';
import { BoatRoutesApiService } from '../core/boat-routes-api.service';
import { of } from 'rxjs';

describe('PlaceDetailPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WeatherApiService, useValue: { getWeather: () => of(null) } },
        {
          provide: BoatRoutesApiService,
          useValue: {
            getRoutes: (id: string) => of(
              id === 'phi-phi'
                ? [{
                    id: 'phuket-phi-phi',
                    destinationId: 'phi-phi',
                    departure: 'Phuket',
                    destination: 'Phi Phi Islands',
                    departureTime: '08:30',
                    estimatedDuration: '1h 45m',
                    transportType: 'Speedboat',
                    price: '฿1,100',
                    operator: 'Andaman Wave',
                  }]
                : [],
            ),
          },
        },
        provideRouter([
          {
            path: 'places/:id',
            component: PlaceDetailPage,
            data: { homeLink: '/' },
          },
        ]),
      ],
    });
  });

  it('shows destination details and credited gallery photos', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places/phi-phi', PlaceDetailPage);

    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('h1#place-title')?.textContent).toContain('Phi Phi Islands');
    expect(page.querySelectorAll('.place-gallery__item').length).toBeGreaterThan(1);
    expect(page.querySelectorAll('.gallery-credits a').length).toBeGreaterThan(0);
    expect(page.textContent).toContain('Reviews');
    expect(page.textContent).toContain('ยังไม่มีรีวิวจากผู้ใช้จริง');
    expect(page.textContent).toContain('Phuket → Phi Phi Islands');
    expect(page.textContent).toContain('Andaman Wave');
  });

  it('shows a recovery link for an unknown destination', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/places/not-a-place', PlaceDetailPage);

    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('.place-not-found h1')?.textContent).toContain("couldn't find");
    expect(page.querySelector('.place-not-found a')?.getAttribute('href')).toBe('/');
    expect(TestBed.inject(Router).url).toBe('/places/not-a-place');
  });
});
