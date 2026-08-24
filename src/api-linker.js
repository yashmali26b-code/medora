const DEFAULT_BACKEND_URL = "medora-backend-production-ec0e.up.railway.app";

const ENV_URL =
  typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL
    : "";

export const BACKEND_URL = (ENV_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(status, message, info = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = info.payload || null;
    if (info.cause) this.cause = info.cause;
  }
}

async function request(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const init = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...(options.body !== undefined ? { body: options.body } : {}),
  };

  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const message = err && err.message ? err.message : "Network error";
    throw new ApiError(0, `Cannot reach Medora backend at ${url}: ${message}`, { cause: err });
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!res.ok || (payload && payload.ok === false)) {
    const message =
      (payload && (payload.error || payload.message)) ||
      `Request failed with HTTP ${res.status}`;
    throw new ApiError(res.status, message, { payload });
  }

  return payload;
}

export function getBackendUrl() {
  return BACKEND_URL;
}

export async function fetchHealth() {
  const data = await request("/health");
  return {
    ok: Boolean(data && data.ok),
    service: data && data.service ? data.service : "medora-backend",
    agent: data && data.agent ? data.agent : "Medo",
    rotation: data && data.rotation ? data.rotation : null,
    time: data && data.time ? data.time : null,
  };
}

export async function consultMedo(payload) {
  const body = {
    symptoms: payload && typeof payload.symptoms === "string" ? payload.symptoms : "",
    searchType: payload && payload.searchType ? payload.searchType : "symptom",
    viewer: payload && payload.viewer ? payload.viewer : "me",
    ageBand: payload && payload.ageBand ? payload.ageBand : "Not specified",
  };

  const data = await request("/api/consult", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!data || !data.response) {
    throw new ApiError(502, "Medo returned an empty response.");
  }

  return {
    agent: data.agent || "Medo",
    createdBy: data.createdBy || "Yash Mali",
    createdOn: data.createdOn || "2026",
    request: data.request || body,
    response: data.response,
    rotation: data.rotation || null,
  };
}

export async function fetchNearbyMedicals(params = {}) {
  const qs = new URLSearchParams();
  if (params.lat !== undefined && params.lat !== null) qs.set("lat", String(params.lat));
  if (params.lng !== undefined && params.lng !== null) qs.set("lng", String(params.lng));
  if (params.radius !== undefined && params.radius !== null) qs.set("radius", String(params.radius));
  if (params.limit !== undefined && params.limit !== null) qs.set("limit", String(params.limit));
  if (params.query) qs.set("q", String(params.query));
  if (params.type) qs.set("type", String(params.type));
  if (params.openNow) qs.set("openNow", "1");
  if (params.rankBy) qs.set("rankBy", String(params.rankBy));

  const data = await request(`/api/medicals-nearby?${qs.toString()}`);
  return {
    ok: Boolean(data && data.ok),
    intent: data && data.intent ? data.intent : null,
    intentLabel: data && data.intentLabel ? data.intentLabel : null,
    mode: data && data.mode ? data.mode : null,
    query: data && data.query ? data.query : null,
    radiusMeters: data && typeof data.radiusMeters === "number" ? data.radiusMeters : null,
    origin: data && data.origin ? data.origin : null,
    count: data && typeof data.count === "number" ? data.count : 0,
    places: Array.isArray(data && data.places) ? data.places : [],
    fetchedAt: data && data.fetchedAt ? data.fetchedAt : null,
    error: data && !data.ok ? data.error : null,
  };
}

export async function fetchMedicalPlaceDetails(placeId) {
  if (!placeId) return null;
  const data = await request(`/api/medicals-nearby/details/${encodeURIComponent(placeId)}`);
  if (!data || !data.ok || !data.place) return null;
  return data.place;
}

export async function fetchMedicalsStatus() {
  try {
    const data = await request("/api/medicals-nearby/status");
    return {
      configured: Boolean(data && data.configured),
      rateLimit: data && data.rateLimit ? data.rateLimit : null,
    };
  } catch (err) {
    return { configured: false, rateLimit: null };
  }
}

export async function fetchMedicalsReverse({ lat, lng } = {}) {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { ok: false, error: "missing-coordinates", label: null };
  }
  try {
    const qs = `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    const data = await request(`/api/medicals-nearby/reverse${qs}`);
    if (!data || !data.ok) {
      return { ok: false, error: (data && data.error) || "reverse-failed", label: null };
    }
    return { ok: true, label: data.label || null, lat: data.lat, lng: data.lng };
  } catch (err) {
    const message = err && err.message ? err.message : "reverse-failed";
    return { ok: false, error: message, label: null };
  }
}

export const apiLinker = {
  getBackendUrl,
  fetchHealth,
  consultMedo,
  fetchNearbyMedicals,
  fetchMedicalPlaceDetails,
  fetchMedicalsStatus,
  fetchMedicalsReverse,
};

export default apiLinker;
