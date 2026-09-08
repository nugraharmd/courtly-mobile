# Courtly — Sports Facility Booking (React Native + Expo + TypeScript)

Courtly lets users browse sports facilities, check court availability, book hourly slots (07:00–22:00), and manage their bookings — with secure auth, persistent sessions, and add-to-calendar support.

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
app/
  _layout.tsx            # QueryClient, SafeArea, AuthGate (session restore + route guard)
  index.tsx              # root redirect
  (auth)/_layout.tsx     # auth stack
  (auth)/login.tsx       # RHF+Zod login
  (auth)/register.tsx    # RHF+Zod register
  (tabs)/_layout.tsx     # bottom tabs
  (tabs)/index.tsx       # explore: search/filter/infinite scroll
  (tabs)/bookings.tsx    # upcoming/past/cancelled
  (tabs)/profile.tsx     # user + logout
  facility/[id].tsx      # facility detail
  facility/[id]/book.tsx # availability + booking
  booking/[id].tsx       # booking detail, cancel, calendar
src/
  api/client.ts          # axios + token + 401 handling
  api/courtly.ts         # typed endpoint wrappers
  store/auth-store.ts    # zustand auth + SecureStore persistence
  components/FacilityCard.tsx
  components/ui.tsx      # Screen/Loading/Error/Empty states
  theme.ts               # colors, IDR/date helpers, slot math
  types.ts               # API DTOs
app.json                 # Expo config (router, calendar + SecureStore plugins, permissions)
```

## Notes / Assumptions

- Availability slots come entirely from the API (`price`, `available` per hour); the UI renders exactly what the server returns for 07:00–22:00.
- Booking payload sends the full consecutive range as `{ courtId, date, startTime, endTime }`.
- Booking list filter maps 1:1 to the API `status` query (`UPCOMING`/`PAST`/`CANCELLED`).
