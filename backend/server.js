const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const { createWeatherService } = require('./services/weather.service');
const { scoreRecommendations } = require('./services/recommendations.service');
const { createEventsRouter } = require('./events.routes');
const { createAuthRouter } = require('./auth.routes');
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3001);
const weatherService = createWeatherService();
const pool = new Pool({ max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
const frontendOrigins = process.env.FRONTEND_URL
  ? [
      ...new Set([
        ...process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean),
        ...(process.env.NODE_ENV === 'production'
          ? []
          : [
              'http://localhost:4200',
              'http://127.0.0.1:4200',
              'http://localhost:4201',
              'http://127.0.0.1:4201',
              'http://localhost:4300',
              'http://127.0.0.1:4300',
            ]),
      ]),
    ]
  : true;

const destinations = [
  {
    id: 'phi-phi',
    name: 'Phi Phi Islands',
    province: 'Krabi',
    category: 'Island',
    description: 'Turquoise water, cliffside views, and unforgettable island-hopping adventures.',
    latitude: 7.7403,
    longitude: 98.7718,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Isla_Ko_Phi_Phi_Don%2C_Tailandia%2C_2013-08-19%2C_DD_18.JPG/960px-Isla_Ko_Phi_Phi_Don%2C_Tailandia%2C_2013-08-19%2C_DD_18.JPG',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Isla_Ko_Phi_Phi_Don,_Tailandia,_2013-08-19,_DD_18.JPG', photographer: 'Diego Delso', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    rating: 4.9,
    opening: '08:00 - 18:00',
    estimatedCost: '฿1,200 - ฿2,500',
    activities: ['Snorkeling', 'Beach', 'Boat Tour', 'Island Hopping'],
  },
  {
    id: 'railay',
    name: 'Railay Beach',
    province: 'Krabi',
    category: 'Beach',
    description: 'A dramatic peninsula beach framed by cliffs and lagoons, perfect for a weekend escape.',
    latitude: 8.0188,
    longitude: 98.8441,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Railay_beach%2C_Krabi_province%2C_Thailand_2018_3.jpg/960px-Railay_beach%2C_Krabi_province%2C_Thailand_2018_3.jpg',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Railay_beach,_Krabi_province,_Thailand_2018_3.jpg', photographer: 'Karelj', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
    rating: 4.8,
    opening: 'Open daily',
    estimatedCost: '฿500 - ฿1,200',
    activities: ['Hiking', 'Kayaking', 'Sunset'],
  },
  {
    id: 'koh-lipe',
    name: 'Koh Lipe',
    province: 'Satun',
    category: 'Island',
    description: 'White-sand beaches and a laid-back island atmosphere with easy snorkeling access.',
    latitude: 6.4902,
    longitude: 99.3088,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Koh_Lipe_%28island%29%2C_Sun%2C_Thailand.jpg/960px-Koh_Lipe_%28island%29%2C_Sun%2C_Thailand.jpg',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Koh_Lipe_(island),_Sun,_Thailand.jpg', photographer: 'Vyacheslav Argenberg', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
    rating: 4.7,
    opening: '08:00 - 20:00',
    estimatedCost: '฿900 - ฿2,200',
    activities: ['Island Hop', 'Island Hopping', 'Sunset', 'Diving'],
  },
  {
    id: 'hong-island',
    name: 'Hong Islands',
    province: 'Krabi',
    category: 'Adventure',
    description: 'Crystal-clear lagoons and dramatic limestone cliffs, ideal for eco-tourism trips.',
    latitude: 8.0417,
    longitude: 98.8485,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/10.Ko_Hong_Island_-_Andaman_Sea_-_Krabi_Province%2C_Thailand.jpg/960px-10.Ko_Hong_Island_-_Andaman_Sea_-_Krabi_Province%2C_Thailand.jpg',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:10.Ko_Hong_Island_-_Andaman_Sea_-_Krabi_Province,_Thailand.jpg', photographer: 'Wolfgang Holzem', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    rating: 4.8,
    opening: '07:30 - 17:30',
    estimatedCost: '฿1,100 - ฿2,400',
    activities: ['Kayaking', 'Canoeing', 'Photography'],
  },
  {
    id: 'koh-lanta',
    name: 'Koh Lanta',
    province: 'Krabi',
    category: 'Nature',
    description: 'A relaxed island with long beaches, scenic roads, and a gentle tropical pace.',
    latitude: 7.6104,
    longitude: 99.0513,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Ko_Lanta_Thailand-7.jpg/960px-Ko_Lanta_Thailand-7.jpg',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ko_Lanta_Thailand-7.jpg', photographer: 'Dronepicr', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
    rating: 4.6,
    opening: 'Open daily',
    estimatedCost: '฿600 - ฿1,500',
    activities: ['Relax', 'Coffee', 'Road Trip'],
  },
  {
    id: 'maya-bay',
    name: 'Maya Bay',
    province: 'Krabi',
    category: 'Viewpoint',
    description: 'A famous bay surrounded by steep cliffs and calm water. Best enjoyed during the day.',
    latitude: 7.7958,
    longitude: 98.7836,
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Playa_Maya%2C_Ko_Phi_Phi%2C_Tailandia%2C_2013-08-19%2C_DD_03.JPG/960px-Playa_Maya%2C_Ko_Phi_Phi%2C_Tailandia%2C_2013-08-19%2C_DD_03.JPG',
    imageAttribution: { source: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Playa_Maya,_Ko_Phi_Phi,_Tailandia,_2013-08-19,_DD_03.JPG', photographer: 'Diego Delso', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    rating: 4.7,
    opening: '08:00 - 16:00',
    estimatedCost: '฿1,500 - ฿2,800',
    activities: ['Boat Ride', 'Swim', 'Photo Spot'],
  },
  {
    id: 'koh-kradan',
    name: 'Koh Kradan',
    province: 'Trang',
    category: 'Quiet island',
    description: 'An island in Trang province with clear coastal water and quiet beach scenery.',
    latitude: 7.3156,
    longitude: 99.2547,
    rating: 4.8,
    opening: 'Open daily',
    estimatedCost: '฿900 - ฿2,000',
    activities: ['Beach', 'Snorkeling', 'Relax', 'Photography'],
  },
  {
    id: 'phang-nga-bay',
    name: 'Phang Nga Bay',
    province: 'Phang Nga',
    category: 'Nature & kayaking',
    description: 'A bay dotted with islands and coastal communities including Ko Yao Noi.',
    latitude: 8.2734,
    longitude: 98.5014,
    rating: 4.8,
    opening: 'Open daily',
    estimatedCost: '฿1,100 - ฿2,400',
    activities: ['Kayaking', 'Boat Tour', 'Photography', 'Nature'],
  },
  {
    id: 'phuket-old-town',
    name: 'Phuket Old Town',
    province: 'Phuket',
    category: 'Culture & food',
    description: 'Explore the historic streets and shophouse architecture of Phuket Town.',
    latitude: 7.8804,
    longitude: 98.3923,
    rating: 4.6,
    opening: 'Open daily',
    estimatedCost: '฿300 - ฿1,000',
    activities: ['Culture', 'Food', 'Photography', 'Walking'],
  },
];

const provinceWeatherSites = [
  ['Phuket', 7.95, 98.34], ['Phang Nga', 8.45, 98.53], ['Krabi', 8.09, 98.91],
  ['Trang', 7.56, 99.61], ['Satun', 6.62, 100.07], ['Ranong', 9.96, 98.63],
  ['Chumphon', 10.49, 99.18], ['Surat Thani', 9.14, 99.33],
  ['Nakhon Si Thammarat', 8.43, 99.96], ['Phatthalung', 7.62, 100.08],
  ['Songkhla', 7.20, 100.60], ['Pattani', 6.87, 101.25], ['Yala', 6.54, 101.28],
  ['Narathiwat', 6.43, 101.82],
].map(([province, latitude, longitude]) => ({
  id: `province-${province.toLowerCase().replaceAll(' ', '-')}`,
  name: province,
  province,
  latitude,
  longitude,
}));
const weatherDestinations = [...destinations, ...provinceWeatherSites];
const weatherProvinceAliases = new Map([
  ['promthep-cape', 'province-phuket'], ['khao-lak', 'province-phang-nga'],
  ['morakot-cave', 'province-trang'], ['tarutao-national-park', 'province-satun'],
  ['koh-phayam', 'province-ranong'], ['raksawarin-hot-springs', 'province-ranong'],
  ['mu-ko-chumphon', 'province-chumphon'], ['thung-wua-laen', 'province-chumphon'],
  ['koh-samui', 'province-surat-thani'], ['khao-sok', 'province-surat-thani'],
  ['wat-phra-mahathat', 'province-nakhon-si-thammarat'], ['khanom', 'province-nakhon-si-thammarat'],
  ['thale-noi', 'province-phatthalung'], ['khao-ok-thalu', 'province-phatthalung'],
  ['songkhla-old-town', 'province-songkhla'], ['samila-beach', 'province-songkhla'],
  ['pattani-central-mosque', 'province-pattani'], ['rusamilae', 'province-pattani'],
  ['aiyerweng-skywalk', 'province-yala'], ['bang-lang-dam', 'province-yala'],
  ['narathat-beach', 'province-narathiwat'], ['hala-bala', 'province-narathiwat'],
  ['wat-chalong', 'province-phuket'], ['kata-beach', 'province-phuket'],
  ['similan-islands', 'province-phang-nga'], ['samet-nangshe', 'province-phang-nga'],
  ['emerald-pool', 'province-krabi'], ['tiger-cave-temple', 'province-krabi'],
  ['khao-kop-cave', 'province-trang'], ['pak-meng-beach', 'province-trang'],
  ['thale-ban-national-park', 'province-satun'], ['stegodon-cave', 'province-satun'],
  ['phu-khao-ya', 'province-ranong'], ['ngao-waterfall', 'province-ranong'],
  ['khao-matsee', 'province-chumphon'], ['koh-ngam-yai', 'province-chumphon'],
  ['ang-thong-marine-park', 'province-surat-thani'], ['cheow-lan-lake', 'province-surat-thani'],
  ['sichon-beach', 'province-nakhon-si-thammarat'], ['kiriwong-village', 'province-nakhon-si-thammarat'],
  ['pak-pra', 'province-phatthalung'], ['khao-chaison-hot-spring', 'province-phatthalung'],
  ['tang-kuan-hill', 'province-songkhla'], ['songkhla-national-museum', 'province-songkhla'],
  ['laem-ta-chi', 'province-pattani'], ['krue-se-mosque', 'province-pattani'],
  ['piyamit-tunnel', 'province-yala'], ['betong-hot-springs', 'province-yala'],
  ['bacho-waterfall', 'province-narathiwat'], ['budo-national-park', 'province-narathiwat'],
]);

const boatRoutes = [
  {
    id: 'phuket-phi-phi',
    destinationId: 'phi-phi',
    departure: 'Phuket',
    destination: 'Phi Phi Islands',
    departureTime: '08:30',
    estimatedDuration: '1h 45m',
    transportType: 'Speedboat',
    price: '฿1,100',
    operator: 'Andaman Wave',
  },
  {
    id: 'krabi-railay',
    destinationId: 'railay',
    departure: 'Krabi',
    destination: 'Railay Beach',
    departureTime: '09:00',
    estimatedDuration: '45m',
    transportType: 'Longtail',
    price: '฿350',
    operator: 'Krabi Boats',
  },
  {
    id: 'krabi-hong-islands',
    destinationId: 'hong-island',
    departure: 'Krabi',
    destination: 'Hong Islands',
    departureTime: '10:30',
    estimatedDuration: '2h 15m',
    transportType: 'Cruise',
    price: '฿1,450',
    operator: 'Sea Horizon',
  },
  {
    id: 'trang-koh-muk',
    destinationId: 'koh-muk',
    departure: 'Trang',
    destination: 'Koh Muk',
    departureTime: '07:30',
    estimatedDuration: '1h 50m',
    transportType: 'Ferry',
    price: '฿570',
    operator: 'Island Link',
  },
  {
    id: 'pak-bara-koh-lipe',
    destinationId: 'koh-lipe',
    departure: 'Pak Bara',
    destination: 'Koh Lipe',
    departureTime: '08:15',
    estimatedDuration: '2h 10m',
    transportType: 'Ferry',
    price: '฿680',
    operator: 'Andaman Jet',
  },
];

const favorites = ['phi-phi', 'railay'];

app.use(cors({ origin: frontendOrigins, credentials: true }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json());
app.use('/api/auth', createAuthRouter({ pool, jwtSecret: process.env.AUTH_JWT_SECRET }));
const eventsRouters = createEventsRouter({ pool, jwtSecret: process.env.AUTH_JWT_SECRET });
app.use('/api/events', eventsRouters.events);
app.use('/api/admin/events', eventsRouters.admin);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'andaman-smart-travel-backend',
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/destinations', (_req, res) => {
  res.json(destinations);
});

app.get('/api/destinations/:id', (req, res) => {
  const item = destinations.find((destination) => destination.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Destination not found' });
  }

  return res.json(item);
});

app.get('/api/weather', async (req, res) => {
  const destinationId = req.query.destination || 'phi-phi';
  if (typeof destinationId !== 'string') {
    return res.status(400).json({ message: 'Destination id must be a single value' });
  }
  const item = weatherDestinations.find((destination) => destination.id === destinationId) ??
    weatherDestinations.find((destination) => destination.id === weatherProvinceAliases.get(destinationId));

  if (!item) {
    return res.status(404).json({ message: 'Destination not found' });
  }

  try {
    return res.json(await weatherService.getWeather(item));
  } catch (error) {
    console.error(`Weather forecast failed for ${destinationId}:`, error);
    return res.status(502).json({ message: 'Weather information unavailable' });
  }
});

app.get('/api/boat-routes', (req, res) => {
  const destinationId = req.query.destinationId;
  if (destinationId !== undefined && typeof destinationId !== 'string') {
    return res.status(400).json({ message: 'Destination id must be a single value' });
  }

  if (destinationId !== undefined && !/^[a-z0-9-]{1,60}$/.test(destinationId)) {
    return res.status(400).json({ message: 'Destination id has an invalid format' });
  }

  const matches = destinationId
    ? boatRoutes.filter((route) => route.destinationId === destinationId)
    : boatRoutes;
  return res.json(matches);
});

app.get('/api/favorites', (_req, res) => {
  const ids = req.query.ids ? String(req.query.ids).split(',') : favorites;
  res.json(destinations.filter((destination) => ids.includes(destination.id)));
});

app.post('/api/favorites', (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ message: 'Destination id is required' });
  }

  const exists = favorites.includes(id);
  if (exists) {
    favorites.splice(favorites.indexOf(id), 1);
  } else {
    favorites.push(id);
  }

  return res.json({ favorites, count: favorites.length });
});

