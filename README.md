# Andaman Smart Travel

A full-stack smart tourism platform for the Andaman coast of southern Thailand.

## เผยแพร่เว็บไซต์ด้วย GitHub Pages

เมื่อ push โค้ดไปยัง branch `main` GitHub Actions จะ build เว็บ Angular และเผยแพร่ให้โดยอัตโนมัติ
ตั้งค่า repository ที่ **Settings → Pages → Build and deployment → Source → GitHub Actions** ก่อนการเผยแพร่ครั้งแรก

ตัวเว็บไซต์แบบ static ใช้ค้นหาจังหวัดและสถานที่ ดูแผนที่ สลับภาษา และจัด Trip Planner ซึ่งบันทึกไว้ในอุปกรณ์ของผู้ใช้
GitHub Pages ไม่ได้รัน Node.js, PostgreSQL หรือ Node-RED ดังนั้น login, สภาพอากาศสด, API กิจกรรม และ API ผู้ดูแล
ต้องนำ backend ไปติดตั้งบนบริการที่รองรับ server แล้วกำหนด URL API สำหรับ production ก่อนจึงจะใช้ฟังก์ชันเหล่านั้นได้

## Included

- Web frontend: Angular
- Mobile app: Ionic + Angular
- Backend API: Node.js + Express
- Database schema: PostgreSQL-ready SQL
- Workflow integration: Node-RED
- Container setup: Docker Compose

## Purpose

The project helps travelers find destinations, check weather and sea conditions, save favorites, and receive recommendations based on user interests and trip preferences.

## Responsive layouts

The Web Home page switches to a touch-friendly navigation menu at viewport widths of 840px and below; the menu exposes the same section links as the desktop navigation and closes after a selection. Home-page destination, province, experience, trip-planning, and boat-route sections reflow for narrow screens. The Ionic app uses its tab navigation and fluid page layouts for phone-sized viewports.

## Performance

Wikimedia Commons images use browser-selected 250px, 330px, 500px, and 960px thumbnail candidates (the standard sizes accepted for direct Wikimedia thumbnail requests) with layout-specific `sizes`; below-the-fold images load lazily, while the hero image is prioritized. If a remote image fails, its responsive candidates are cleared before the local fallback is used. Video thumbnails load lazily and YouTube iframes are only created after a traveler chooses a video. The interactive map is deferred on Web and loaded through the Mobile map route rather than the initial Home chunk.

## คู่มือแก้รูปภาพและวิดีโอรายจังหวัด (ภาษาไทย)

### แก้รูปหน้าจังหวัด

ไฟล์รูปอยู่ที่ `shared/data/images.data.ts` ค้นหาคอมเมนต์ `IMAGE: ชื่อจังหวัด` ในส่วน `provinceShowcaseImages` เพื่อเลือกรูปของจังหวัดนั้น รูปหลักถูกกำหนดด้วย asset ในออบเจ็กต์ `imageAssets` ด้านบนไฟล์

1. ค้นหา asset ตามชื่อที่คอมเมนต์ระบุ เช่น `imageAssets.yala` หรือ `imageAssets.phuketOldTown`
2. เปลี่ยนค่า `url` เป็นที่อยู่รูป และปรับ `alt` ให้บอกเนื้อหาภาพ
3. อัปเดตเครดิตให้ครบ: `source`, `sourceUrl`, `photographer`, `license` และ `licenseUrl`
4. คง `imageForProvince(imageAssets.ชื่อAsset, 'ชื่อจังหวัด')` ไว้ เพื่อให้รูปสำรองในเครื่องเป็นของจังหวัดนั้นเมื่อรูปออนไลน์โหลดไม่ได้

