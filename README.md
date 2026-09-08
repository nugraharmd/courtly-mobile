# Courtly — Sports Facility Booking (React Native + Expo + TypeScript)

Courtly is a mobile application built with React Native + Expo + TypeScript for discovering sports facilities, checking real-time hourly court availability, and reserving court slots.

- **API base URL:** `https://courtly-api.hyge.web.id`
- **API docs (Swagger):** `https://courtly-api.hyge.web.id/api/docs`

## Tech Stack

| Layer | Choice |
|---|---|
| App framework | Expo SDK 57 (React Native, TypeScript) |
| Navigation | Expo Router (file-based: `(auth)`, `(tabs)`, `facility/[id]`, `facility/[id]/book`, `booking/[id]`) |
| Data fetching | TanStack Query v5 (caching, infinite scroll, invalidation) |
| Auth state | Zustand + `expo-secure-store` |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| HTTP | Axios with `Authorization: Bearer <token>` interceptor + 401 auto-logout |
| Styling | `StyleSheet` + `expo-linear-gradient` gradients |

## Required Modules — Why They Are Used

| Module | Why |
|---|---|
| `expo-secure-store` | Stores the JWT access token and user profile encrypted at rest (Keychain/Keystore). Restored on launch for persistent sessions; cleared on logout or 401. |
| `expo-image` | Facility photos with caching, transitions, and `contentFit="cover"` for smooth scrolling lists. |
| `expo-haptics` | Tactile feedback on slot taps, navigation, booking success/error for a native feel. |
| `expo-calendar` | "Add to calendar" on booking detail — requests permission, picks a writable calendar, and creates an event with facility/court/date/time + booking reference. Android `READ/WRITE_CALENDAR` + iOS usage descriptions are configured in `app.json`. |
| `expo-linear-gradient` | Branded gradients on auth hero, login/register CTA, booking CTA, and profile header. |

## Build / Download

EAS build: `...`  

## Project Setup

### Prerequisites

- Node.js 20+ · npm
- Expo Go app on a device, or an Android emulator / iOS simulator
- No backend setup needed — the app talks to the hosted Courtly API.

### Install

```bash
npm install
```

### Environment configuration

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://courtly-api.hyge.web.id` | Courtly REST API base URL |

> `EXPO_PUBLIC_*` vars are inlined into the JS bundle by Expo. The axios client (`src/api/client.ts`) falls back to the hosted URL when unset.

### How to run

```bash
npx expo start          # scan QR with Expo Go
npx expo start --android
npx expo start --ios
npx expo start --web
npm run lint            # tsc --noEmit typecheck
```

## API Configuration

`src/api/client.ts` — axios instance with base URL, 20s timeout, request interceptor attaching `Authorization: Bearer <token>`, and a response interceptor that triggers a global `onUnauthorized` logout on HTTP 401.

`src/api/courtly.ts` — typed wrappers:

| Function | Endpoint |
|---|---|
| `register` | `POST /v1/auth/register` |
| `login` | `POST /v1/auth/login` |
| `fetchFacilities` | `GET /v1/facilities?search&sport&city&page&limit` |
| `fetchFacilityDetail` | `GET /v1/facilities/:id` |
| `fetchSports` / `fetchCities` | `GET /v1/sports`, `GET /v1/cities` |
| `fetchAvailability` | `GET /v1/facilities/:id/availability?date=YYYY-MM-DD` |
| `createBooking` | `POST /v1/bookings` `{ courtId, date, startTime, endTime }` |
| `fetchBookings` | `GET /v1/bookings?status=UPCOMING|PAST|CANCELLED` |
| `fetchBookingDetail` | `GET /v1/bookings/:id` |
| `cancelBooking` | `DELETE /v1/bookings/:id` |

Pagination shape: `{ data, pagination: { page, limit, total, totalPages } }`. The bookings list normalizes both bare-array and `{ data }` responses.

## Authentication Flow

1. **Register** (`app/(auth)/register.tsx`) → `POST /v1/auth/register` with Zod-validated name/email/strong password.
2. **Login** (`app/(auth)/login.tsx`) → `POST /v1/auth/login`.
3. On success, `src/store/auth-store.ts` saves `{ accessToken, user }` via `expo-secure-store` and calls `setApiToken()` so every protected request carries the Bearer header.
4. **Persistence:** `restore()` runs at startup (`app/_layout.tsx`) reading token+user from SecureStore.
5. **Expiry:** any 401 triggers `onUnauthorized → signOut()` (token cleared, user sent back to login via the `AuthGate` segment guard).
6. **Logout:** Profile tab → clears SecureStore + in-memory token.

## Main Features

- **Browse facilities** (`app/(tabs)/index.tsx`) — debounced search, horizontal sport/city filter chips (from `/v1/sports`, `/v1/cities`), `useInfiniteQuery` infinite scroll (`page/limit`, `totalPages`), pull-to-refresh. Cards show name, location, rating, sports, starting price, image.
- **Facility detail** (`app/facility/[id].tsx`) — photo, description, address, rating, sports, amenities, courts + pricing, CTA to booking flow.
- **Availability & booking** (`app/facility/[id]/book.tsx`) — 14-day date strip (defaults to today), per-court hourly slots 07:00–22:00 from API with available/booked states, consecutive-hour selection (tapping across a booked slot restarts the range), live `court · start–end · N h` + total summary, `POST /v1/bookings`, success alert navigates to booking detail, queries invalidated.
- **My bookings** (`app/(tabs)/bookings.tsx`) — Upcoming / Past / Cancelled tabs backed by `?status=`, each row shows facility, court, date, time, status pill, booking reference, total; tap opens detail.
- **Booking detail** (`app/booking/[id].tsx`) — full breakdown (price, service fee, total), **Cancel** (with confirm dialog, only when `CONFIRMED`), **Add to calendar** via `expo-calendar`.
- **Profile** (`app/(tabs)/profile.tsx`) — user info + logout.

## Project Structure

```
app/                  # Expo Router screens (file-based routing)
  (auth)/             # Login & register screens
  (tabs)/             # Bottom-tab screens (explore, bookings, profile)
  facility/           # Facility detail & booking flow
  booking/            # Booking detail screen
src/                  # Shared app logic (non-route code)
  api/                # Axios client + typed API wrappers
  components/         # Reusable UI components
  store/              # Zustand auth state + persistence
assets/               # Static images & icons
  images/             # App icon, adaptive icon, splash
releases/             # Built APK output from EAS
.env.example          # Example env vars (API base URL)
app.json              # Expo config (name, icons, plugins, permissions)
babel.config.js       # Babel preset for Expo
eas.json              # EAS build profiles
package.json          # Dependencies & npm scripts
package-lock.json     # Locked dependency versions
tsconfig.json         # TypeScript config & path alias
```

## Notes / Assumptions

- Availability slots come entirely from the API (`price`, `available` per hour)
- Booking payload sends the full consecutive range as `{ courtId, date, startTime, endTime }`.
- Booking list filter maps 1:1 to the API `status` query (`UPCOMING`/`PAST`/`CANCELLED`).
