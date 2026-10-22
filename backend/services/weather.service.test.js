const test = require('node:test');
const assert = require('node:assert/strict');
const { createWeatherService, conditionFor, mapForecast, boatTravelWarning } = require('./weather.service');

const forecastResponse = {
  current: {
    time: '2026-10-08T13:00',
    temperature_2m: 27.4,
    relative_humidity_2m: 82,
    is_day: 1,
    weather_code: 3,
    wind_speed_10m: 7.1,
    wind_gusts_10m: 12.2,
  },
  hourly: {
    time: ['2026-10-08T12:00', '2026-10-08T13:00'],
    precipitation_probability: [40, 65],
  },
  daily: {
    time: ['2026-10-08', '2026-10-09'],
    weather_code: [95, 3],
    temperature_2m_max: [28.8, 29.4],
    temperature_2m_min: [26, 26.9],
    precipitation_probability_max: [88, 93],
  },
};

const marineResponse = {
  current: { wave_height: 0.2, wave_period: 5.3 },
};

const destination = {
  id: 'phi-phi',
  name: 'Phi Phi Islands',
  province: 'Krabi',
  latitude: 7.7403,
  longitude: 98.7718,
};

function response(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

test('maps current conditions and daily forecasts without inventing missing data', () => {
  const result = mapForecast(forecastResponse);
  assert.deepEqual(result.current, {
    temperature: 27.4,
    humidity: 82,
    windSpeed: 7.1,
    windGusts: 12.2,
    rainProbability: 65,
    condition: 'Overcast',
    weatherCode: 3,
    isDay: true,
  });
  assert.equal(result.forecast.length, 2);
  assert.equal(result.forecast[0].condition, 'Thunderstorm');
  assert.equal(result.forecast[0].temperatureMin, 26);
  assert.equal(conditionFor(777), 'Unknown conditions');
});

test('flags high rain, wind, or waves and leaves incomplete readings unknown', () => {
  assert.equal(boatTravelWarning({ rainProbability: 60, windSpeed: 10 }, 0.2), true);
  assert.equal(boatTravelWarning({ rainProbability: 10, windSpeed: 30 }, 0.2), true);
  assert.equal(boatTravelWarning({ rainProbability: 10, windSpeed: 10 }, 1.5), true);
  assert.equal(boatTravelWarning({ rainProbability: 10, windSpeed: 10 }, 0.2), false);
  assert.equal(boatTravelWarning({ rainProbability: null, windSpeed: 10 }, 0.2), null);
});

test('fetches forecast and marine data, returns a five-day-ready report, and caches briefly', async () => {
  const requestedUrls = [];
  const service = createWeatherService({
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return response(String(url).includes('/v1/marine') ? marineResponse : forecastResponse);
    },
    cacheTtlMs: 60_000,
  });

  const report = await service.getWeather(destination);
  const cachedReport = await service.getWeather(destination);

  assert.equal(requestedUrls.length, 2);
  assert.ok(requestedUrls[0].includes('latitude=7.7403'));
  assert.ok(requestedUrls[0].includes('longitude=98.7718'));
  assert.equal(report.destinationId, 'phi-phi');
  assert.equal(report.current.rainProbability, 65);
  assert.equal(report.forecast.length, 2);
  assert.equal(report.seaConditions.waveHeight, 0.2);
  assert.equal(report.seaConditions.boatTravelWarning, true);
  assert.equal(report.source.name, 'Open-Meteo');
  assert.equal(cachedReport, report);
});

test('keeps a usable weather report when optional marine data is unavailable', async () => {
  const marineErrors = [];
  const service = createWeatherService({
    fetchImpl: async (url) => String(url).includes('/v1/marine')
      ? response({ message: 'unavailable' }, false, 503)
      : response(forecastResponse),
    onMarineError: (error, id) => marineErrors.push([error.message, id]),
  });

  const report = await service.getWeather(destination);
  assert.equal(report.seaConditions.marineDataAvailable, false);
  assert.equal(report.seaConditions.waveHeight, null);
  assert.equal(report.seaConditions.boatTravelWarning, null);
  assert.deepEqual(marineErrors, [['Weather provider returned HTTP 503', 'phi-phi']]);
});

test('rejects required forecast-provider errors rather than returning sample weather', async () => {
  const service = createWeatherService({
    fetchImpl: async () => response({}, false, 502),
  });

  await assert.rejects(service.getWeather(destination), /HTTP 502/);
});