| จังหวัด | asset รูปหน้าจังหวัด |
| --- | --- |
| ภูเก็ต | `phuketOldTown` |
| พังงา | `phangNgaBay` |
| กระบี่ | `railay` |
| ตรัง | `kohKradan` |
| สตูล | `kohLipe` |
| ระนอง | `ranong` |
| ชุมพร | `chumphon` |
| สุราษฎร์ธานี | `suratThani` |
| นครศรีธรรมราช | `nakhonSiThammarat` |
| พัทลุง | `phatthalung` |
| สงขลา | `songkhla` |
| ปัตตานี | `pattani` |
| ยะลา | `yala` |
| นราธิวาส | `narathiwat` |

รูปสถานที่ท่องเที่ยวกำหนดแยกจากรูปหน้าจังหวัดใน `shared/data/places.data.ts` ส่วน `attractionImages` จับคู่รหัสสถานที่กับ asset เช่น `thale-noi` ใช้ `imageAssets.thaleNoi` หากต้องการเปลี่ยนรูปเฉพาะสถานที่ ให้แก้ asset หรือการจับคู่รหัสนั้น โดยใส่เครดิตและลิงก์สิทธิ์การใช้งานของรูปให้ครบเช่นเดียวกัน

### แก้วิดีโอจังหวัด

รายการวิดีโออยู่ใน `shared/data/videos.data.ts` ส่วน `andamanVideos` มีคอมเมนต์ `VIDEO: ชื่อจังหวัด` กำกับ ปัจจุบันมีคลิปคัดไว้สำหรับภูเก็ต พังงา กระบี่ ตรัง และสตูล จังหวัดที่ยังไม่มีคลิปจะแสดงปุ่มค้นหา YouTube ตามชื่อจังหวัดแทน

ในรายการ `video(...)` ให้แก้ค่าต่อไปนี้:

- `id`: รหัสรายการที่ไม่ซ้ำกัน เช่น `phuket-aerial`
- `province`: ชื่อจังหวัดภาษาอังกฤษตามชนิด `AndamanProvince`
- `title` และ `description`: ชื่อคลิปและคำอธิบาย
- `youtubeId`: รหัส 11 ตัวจาก URL เช่น `https://www.youtube.com/watch?v=รหัสวิดีโอ`
- `channel`: ชื่อช่องของผู้เผยแพร่คลิป

หากเพิ่มวิดีโอให้จังหวัดที่ยังไม่มี ให้เพิ่ม `video(...)` อีกหนึ่งรายการใน `andamanVideos` โดยใช้ชื่อจังหวัดให้ตรงและไม่ซ้ำกับคลิปเดิม คอมเมนต์ `VIDEO SEARCH FALLBACK` ใน `frontend/src/app/app.ts` ชี้ตำแหน่งที่สร้างลิงก์ค้นหาอัตโนมัติสำหรับจังหวัดที่ไม่มีคลิปคัดไว้

หลังแก้รูปหรือวิดีโอ ให้ตรวจจากโฟลเดอร์ `frontend` ด้วย `npm test -- --watch=false` และ `npm run build`

### เพิ่มสถานที่ท่องเที่ยวในจังหวัด

ข้อมูลสถานที่อยู่ใน `shared/data/places.data.ts` รายการทั้งหมดถูกรวมไว้ใน `destinations` และนำไปใช้ในหน้าค้นหา คำแนะนำ แผนที่ รายละเอียดสถานที่ และ Trip Planner

1. เพิ่มรูปของสถานที่ใน `imageAssets` ของ `shared/data/images.data.ts` พร้อมข้อความ `alt` และข้อมูลแหล่งที่มา/สิทธิ์ใช้งาน
2. ใน `shared/data/places.data.ts` เพิ่มการจับคู่รหัสใน `attractionImages` โดย `id` ต้องตรงกัน เช่น `waterfall-ranong`
3. เพิ่มสถานที่ใน `provinceShowcasePlaces` โดยใช้ helper `notablePlace(...)` หรือคัดลอกรายการ object ที่อยู่ใกล้เคียง
4. กำหนด `latitude` และ `longitude` ของสถานที่จริง เพราะใช้ปักหมุดแผนที่และสร้างลิงก์แผนที่
5. เพิ่มชื่อภาษาไทยของสถานที่ในเมธอด `placeName()` ของ `frontend/src/app/app.ts` เพื่อให้สลับภาษาแล้วแสดงชื่อได้ถูกต้อง

