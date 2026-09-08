export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface FacilitySummary {
  id: string;
  name: string;
  location: string;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  sports: string[];
  startingPrice: number;
  imageUrl: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FacilityCourt {
  id: string;
  name: string;
  type: 'STANDARD' | 'PANORAMIC' | 'VIP' | 'INDOOR' | 'OUTDOOR' | string;
  indoor: boolean;
  basePrice: number;
  sport: string;
}

export interface FacilityDetail {
  id: string;
  name: string;
  description: string | null | undefined;
  address: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  sports: string[];
  amenities: string[];
  courts: FacilityCourt[];
}

export interface SportOption {
  id: string;
  name: string;
  slug: string;
}

export interface AvailabilitySlot {
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  price: number;
  available: boolean;
}

export interface AvailabilityCourt {
  id: string;
  name: string;
  type: string;
  indoor: boolean;
  slots: AvailabilitySlot[];
}

export interface AvailabilityResponse {
  date: string;
  courts: AvailabilityCourt[];
}

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BookingFilter = 'UPCOMING' | 'PAST' | 'CANCELLED';

export interface BookingSummary {
  facility: { id: string; name: string; imageUrl?: string };
  court: { id: string; name: string };
}

export interface Booking {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  facility: { id: string; name: string; imageUrl?: string };
  court: { id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  serviceFee: number;
  totalPrice: number;
}

export interface CreateBookingPayload {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
}
