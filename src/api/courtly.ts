import { api } from './client';
import type {
  AuthUser,
  AvailabilityResponse,
  Booking,
  BookingFilter,
  CreateBookingPayload,
  FacilityDetail,
  FacilitySummary,
  LoginResponse,
  Paginated,
  SportOption,
} from '../types';

export interface FacilityFilters {
  search?: string;
  sport?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export async function register(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/v1/auth/register', payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/v1/auth/login', payload);
  return data;
}

export async function fetchFacilities(filters: FacilityFilters) {
  const { data } = await api.get<Paginated<FacilitySummary>>('/v1/facilities', {
    params: {
      search: filters.search || undefined,
      sport: filters.sport || undefined,
      city: filters.city || undefined,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    },
  });
  return data;
}

export async function fetchFacilityDetail(id: string) {
  const { data } = await api.get<FacilityDetail>(`/v1/facilities/${id}`);
  return data;
}

export async function fetchSports() {
  const { data } = await api.get<{ data: SportOption[] }>('/v1/sports');
  return data.data;
}

export async function fetchCities() {
  const { data } = await api.get<{ data: string[] }>('/v1/cities');
  return data.data;
}

export async function fetchAvailability(facilityId: string, date: string) {
  const { data } = await api.get<AvailabilityResponse>(
    `/v1/facilities/${facilityId}/availability`,
    { params: { date } },
  );
  return data;
}

export async function createBooking(payload: CreateBookingPayload) {
  const { data } = await api.post<Booking>('/v1/bookings', payload);
  return data;
}

export async function fetchBookings(status?: BookingFilter) {
  // API returns either a bare array or { data: [...] }; normalize both.
  const { data } = await api.get<Booking[] | { data: Booking[] }>('/v1/bookings', {
    params: status ? { status } : undefined,
  });
  return Array.isArray(data) ? data : data.data;
}

export async function fetchBookingDetail(id: string) {
  const { data } = await api.get<Booking>(`/v1/bookings/${id}`);
  return data;
}

export async function cancelBooking(id: string) {
  const { data } = await api.delete<Booking>(`/v1/bookings/${id}`);
  return data;
}

export type { AuthUser };