ตัวอย่างโครงสร้างการเพิ่มสถานที่แบบย่อ (เปลี่ยนชื่อ รายละเอียด พิกัด และรูปให้ตรงกับสถานที่จริง):

```ts
// ใน attractionImages ของ shared/data/places.data.ts
'waterfall-ranong': imageForProvince(imageAssets.ngaowaterfall, 'Ranong'),

// เพิ่มใน provinceShowcasePlaces
notablePlace(
  'waterfall-ranong',
  'ชื่อสถานที่ภาษาอังกฤษ',
  'Ranong',
  'Waterfall & nature',
  'คำอธิบายภาษาอังกฤษ',
  9.85, 98.63,
  ['Nature', 'Photography'],
),
```

ตรวจว่า `id` ไม่ซ้ำกับสถานที่อื่น ชื่อจังหวัดต้องสะกดตรงกับ `AndamanProvince` เช่น `'Nakhon Si Thammarat'` และรูปต้องเป็นรูปของสถานที่ที่ระบุจริง หากต้องการเพิ่มรูปหลายรูปในหน้ารายละเอียด ให้ใส่ใน `gallery` ของ object สถานที่นั้น

### เพิ่มหรือแก้จังหวัด

การเพิ่มสถานที่ในจังหวัดที่มีอยู่แล้วไม่ต้องแก้รายชื่อจังหวัด หากต้องเพิ่มจังหวัดใหม่ ให้ค้นหาและปรับส่วนต่อไปนี้ให้ครบ:

- เพิ่มชื่อจังหวัดใน `AndamanProvince` ที่ `shared/data/images.data.ts` และในรายการ `southernProvinces` ที่ `shared/data/provinces.data.ts`
- เพิ่มรูปสำรอง SVG ประจำจังหวัดใน `frontend/public/assets/image-fallbacks/` และเพิ่มเส้นทางไฟล์ใน `fallbackByProvince`
- เพิ่มรูปหน้าจังหวัดใน `provinceShowcaseImages` และข้อมูลรายละเอียด/พิกัดใน `provinceProfiles` ของ `shared/data/places.data.ts`
- เพิ่มสถานที่ท่องเที่ยวอย่างน้อยหนึ่งแห่งพร้อมพิกัดจริง เพื่อให้จังหวัดมีข้อมูลในหน้าแผนที่และ Trip Planner
- ตรวจตัวเลือกจังหวัดของสภาพอากาศและ event calendar ว่าอ่านจังหวัดจากรายการกลางได้ครบ

### แก้ชื่อหรือคำแปลภาษาไทย/อังกฤษ

หน้าแรกใช้เมธอด `text(อังกฤษ, ไทย)` และเมธอดแปลชื่อจังหวัด/สถานที่ใน `frontend/src/app/app.ts` หากเพิ่มสถานที่ใหม่ ให้เพิ่มชื่อไทยใน `placeName()` ด้วย หากเพิ่มกิจกรรมความสนใจใหม่ ให้เพิ่มคำแปลใน `interestName()` และตรวจว่า API คำแนะนำรองรับหมวดกิจกรรมใหม่นั้น

### กิจกรรมประจำจังหวัดและผู้ดูแล

หน้าแสดงกิจกรรมอยู่ที่เมนู **Local events / กิจกรรมท้องถิ่น** และผู้ดูแลจัดการได้ที่ `/admin/events` บัญชีทั่วไปไม่มีสิทธิ์แก้กิจกรรม หากต้องตั้งบัญชีเป็นผู้ดูแล ให้ล็อกอินบัญชีนั้นก่อน แล้วรัน SQL ต่อไปนี้กับ PostgreSQL ของโปรเจกต์ และล็อกอินใหม่:

