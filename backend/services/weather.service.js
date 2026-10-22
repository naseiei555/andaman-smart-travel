const FORECAST_URL = process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = process.env.OPEN_METEO_MARINE_URL || 'https://marine-api.open-meteo.com/v1/marine';
const REQUEST_TIMEOUT_MS = Number(process.env.WEATHER_REQUEST_TIMEOUT_MS || 8000);
const CACHE_TTL_MS = Number(process.env.WEATHER_CACHE_TTL_MS || 10 * 60 * 1000);

const weatherCodes = new Map([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Drizzle'],
  [55, 'Dense drizzle'],
  [56, 'Freezing drizzle'],
  [57, 'Freezing drizzle'],
  [61, 'Slight rain'],
  [63, 'Rain'],
  [65, 'Heavy rain'],
  [66, 'Freezing rain'],
  [67, 'Freezing rain'],
  [71, 'Slight snow'],
  [73, 'Snow'],
  [75, 'Heavy snow'],
  [77, 'Snow grains'],
  [80, 'Rain showers'],
  [81, 'Rain showers'],
  [82, 'Heavy rain showers'],
  [85, 'Snow showers'],
  [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with hail'],
  [99, 'Thunderstorm with hail'],
]);

function conditionFor(code) {
  return weatherCodes.get(code) || 'Unknown conditions';
}

function nearestHourlyIndex(times, referenceTime) {
  if (!Array.isArray(times) || times.length === 0) {
    return -1;
  }

  const reference = Date.parse(referenceTime);
  if (!Number.isFinite(reference)) {
    return 0;
  }

  return times.reduce((nearest, time, index) => {
    const distance = Math.abs(Date.parse(time) - reference);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
}

function mapForecast(data) {
  const current = data.current;
  const daily = data.daily;
  if (!current || !daily || !Array.isArray(daily.time) || !Array.isArray(daily.weather_code)) {
    throw new Error('Open-Meteo returned an incomplete forecast response');
  }

  const hourlyIndex = nearestHourlyIndex(data.hourly?.time, current.time);
  const rainProbability = hourlyIndex >= 0 ? data.hourly?.precipitation_probability?.[hourlyIndex] : null;

  return {
    current: {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windGusts: current.wind_gusts_10m ?? null,
      rainProbability: rainProbability ?? null,
      condition: conditionFor(current.weather_code),
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
    },
    forecast: daily.time.map((date, index) => ({
      date,
      condition: conditionFor(daily.weather_code[index]),
      weatherCode: daily.weather_code[index],
      temperatureMax: daily.temperature_2m_max?.[index] ?? null,
      temperatureMin: daily.temperature_2m_min?.[index] ?? null,
      rainProbability: daily.precipitation_probability_max?.[index] ?? null,
    })),
  };
}

function boatTravelWarning(current, waveHeight) {
  if (current.rainProbability == null || current.windSpeed == null || waveHeight == null) {
    return null;
  }
  return current.rainProbability >= 60 || current.windSpeed >= 30 || waveHeight >= 1.5;
}

function activityAdvice(current, waveHeight, warning) {
  if (warning === true) {
    return 'Consider indoor activities and check local marine advisories before any boat trip.';
  }
  if (current.rainProbability == null) {
    return 'Check the latest local forecast before choosing outdoor activities.';
  }
  if (current.rainProbability >= 35) {
    return 'Keep a flexible plan and consider indoor activities if rain develops.';
  }
  if (waveHeight != null && waveHeight < 1 && current.windSpeed < 20) {
    return 'Conditions look favorable for outdoor activities; follow local operator guidance.';
  }
  return 'Outdoor activities may be suitable; check local conditions before setting out.';
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Weather provider returned HTTP ${response.status}`);
  }
  return response.json();
}

function createWeatherService({
  fetchImpl = globalThis.fetch,
  cacheTtlMs = CACHE_TTL_MS,
  onMarineError = (error, destinationId) => console.error(`Marine forecast unavailable for ${destinationId}:`, error),
} = {}) {
  const cache = new Map();

  return {
    async getWeather(destination) {
      const cached = cache.get(destination.id);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.report;
      }

      const coordinates = `latitude=${encodeURIComponent(destination.latitude)}&longitude=${encodeURIComponent(destination.longitude)}`;
      const forecastUrl = new URL(FORECAST_URL);
      forecastUrl.search = `${coordinates}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto&wind_speed_unit=kmh`;
      const marineUrl = new URL(MARINE_URL);
      marineUrl.search = `${coordinates}&current=wave_height,wave_period,wave_direction&timezone=auto`;

      const forecastData = await fetchJson(fetchImpl, forecastUrl);
      const forecast = mapForecast(forecastData);
      let marine = null;
      let marineDataAvailable = false;

      try {
        const marineData = await fetchJson(fetchImpl, marineUrl);
        const wave = marineData.current;
        if (wave && Number.isFinite(wave.wave_height)) {
          marine = {
            waveHeight: wave.wave_height,
            wavePeriod: Number.isFinite(wave.wave_period) ? wave.wave_period : null,
          };
          marineDataAvailable = true;
        } else {
          onMarineError(new Error('Marine response did not include wave height'), destination.id);
        }
      } catch (error) {
        onMarineError(error, destination.id);
      }

      const warning = boatTravelWarning(forecast.current, marine?.waveHeight ?? null);
      const report = {
        destination: destination.name,
        destinationId: destination.id,
        province: destination.province,
        ...forecast,
        seaConditions: {
          waveHeight: marine?.waveHeight ?? null,
          wavePeriod: marine?.wavePeriod ?? null,
          boatTravelWarning: warning,
          marineDataAvailable,
        },
        activityAdvice: activityAdvice(forecast.current, marine?.waveHeight ?? null, warning),
        updatedAt: new Date().toISOString(),
        source: {
          name: 'Open-Meteo',
          url: 'https://open-meteo.com/',
          marineUrl: 'https://open-meteo.com/en/docs/marine-weather-api',
        },
      };

      cache.set(destination.id, { report, expiresAt: Date.now() + cacheTtlMs });
      return report;
    },
  };
}

module.exports = {
  createWeatherService,
  conditionFor,
  mapForecast,
  boatTravelWarning,
};