app.get('/api/recommendations', (req, res) => {
  const interestValue = req.query.interest ?? 'Beach,Diving';
  if (typeof interestValue !== 'string') {
    return res.status(400).json({ message: 'Interest must be a comma-separated string' });
  }

  const interests = interestValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (interests.length > 10 || interests.some((interest) => interest.length > 40)) {
    return res.status(400).json({ message: 'Select up to 10 interests, each no longer than 40 characters' });
  }

  const favoriteValue = req.query.favorite;
  if (favoriteValue !== undefined && typeof favoriteValue !== 'string') {
    return res.status(400).json({ message: 'Favorite ids must be a comma-separated string' });
  }
  const favoriteIds = favoriteValue === undefined
    ? favorites
    : favoriteValue.split(',').filter((id) => destinations.some((place) => place.id === id));

  return res.json(scoreRecommendations(destinations, interests, favoriteIds));
});

app.use((error, req, res, _next) => {
  console.error(`Request failed for ${req.method} ${req.path}:`, error);
  if (error.code === '23505') return res.status(409).json({
    message: req.path.startsWith('/api/auth/') ? 'An account with this email already exists.' : 'An event with these details already exists',
  });
  if (error.code === '23503' || error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ message: 'Event data violates a database constraint' });
  }
  return res.status(503).json({ message: 'The event service is temporarily unavailable' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Andaman Smart Travel API listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, pool };
