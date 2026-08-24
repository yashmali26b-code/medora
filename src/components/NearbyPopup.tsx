import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Cross,
  HeartPulse,
  Hospital,
  LifeBuoy,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation2,
  Phone,
  Pill,
  PillBottle,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiLinker } from "../api-linker.js";

type Coords = { lat: number; lng: number; accuracy?: number };

type Place = {
  id: string | null;
  name: string;
  category: string;
  primaryType?: string | null;
  address?: string | null;
  location: { lat: number | null; lng: number | null };
  phone?: string | null;
  website?: string | null;
  googleMapsUri?: string | null;
  openNow?: boolean | null;
  distanceMeters?: number | null;
  emergency?: boolean | null;
  beds?: number | null;
};

type IntentKey = "pharmacy" | "drugstore" | "hospital" | "doctor" | "dentist" | "physiotherapist" | "all";

const intentOptions: Array<{ value: IntentKey; label: string; icon: typeof Pill }> = [
  { value: "pharmacy", label: "Pharmacy", icon: PillBottle },
  { value: "drugstore", label: "Drugstore", icon: Pill },
  { value: "hospital", label: "Hospital", icon: Hospital },
  { value: "doctor", label: "Doctor / clinic", icon: Stethoscope },
  { value: "dentist", label: "Dentist", icon: Stethoscope },
  { value: "physiotherapist", label: "Physiotherapist", icon: HeartPulse },
  { value: "all", label: "Everything", icon: Compass },
];

const radiusOptions = [
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
  { value: 8000, label: "8 km" },
  { value: 15000, label: "15 km" },
];

type Step = "locate" | "options" | "results";

function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return "—";
  if (meters < 950) return `${Math.round(meters)} m`;
  if (meters < 9500) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