```sql
UPDATE app_users SET role = 'admin' WHERE email = 'อีเมลบัญชีของคุณ';
```

เพิ่ม/แก้กิจกรรมจากหน้าผู้ดูแล หรือใช้ API `/api/admin/events` พร้อม bearer token ของผู้ดูแล กิจกรรมตัวอย่างที่มี `[MOCK SAMPLE]` เป็นข้อมูลจำลอง ไม่ใช่ประกาศงานจริง ก่อนเผยแพร่ให้ตรวจวัน เวลา สถานที่ และ URL กับแหล่งทางการของผู้จัด

### รันเว็บ แอปมือถือ และ backend

เปิด PowerShell ที่โฟลเดอร์โปรเจกต์ แล้วติดตั้ง dependencies ครั้งแรก:

```powershell
cd frontend
npm install
npm start
```

เว็บเปิดที่ `http://localhost:4200` ส่วน backend เปิดอีกหน้าต่าง PowerShell:

```powershell
cd backend
npm install
npm run dev
```

แอป Ionic ใช้ `cd mobile; npm install; npm start` สำหรับทดสอบในเบราว์เซอร์ หากแก้เว็บแอปแล้วต้องการซิงก์เข้า Android ให้รัน `npm run android:sync` ในโฟลเดอร์ `mobile` จากนั้นเปิด Android Studio ด้วย `npm run android:open`

หากต้องการเปิดระบบทั้งหมดด้วย Docker ให้ใช้คำสั่งจากโฟลเดอร์โปรเจกต์หลัก:

```powershell
Copy-Item .env.example .env
# แก้ POSTGRES_PASSWORD และ AUTH_JWT_SECRET ใน .env ก่อนใช้
docker compose up --build -d
```

### ตรวจโค้ดหลังแก้

รันคำสั่งต่อไปนี้จากโฟลเดอร์ `frontend` หลังแก้ข้อมูลหน้าเว็บ:

```powershell
npm test -- --watch=false
npm run build
```

ทดสอบ backend จากโฟลเดอร์ `backend` ด้วย `npm test` หากรันด้วย Docker ให้ตรวจสถานะด้วย `docker compose ps` และดูบันทึกปัญหาด้วย `docker compose logs -f frontend backend`

## Startup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Web frontend

```bash
cd frontend
npm install
npm start
```

### Mobile app

Run the Ionic app in a browser for development:

```bash
cd mobile
npm install
npm start
```

### Android app (Android Studio)

Install a Node.js version supported by the Angular toolchain (`^22.22.3`,
`^24.15.0`, or `>=26.0.0`), plus Android Studio with the Android SDK. From the
repository root, build the web app and sync it to the native Android project:

```bash
cd mobile
npm install
npm run android:sync
npm run android:open
```

Android Studio opens the `mobile/android` project. Select an emulator or
connected Android device and use **Run** to launch the app. After changing the
web app, run `npm run android:sync` again before launching it from Android
Studio. To use the backend from a physical device, set the mobile API URL to a
backend address reachable on your network; `localhost` on the device refers to
the device itself.

### Docker

Install Docker Desktop and make sure its Linux container engine is running. In PowerShell, create the local Compose environment file and start the services:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Before starting, replace `POSTGRES_PASSWORD` and `AUTH_JWT_SECRET` in `.env` with unique local values; the JWT secret must contain at least 32 bytes. Open the Web app at `http://localhost:4200`, choose **Login**, and create an account. Its Nginx server serves the production Angular build, proxies `/api` and `/health` to the backend, and falls back to `index.html` for Angular routes. The backend and PostgreSQL ports are also published on loopback only (`3001` and `5432` by default); adjust the root `.env` file to change these ports. Use `docker compose logs -f` to follow logs and `docker compose down` to stop the stack. The PostgreSQL named volume is retained by `down`; `docker compose down -v` deletes that volume and its data.

