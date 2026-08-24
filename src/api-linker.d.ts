export type SearchType = "symptom" | "illness" | "medicine";

export type ConsultRequest = {
  symptoms: string;
  searchType: SearchType;
  viewer: "me" | "someone";
  ageBand: string;
};

export type ConsultResponse = {
  agent: string;
  createdBy: string;
  createdOn: string;
  request: ConsultRequest;
  response: {
    condition: string;
    summary: string;
    severity: "mild" | "moderate" | "severe" | "urgent";
    selfCare: string[];
    medicines: Array<{
      name: string;
      category: string;
      purpose: string;
      dosage: string;
      warnings: string[];
      interactions: string[];
    }>;
    whenToSeekHelp: string[];
    redFlags: string[];
    disclaimer: string;
    agent: {
      name: string;
      createdBy: string;
      createdOn: string;
      speciality: string;
    };
  };
  rotation: unknown;
};

export type HealthResponse = {
  ok: boolean;
  service: string;
  agent: string;
  rotation: unknown;
  time: string | null;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;
}

export function getBackendUrl(): string;
export function fetchHealth(): Promise<HealthResponse>;
export function consultMedo(payload: ConsultRequest): Promise<ConsultResponse>;

export type NearbyPlace = {
  id: string | null;
  name: string;
  category: string;
  primaryType?: string | null;
  types?: string[];
  address?: string | null;
  location: { lat: number | null; lng: number | null };
  rating?: number | null;
  userRatingCount?: number | null;
  priceLevel?: string | null;
  phone?: string | null;
  website?: string | null;
  googleMapsUri?: string | null;
  iconUrl?: string | null;
  iconColor?: string | null;
  openNow?: boolean | null;
  openState?: string | null;
  weekdayText?: string[] | null;
  wheelchairAccessible?: boolean | null;
  delivery?: boolean | null;
  takeout?: boolean | null;
  distanceMeters?: number | null;
};

export type NearbyParams = {
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
  limit?: number | null;
  query?: string;
  type?: string;
  openNow?: boolean;
  rankBy?: string;
};

export type NearbyResponse = {
  ok: boolean;
  intent?: string | null;
  intentLabel?: string | null;
  mode?: string | null;
  query?: string | null;
  radiusMeters?: number | null;
  origin?: { lat: number; lng: number } | null;
  count: number;
  places: NearbyPlace[];
  fetchedAt?: string | null | undefined;
  error?: string | null;
};

export function fetchNearbyMedicals(params: NearbyParams): Promise<NearbyResponse>;
export function fetchMedicalPlaceDetails(placeId: string): Promise<NearbyPlace | null>;
export function fetchMedicalsStatus(): Promise<{ configured: boolean; rateLimit: unknown }>;
export function fetchMedicalsReverse(params: { lat: number; lng: number }): Promise<{
  ok: boolean;
  label: string | null;
  lat?: number;
  lng?: number;
  error?: string | null;
}>;

export const BACKEND_URL: string;
export const apiLinker: {
  getBackendUrl: typeof getBackendUrl;
  fetchHealth: typeof fetchHealth;
  consultMedo: typeof consultMedo;
  fetchNearbyMedicals: typeof fetchNearbyMedicals;
  fetchMedicalPlaceDetails: typeof fetchMedicalPlaceDetails;
  fetchMedicalsStatus: typeof fetchMedicalsStatus;
  fetchMedicalsReverse: typeof fetchMedicalsReverse;
};

export default apiLinker;
