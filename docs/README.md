# Andaman Smart Travel

This project includes a full-stack travel platform for discovering, planning, and recommending destinations across the Andaman coast of southern Thailand.

## Stack

- Frontend Web: Angular
- Mobile: Ionic + Angular
- Backend: Node.js + Express
- Database: PostgreSQL (recommended)
- Workflow orchestration: Node-RED
- Containerization: Docker + Docker Compose

## Why PostgreSQL

PostgreSQL is the recommended database for this project because it is excellent for geographic and travel data, supports JSONB for weather and recommendation payloads, and provides strong relational features for favorites, routes, and destination records. MySQL is also viable, but PostgreSQL is better suited for flexible structured data and future analytics.

## Design system

The Andaman Ocean Luxury design tokens are defined in `frontend/src/styles/_tokens.scss` and mirrored as Ionic CSS variables in `mobile/src/theme/andaman.scss`. Use the existing palette, typography, spacing, radius, and motion variables for new UI rather than introducing page-specific values. Shared web components and typography styles live in `frontend/src/styles/_components.scss` and `frontend/src/styles/_typography.scss`.

## Destination image catalog

Web and mobile use the shared place records in `shared/data/places.data.ts` and the image/attribution catalog in `shared/data/images.data.ts`. Each photo stores its Wikimedia Commons file page, photographer, license, alt text, and a local province-specific fallback. Keep photo URLs in that catalog rather than templates or component styles. The five local fallback illustrations are only shown if a licensed photo fails to load; they are not destination photos.

The Home page province cards use the shared `provinceProfiles` catalog for the five Andaman provinces. Place counts are derived from the destination records so they remain in sync as destinations are added. Selecting a province filters the recommended destinations; province detail pages are a separate later phase.

The Experience Andaman video cards use `shared/data/videos.data.ts`. Each entry identifies its province, YouTube video ID, channel, title, description, thumbnail, source link, and local thumbnail fallback. Video metadata was checked against YouTube oEmbed; the embedded player is created only after a user opens a video. The app embeds the original YouTube player rather than downloading or redistributing video files.

## Startup

1. Copy the example environment file:
   `cp backend/.env.example backend/.env`
2. Install dependencies:
   `cd frontend && npm install`
   `cd ../mobile && npm install`
   `cd ../backend && npm install`
3. Run backend:
   `cd backend && npm run dev`
4. Run web frontend:
   `cd frontend && npm start`
5. Run mobile app:
   `cd mobile && npm start`
6. Or run the full stack with Docker:
   `docker compose up --build`

## Important note

The boat route and weather data in the project are example/mock data only. They are intentionally not presented as real-time live data unless a valid external API is configured and connected.

## API endpoints

- GET /health
- GET /api/destinations
- GET /api/destinations/:id
- GET /api/weather?destination=phi-phi
- GET /api/boat-routes
- GET /api/favorites
- POST /api/favorites
- GET /api/recommendations?interest=Beach,Diving&favorite=phi-phi,railay