Node-RED is optional and starts only when requested: `docker compose --profile tools up --build -d`. Its editor is bound to localhost on port `1880` by default; do not expose it to an untrusted network without configuring authentication.

The event calendar and user accounts are stored in PostgreSQL. Destination catalog, recommendations, and sample boat routes remain in the app catalog. Existing PostgreSQL volumes do not rerun initialization scripts; apply new SQL files in `database/migrations` manually to existing databases.

## Weather service

Weather is served by the backend through `GET /api/weather?destination=phi-phi`. The backend currently uses the Open-Meteo forecast and marine APIs, so no API key is required or stored in the application. Provider requests have a timeout, current reports are cached briefly, and forecast-provider failures return HTTP 502 so Web and Mobile can show an unavailable state and Retry action. Marine data is optional; when it cannot be fetched the UI says so rather than presenting sample wave conditions.

For Docker, set `POSTGRES_PASSWORD` in the root `.env` file (start from `.env.example`); its checked-in value is only a local-development example and must be replaced outside local development. For a standalone backend, copy `backend/.env.example` to `backend/.env`. In development, localhost origins on ports 4200, 4201, and 4300 are allowed in addition to configured `FRONTEND_URL` origins; production only allows configured origins. Add the origin used by a deployed site or native Capacitor app as appropriate. `OPEN_METEO_FORECAST_URL`, `OPEN_METEO_MARINE_URL`, `WEATHER_REQUEST_TIMEOUT_MS`, and `WEATHER_CACHE_TTL_MS` configure the provider endpoints and request/cache behavior. Open-Meteo attribution is displayed in the weather panels. Weather and wave data are model estimates, not safety advisories; confirm conditions with local authorities and boat operators.

The Web and Mobile clients use `apiUrl` in their respective `src/environments/environment*.ts` files. The defaults target `http://localhost:3001`; for a physical phone or a deployed application, set these values to a backend URL reachable by that device before building.

## Personalized recommendations

The Home page on Web and Mobile requests ranked places from `GET /api/recommendations`. Choose one or more interests to refresh the ranking; saved places add a small personalization signal. Each result includes a bounded match score and the interests/reason used to explain the ranking. The ranking uses destination activities, category, and rating; it does not claim to use a machine-learning model or live user history. If the API is unavailable, both clients calculate the same ranking locally from the shared destination catalog and label it as on-device data.

The endpoint accepts comma-separated `interest` and `favorite` query parameters. It supports up to 10 interests (40 characters each) and returns ranked recommendation records containing only each destination ID, match score, matched interests, and explanation; display data and images remain in the client catalog.

## Boat routes

Web shows searchable route cards on the Home page; Mobile has a Boat Routes tab; destination details show routes for the selected destination. `GET /api/boat-routes` returns departure, destination, sample departure time, estimated duration, transport type, indicative fare, and listed operator. Use `?destinationId=phi-phi` to filter by destination. Current route values are sample planning data, not live schedules, fares, operator availability, or bookable tickets. Map links search for relevant pier information; they do not represent a verified boat navigation route.

## Favorites

Web and Mobile let travelers save destinations from recommendation cards or destination detail pages, view the saved collection, and remove items. Favorites persist in browser/device local storage and are limited to the current device; they do not sync to another device or account. The favorites tab/page shows an empty state until a destination is saved. The unauthenticated backend favorites endpoints are prototype-only and are not used as a shared account store. Account-based synchronization requires the authentication and database phases.

## Trip planner

The Web Home page and Mobile Trips tab let travelers choose a start date and trip length, add destinations from the catalog or saved places, assign each stop to a trip day, and remove or clear stops. Plans autosave in device local storage and are shared between Web and Mobile when they run in the same browser storage; they are not account-synced. Reducing the trip length moves stops on removed days to the last remaining day. The planner is an itinerary organizer, not a booking service; travelers should confirm local transport, opening information, and conditions.