export default function NearbyPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("locate");
  const [intent, setIntent] = useState<IntentKey>("pharmacy");
  const [radius, setRadius] = useState(3000);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<"idle" | "denied">("idle");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originAddress, setOriginAddress] = useState<string | null>(null);
  const [resolvingName, setResolvingName] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);

  const reset = useCallback(() => {
    setStep("locate");
    setCoords(null);
    setPlaces([]);
    setError(null);
    setLocating(false);
    setPermissionState("idle");
    setOriginAddress(null);
    setResolvingName(false);
  }, []);

  useEffect(() => {
    if (!open) {
      // Keep state around for the close animation, then reset on the next mount.
      const t = setTimeout(reset, 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    apiLinker.fetchMedicalsStatus().then((status) => {
      if (cancelled) return;
      if (!status.configured) {
        setError("Nearby medical search is not configured on the server.");
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    setPermissionState("idle");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords(next);
        setOriginAddress(null);
        setResolvingName(true);
        setLocating(false);
        setStep("options");
        apiLinker.fetchMedicalsReverse({ lat: next.lat, lng: next.lng }).then((rev) => {
          setResolvingName(false);
          if (rev && rev.ok && rev.label) setOriginAddress(rev.label);
        });
      },
      (err) => {
        setLocating(false);
        setPermissionState("denied");
        const reason = err && err.code === 1 ? "permission denied" : (err && err.message ? err.message : "unavailable");
        toast.error(`Location ${reason}. Allow location access to continue.`);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  const runSearch = useCallback(async () => {
    if (!coords) {
      toast.error("Share your location first.");
      return;
    }
    setLoading(true);
    setError(null);
    setPlaces([]);
    try {
      const result = await apiLinker.fetchNearbyMedicals({
        lat: coords.lat,
        lng: coords.lng,
        radius,
        limit: 20,
        query: "",
        type: intent === "all" ? "" : intent,
        rankBy: "distance",
      });
      if (!result.ok) {
        setError(result.error || "Search failed");
        setPlaces([]);
        return;
      }
      setPlaces(result.places);
      setOriginAddress(result.originAddress || null);
      setStep("results");
      if (!result.places.length) {
        toast.message("No matches in this radius — try a wider one.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [coords, radius, intent]);

  const locationSummary = useMemo(() => {
    if (!coords) return null;
    const parts = [`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`];
    if (typeof coords.accuracy === "number") parts.push(`±${Math.round(coords.accuracy)} m`);
    return parts.join(" · ");
  }, [coords]);

  if (!open) return null;

  return (
    <div className="nearby-popup-backdrop" role="presentation" onMouseDown={() => onClose()}>
      <section
        className={`nearby-popup-dialog nearby-popup-step-${step}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-popup-title"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
      >
        <button className="dialog-close" type="button" aria-label="Close nearby medical popup" onClick={onClose}>
          <X size={20} />
        </button>

        <p className="eyebrow"><span /> NEARBY MEDICAL PLACES</p>
        <h2 id="nearby-popup-title">
          {step === "locate" && (<>Find trusted medical places <em>near you.</em></>)}
          {step === "options" && (<>What are you <em>looking for?</em></>)}
          {step === "results" && (<>Closest places to <em>your location.</em></>)}
        </h2>

        {step === "locate" && (
          <div className="nearby-popup-step">
            <p className="nearby-popup-intro">
              Allow Medora to use your location. We&apos;ll search OpenStreetMap for pharmacies, hospitals, and clinics around you — sorted by distance.
            </p>

            <button
              className="primary-button nearby-popup-cta"
              type="button"
              onClick={requestLocation}
              disabled={locating}
            >
              {locating ? (
                <span className="search-btn-loader" aria-hidden="true" />
              ) : (
                <LocateFixed size={18} aria-hidden="true" />
              )}
              {locating ? "Locating you…" : "Use my location"}
              {!locating && <ArrowRight size={18} aria-hidden="true" />}
            </button>

            {permissionState === "denied" && (
              <p className="nearby-popup-warn">
                <LifeBuoy size={14} aria-hidden="true" />
                Location access was blocked. Tap again and choose &ldquo;Allow&rdquo; in your browser prompt.
              </p>
            )}

            <p className="nearby-popup-foot">
              <Compass size={13} aria-hidden="true" /> We never store your coordinates and the lookup happens server-side.
            </p>
          </div>
        )}

        {step === "options" && coords && (
          <div className="nearby-popup-step">
            <div className="nearby-popup-summary" aria-label="Detected location">
              <div className="nearby-popup-summary-row">
                <span><Navigation2 size={13} aria-hidden="true" /> SOURCE</span>
                <b>
                  {originAddress || (
                    <span className="nearby-popup-resolving">
                      <Loader2 size={13} className="nearby-popup-spin" aria-hidden="true" />
                      {resolvingName ? "Resolving city…" : "Browser geolocation"}
                    </span>
                  )}
                </b>
              </div>
              <div className="nearby-popup-summary-row">
                <span><MapPin size={13} aria-hidden="true" /> COORDS</span>
                <b className="nearby-popup-coords">{locationSummary}</b>
              </div>
            </div>

            <p className="nearby-popup-section-label">WHAT ARE YOU LOOKING FOR?</p>
            <div className="nearby-popup-intent-row">
              {intentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={intent === option.value ? "nearby-popup-chip active" : "nearby-popup-chip"}
                    onClick={() => setIntent(option.value)}
                    aria-pressed={intent === option.value}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="nearby-popup-section-label">HOW FAR?</p>
            <div className="nearby-popup-radius-row">
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={radius === opt.value ? "nearby-popup-chip small active" : "nearby-popup-chip small"}
                  onClick={() => setRadius(opt.value)}
                  aria-pressed={radius === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="nearby-popup-actions">
              <button
                className="secondary-button nearby-popup-secondary"
                type="button"
                onClick={requestLocation}
                disabled={locating}
              >
                {locating ? <Loader2 size={15} className="nearby-popup-spin" aria-hidden="true" /> : <LocateFixed size={15} aria-hidden="true" />}
                Re-detect
              </button>
              <button
                className="primary-button nearby-popup-cta"
                type="button"
                onClick={runSearch}
                disabled={loading}
              >
                {loading ? (
                  <span className="search-btn-loader" aria-hidden="true" />
                ) : (
                  <Search size={17} aria-hidden="true" />
                )}
                {loading ? "Searching…" : "Search nearby"}
                {!loading && <ArrowRight size={17} aria-hidden="true" />}
              </button>
            </div>

            {error && (
              <p className="nearby-popup-warn">
                <LifeBuoy size={14} aria-hidden="true" /> {error === "overpass-error" ? "OpenStreetMap is rate-limiting. Try again in a minute." : error}
              </p>
            )}
          </div>
        )}

        {step === "results" && (
          <div className="nearby-popup-step">
            {loading ? (
              <div className="nearby-popup-loading">
                <span className="search-btn-loader" aria-hidden="true" />
                <span>Finding the closest places…</span>
              </div>
            ) : places.length ? (
              <ul className="nearby-popup-results">
                {places.slice(0, 8).map((place) => (
                  <li key={place.id || place.name} className="nearby-popup-result">
                    <div className="nearby-popup-result-head">
                      <div>
                        <h4>{place.name}</h4>
                        <p>
                          {place.category}
                          {place.emergency === true ? " · Emergency" : ""}
                          {typeof place.beds === "number" ? ` · ${place.beds} beds` : ""}
                        </p>
                      </div>
                      <span className="nearby-popup-distance">
                        <MapPin size={12} aria-hidden="true" /> {formatDistance(place.distanceMeters)}
                      </span>
                    </div>
                    {place.address ? <p className="nearby-popup-address">{place.address}</p> : null}
                    <div className="nearby-popup-result-actions">
                      {place.phone ? (
                        <a className="nearby-popup-mini" href={`tel:${place.phone}`}>
                          <Phone size={13} aria-hidden="true" /> Call
                        </a>
                      ) : null}
                      {place.googleMapsUri ? (
                        <a className="nearby-popup-mini primary" href={place.googleMapsUri} target="_blank" rel="noopener noreferrer">
                          <Navigation2 size={13} aria-hidden="true" /> Directions
                          <ArrowUpRight size={12} className="nearby-popup-ext" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
                {places.length > 8 ? (
                  <li className="nearby-popup-more">
                    <Check size={13} aria-hidden="true" /> Showing 8 of {places.length} matches.
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="nearby-popup-warn">
                <LifeBuoy size={14} aria-hidden="true" /> No matches in this radius. Try widening or changing the category.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
