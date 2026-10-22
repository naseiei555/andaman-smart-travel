export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGusts: number | null;
  rainProbability: number | null;
  condition: string;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherForecastDay {
  date: string;
  condition: string;
  weatherCode: number;
  temperatureMax: number | null;
  temperatureMin: number | null;
  rainProbability: number | null;
}

export interface WeatherReport {
  destination: string;
  destinationId: string;
  province: string;
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  seaConditions: {
    waveHeight: number | null;
    wavePeriod: number | null;
    boatTravelWarning: boolean | null;
    marineDataAvailable: boolean;
  };
  activityAdvice: string;
  updatedAt: string;
  source: {
    name: string;
    url: string;
    marineUrl: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

export function isWeatherReport(value: unknown): value is WeatherReport {
  if (!isRecord(value)) {
    return false;
  }

  const current = value['current'];
  const sea = value['seaConditions'];
  const source = value['source'];
  const forecast = value['forecast'];
  return typeof value['destination'] === 'string' &&
    typeof value['destinationId'] === 'string' &&
    typeof value['province'] === 'string' &&
    isRecord(current) &&
    typeof current['temperature'] === 'number' &&
    typeof current['humidity'] === 'number' &&
    typeof current['windSpeed'] === 'number' &&
    isNullableNumber(current['windGusts']) &&
    isNullableNumber(current['rainProbability']) &&
    typeof current['condition'] === 'string' &&
    typeof current['weatherCode'] === 'number' &&
    typeof current['isDay'] === 'boolean' &&
    Array.isArray(forecast) &&
    forecast.every((day) =>
      isRecord(day) &&
      typeof day['date'] === 'string' &&
      typeof day['condition'] === 'string' &&
      typeof day['weatherCode'] === 'number' &&
      isNullableNumber(day['temperatureMax']) &&
      isNullableNumber(day['temperatureMin']) &&
      isNullableNumber(day['rainProbability']),
    ) &&
    isRecord(sea) &&
    isNullableNumber(sea['waveHeight']) &&
    isNullableNumber(sea['wavePeriod']) &&
    (sea['boatTravelWarning'] === null || typeof sea['boatTravelWarning'] === 'boolean') &&
    typeof sea['marineDataAvailable'] === 'boolean' &&
    typeof value['activityAdvice'] === 'string' &&
    typeof value['updatedAt'] === 'string' &&
    isRecord(source) &&
    typeof source['name'] === 'string' &&
    typeof source['url'] === 'string' &&
    typeof source['marineUrl'] === 'string';
}
