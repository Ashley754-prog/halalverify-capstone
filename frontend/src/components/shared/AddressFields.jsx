import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Crosshair, CheckCircle2, Loader2, RotateCcw, ChevronUp } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFieldStyles } from './fieldStyles';
import {
    ZAMBOANGA_BARANGAYS,
    parseZamboangaAddress,
    formatZamboangaAddress,
    resolveZamboangaDistrict,
    resolveEstablishmentCoordinates,
    geocodeZamboangaAddress,
    findZamboangaBarangay,
} from '../../data/constants';

const DISTRICT_1 = ZAMBOANGA_BARANGAYS.filter((b) => b.district === 'district_1');
const DISTRICT_2 = ZAMBOANGA_BARANGAYS.filter((b) => b.district === 'district_2');
const ZAMBOANGA_BOUNDS = { latMin: 6.8, latMax: 7.45, lngMin: 121.8, lngMax: 122.45 };

const createPickerMarkerIcon = () =>
    L.divIcon({
        className: 'halalverify-pin-picker-marker',
        html: `<div style="
            width: 30px;
            height: 30px;
            border-radius: 9999px;
            background: #059669;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            cursor: grab;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

function findNearestBarangay(lat, lng) {
    let best = null;
    let bestDist = Infinity;
    for (const b of ZAMBOANGA_BARANGAYS) {
        const d = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
        if (d < bestDist) {
            bestDist = d;
            best = b;
        }
    }
    return best;
}

/**
 * Shared Street / Landmark + Barangay inputs with an interactive Pin on Map picker.
 * `value` is the form object holding address, street, barangay, city, latitude, longitude, and pin_source.
 * `onChange` receives a patch containing updated address and/or coordinates.
 * Used by the Add a Place submission form, the Verification Queue modal, and the Local Registry modal.
 */
export default function AddressFields({
    value,
    onChange,
    variant = 'registry',
    idPrefix = 'addr',
    streetAction = null,
    originalAddress = '',
}) {
    const styles = getFieldStyles(variant);
    const parsed = parseZamboangaAddress(value?.address || '');
    const street = value?.street !== undefined ? value.street : parsed.street;
    const barangay = value?.barangay !== undefined ? value.barangay : parsed.barangay;
    const city = value?.city || 'Zamboanga City';
    const labelClass = styles.label.replace(/\bmb-1(\.5)?\b/g, '').replace(/\s+/g, ' ').trim();
    const preview = formatZamboangaAddress(street, barangay, city);
    const district = resolveZamboangaDistrict({ address: preview, barangay });
    const changed =
        Boolean(originalAddress) &&
        originalAddress.trim().toLowerCase() !== preview.trim().toLowerCase();

    const [mapOpen, setMapOpen] = useState(false);
    const [locatingGps, setLocatingGps] = useState(false);
    const [locatingStreet, setLocatingStreet] = useState(false);
    const [mapNotice, setMapNotice] = useState('');

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const latestStateRef = useRef({ street, barangay, city, value, onChange });
    latestStateRef.current = { street, barangay, city, value, onChange };

    const hasCustomPin =
        (value?.pin_source === 'map' || value?.pin_source === 'gps') &&
        Number.isFinite(Number(value?.latitude)) &&
        Number.isFinite(Number(value?.longitude));

    const getInitialCoords = () => {
        const resolved = resolveEstablishmentCoordinates({
            ...value,
            address: preview,
            barangay,
        });
        return {
            lat: Number(resolved.latitude || 6.9214),
            lng: Number(resolved.longitude || 122.0790),
        };
    };

    const applyCoordinates = (lat, lng, source = 'map') => {
        const cleanLat = Number(Number(lat).toFixed(6));
        const cleanLng = Number(Number(lng).toFixed(6));
        const inBounds =
            cleanLat >= ZAMBOANGA_BOUNDS.latMin &&
            cleanLat <= ZAMBOANGA_BOUNDS.latMax &&
            cleanLng >= ZAMBOANGA_BOUNDS.lngMin &&
            cleanLng <= ZAMBOANGA_BOUNDS.lngMax;

        if (!inBounds) {
            setMapNotice('Please place the pin within Zamboanga City limits.');
            return false;
        }

        setMapNotice('');
        const cur = latestStateRef.current;
        const patch = {
            latitude: cleanLat,
            longitude: cleanLng,
            pin_source: source,
        };

        if (!cur.barangay) {
            const nearest = findNearestBarangay(cleanLat, cleanLng);
            if (nearest) {
                patch.barangay = nearest.name;
                patch.address = formatZamboangaAddress(cur.street, nearest.name, cur.city);
            }
        }

        cur.onChange(patch);

        if (markerRef.current) {
            markerRef.current.setLatLng([cleanLat, cleanLng]);
        }
        return true;
    };

    // Initialize or tear down the interactive Leaflet mini-map when toggled
    useEffect(() => {
        if (!mapOpen || !mapContainerRef.current) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
            return;
        }

        if (mapInstanceRef.current) return;

        const initial = getInitialCoords();
        const initialZoom = barangay || hasCustomPin ? 16 : 13;

        const map = L.map(mapContainerRef.current, {
            center: [initial.lat, initial.lng],
            zoom: initialZoom,
            zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            crossOrigin: true,
        }).addTo(map);

        const marker = L.marker([initial.lat, initial.lng], {
            draggable: true,
            icon: createPickerMarkerIcon(),
        }).addTo(map);

        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            applyCoordinates(pos.lat, pos.lng, 'map');
        });

        map.on('click', (e) => {
            applyCoordinates(e.latlng.lat, e.latlng.lng, 'map');
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // If the user has not set a custom pin yet, try to geocode the current street + barangay so the marker starts as close as possible
        if (!hasCustomPin && (street || barangay)) {
            geocodeZamboangaAddress(preview, city, barangay)
                .then((coords) => {
                    if (!mapInstanceRef.current || latestStateRef.current.value?.pin_source) return;
                    mapInstanceRef.current.setView([coords.latitude, coords.longitude], barangay ? 16 : 14);
                    markerRef.current?.setLatLng([coords.latitude, coords.longitude]);
                })
                .catch(() => {});
        }

        const timer = setTimeout(() => {
            mapInstanceRef.current?.invalidateSize();
        }, 120);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapOpen]);

    // Keep marker & view synced when coordinates change externally
    useEffect(() => {
        if (!mapInstanceRef.current || !markerRef.current) return;
        const lat = Number(value?.latitude);
        const lng = Number(value?.longitude);
        if (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= ZAMBOANGA_BOUNDS.latMin &&
            lat <= ZAMBOANGA_BOUNDS.latMax &&
            lng >= ZAMBOANGA_BOUNDS.lngMin &&
            lng <= ZAMBOANGA_BOUNDS.lngMax
        ) {
            markerRef.current.setLatLng([lat, lng]);
        }
    }, [value?.latitude, value?.longitude]);

    const handleStreetChange = (nextStreet) => {
        setMapNotice('');
        const nextAddress = formatZamboangaAddress(nextStreet, barangay, city);
        const patch = {
            street: nextStreet,
            barangay,
            address: nextAddress,
        };
        // Keep manual map/GPS pins when editing street text within the same barangay
        if (!hasCustomPin) {
            patch.latitude = null;
            patch.longitude = null;
            patch.pin_source = null;
        }
        onChange(patch);
    };

    const handleBarangayChange = (nextBarangay) => {
        setMapNotice('');
        const nextAddress = formatZamboangaAddress(street, nextBarangay, city);
        const brgyObj = findZamboangaBarangay(nextBarangay, false);

        // Changing barangay moves the default pin to the new barangay so the pin never stays in an old barangay
        const patch = {
            street,
            barangay: nextBarangay,
            address: nextAddress,
            latitude: brgyObj ? Number(brgyObj.lat.toFixed(6)) : null,
            longitude: brgyObj ? Number(brgyObj.lng.toFixed(6)) : null,
            pin_source: null,
        };
        onChange(patch);

        if (mapInstanceRef.current && brgyObj) {
            geocodeZamboangaAddress(nextAddress, city, nextBarangay)
                .then((coords) => {
                    if (!mapInstanceRef.current) return;
                    mapInstanceRef.current.flyTo([coords.latitude, coords.longitude], 16, { duration: 0.6 });
                    markerRef.current?.setLatLng([coords.latitude, coords.longitude]);
                })
                .catch(() => {
                    mapInstanceRef.current?.flyTo([brgyObj.lat, brgyObj.lng], 16, { duration: 0.6 });
                    markerRef.current?.setLatLng([brgyObj.lat, brgyObj.lng]);
                });
        }
    };

    const handleCenterOnAddress = async () => {
        setLocatingStreet(true);
        setMapNotice('');
        try {
            const coords = await geocodeZamboangaAddress(preview, city, barangay);
            onChange({
                latitude: coords.latitude,
                longitude: coords.longitude,
                pin_source: null,
            });
            if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([coords.latitude, coords.longitude], 16, { duration: 0.6 });
                markerRef.current?.setLatLng([coords.latitude, coords.longitude]);
            }
        } finally {
            setLocatingStreet(false);
        }
    };

    const handleUseDeviceGps = () => {
        if (!navigator.geolocation) {
            setMapNotice('GPS is not supported by your browser.');
            return;
        }
        setLocatingGps(true);
        setMapNotice('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocatingGps(false);
                const lat = Number(pos.coords.latitude.toFixed(6));
                const lng = Number(pos.coords.longitude.toFixed(6));
                const ok = applyCoordinates(lat, lng, 'gps');
                if (ok && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 0.6 });
                }
            },
            () => {
                setLocatingGps(false);
                setMapNotice('Could not read device GPS. Simply click or drag the green pin on the map.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="space-y-2">
            <div className={styles.grid}>
                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <label htmlFor={`${idPrefix}-street`} className={labelClass}>
                            Street / Landmark
                        </label>
                        {streetAction}
                    </div>
                    <input
                        id={`${idPrefix}-street`}
                        type="text"
                        value={street}
                        placeholder="e.g. 193 Don Toribio St or KCC Mall"
                        onChange={(e) => handleStreetChange(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <label htmlFor={`${idPrefix}-barangay`} className={labelClass}>
                            Barangay <span className="text-red-500">*</span>
                        </label>
                        {district && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border leading-none normal-case tracking-normal ${district.badgeClass}`}>
                                {district.shortLabel}
                            </span>
                        )}
                    </div>
                    <select
                        id={`${idPrefix}-barangay`}
                        value={barangay}
                        onChange={(e) => handleBarangayChange(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Select Barangay</option>
                        <optgroup label="District 1 (West Coast & Downtown)">
                            {DISTRICT_1.map((b) => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="District 2 (East Coast)">
                            {DISTRICT_2.map((b) => (
                                <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Address & Pin Status Row */}
            <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                    {hasCustomPin ? (
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    ) : (
                        <MapPin size={12} className="text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate" title={preview}>
                        {street || barangay ? preview : 'Select a barangay or pin the exact location on the map'}
                    </span>
                    {hasCustomPin && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                            Exact Pin Set
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {hasCustomPin && !mapOpen && (
                        <button
                            type="button"
                            onClick={handleCenterOnAddress}
                            className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer whitespace-nowrap"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setMapOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer whitespace-nowrap"
                    >
                        {mapOpen ? (
                            <ChevronUp size={12} className="text-emerald-600 shrink-0" />
                        ) : (
                            <Crosshair size={11} className="text-emerald-600 shrink-0" />
                        )}
                        <span>{mapOpen ? 'Close Map' : hasCustomPin ? 'Adjust Pin' : 'Pin on Map'}</span>
                    </button>
                </div>
            </div>

            {/* Collapsible Interactive Leaflet Map Picker */}
            {mapOpen && (
                <div className="rounded-xl border border-emerald-200 bg-slate-50 overflow-hidden shadow-2xs space-y-0">
                    <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 bg-emerald-50/70 border-b border-emerald-100 text-[11px]">
                        <span className="font-semibold text-emerald-950 flex items-center gap-1.5 min-w-0 truncate">
                            <MapPin size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">Tap map or drag pin to exact spot</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            {(street || barangay) && (
                                <button
                                    type="button"
                                    onClick={handleCenterOnAddress}
                                    disabled={locatingStreet}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    title="Move pin back to the selected barangay or street center"
                                >
                                    {locatingStreet ? (
                                        <Loader2 size={11} className="animate-spin text-emerald-600 shrink-0" />
                                    ) : (
                                        <RotateCcw size={11} className="text-slate-500 shrink-0" />
                                    )}
                                    <span>Reset</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleUseDeviceGps}
                                disabled={locatingGps}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                                title="Use your device GPS if you are currently at the venue"
                            >
                                {locatingGps ? (
                                    <Loader2 size={11} className="animate-spin text-emerald-600 shrink-0" />
                                ) : (
                                    <Navigation size={11} className="text-emerald-600 shrink-0" />
                                )}
                                <span>{locatingGps ? 'Locating...' : 'Use GPS'}</span>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={mapContainerRef}
                        className="w-full h-44 sm:h-52 bg-slate-100 relative z-0"
                    />

                    <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 bg-white border-t border-slate-200/80 text-[11px] text-slate-500">
                        {mapNotice ? (
                            <span className="text-amber-700 font-medium truncate">{mapNotice}</span>
                        ) : hasCustomPin ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1 truncate">
                                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                <span className="truncate">
                                    Exact pin saved at {Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)}
                                </span>
                            </span>
                        ) : (
                            <span className="truncate">
                                Centered on {barangay ? `${barangay}` : 'Zamboanga City'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {changed && (
                <p className="px-1 text-[11px] text-amber-700 font-medium">
                    Submitted as: <span className="font-semibold">{originalAddress}</span>
                </p>
            )}
        </div>
    );
}
