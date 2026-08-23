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

export const BACKEND_URL: string;
export const apiLinker: {
  getBackendUrl: typeof getBackendUrl;
  fetchHealth: typeof fetchHealth;
  consultMedo: typeof consultMedo;
};

export default apiLinker;