## Destination detail pages

Open a destination from a Web or Mobile destination card, or navigate directly to `/places/phi-phi`. Detail pages include destination information, live weather and a five-day forecast, activities, an attributed photo gallery with keyboard and touch navigation, map links, nearby places, and boat-route examples. Reviews are not enabled, so the page does not display fabricated user reviews. Gallery photos use the shared Wikimedia Commons catalog and include photographer and license credits.

## Interactive destination map

The Web Home map and Mobile Map tab use Leaflet with OpenStreetMap tiles and the destination coordinates in `shared/data/places.data.ts`. Selecting a marker shows its photo and attribution, live weather and sample rating, a straight-line distance from Phi Phi Islands, and links to the detail page and Google Maps directions. Tile attribution is shown on the map. Tile loading requires an internet connection; ratings and distance estimates are informational and are not live route data.

## API examples

- `GET /health`
- `GET /api/destinations`
- `GET /api/weather?destination=phi-phi`
- `GET /api/boat-routes`
- `GET /api/favorites`
- `POST /api/favorites`
- `GET /api/recommendations?interest=Beach,Diving`
- `POST /api/auth/register` with an email and password (10–128 characters)
- `POST /api/auth/login` with an email and password
- `GET /api/auth/me` with a bearer token

### Backend tests

```bash
cd backend
npm test
```

## Local events

The ANDAMAN LOCAL EVENTS feature includes a province/month calendar, event detail links, a mobile Events tab, and an administrator page at `/admin/events`. Public events are served by the PostgreSQL-backed Express API. Event records store category, location, schedule, source links, verification status, and publication status. The monthly endpoint returns events whose dates overlap the requested month:

- `GET /api/events/monthly?province=Krabi&month=11&year=2026`
- `GET /api/events/:slug`
- `GET /api/events/categories`
- `GET /api/admin/events` (administrator JWT required)
- `POST /api/admin/events`, `PUT /api/admin/events/:id`, `PATCH /api/admin/events/:id/status`, and `DELETE /api/admin/events/:id` (administrator JWT required)

New accounts receive the `user` role and a seven-day signed access token; passwords are stored using Node's scrypt password hash. Set `AUTH_JWT_SECRET` to a random value with at least 32 bytes. To grant a trusted account event-management access, run `UPDATE app_users SET role = 'admin' WHERE email = 'your-email@example.com';` in PostgreSQL, then sign in again. The admin screen uses the token from the signed-in session.

The optional Node-RED profile proxies event routes at `http://localhost:1880/api/events` and protected admin routes at `http://localhost:1880/api/admin/events`, forwarding the bearer token to Express. Client environments may set `eventsApiUrl` to `http://localhost:1880` to route event requests through Node-RED; blank uses the normal `apiUrl`. For the Docker web build, update `frontend/src/environments/environment.docker.ts` and rebuild the frontend if you want this optional proxy path.

Fresh PostgreSQL volumes load `database/migrations/002_local_events.sql` and `database/seeds/003_local_events_mock.sql` on first initialization. The seed contains three conspicuously titled `[MOCK SAMPLE]` records with illustrative dates; they are published only so the calendar can be previewed, marked unverified in the UI, and must not be treated as real event listings. They are not sourced from official event notices. Existing named volumes do not rerun initialization scripts: apply the migration and seed manually with `psql` if you want the sample records in an existing local database. Replace or remove those records after curating official event information.

Selecting **Add event to trip plan** maps the event province to an existing destination and sets the trip start date when the event has a schedule. The itinerary stores the destination stop, not an event booking; travelers should verify event details with the organizer.

AI-ranked destination cards also link to events in the recommended destination's province, carrying that province into the calendar filter. The recommendation model itself still ranks destinations; it does not rank event records.
