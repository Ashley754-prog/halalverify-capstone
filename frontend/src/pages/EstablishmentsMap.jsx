import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    MapPin,
    Flame,
    Store,
    Filter,
    Search,
    Compass,
    Crosshair,
    Loader2,
    X,
    Navigation,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import EstablishmentDetailModal from '../components/map/EstablishmentDetailModal';
import { getStatusConfig } from '../data/constants';
import EstablishmentsSidebarList from '../components/map/EstablishmentsSidebarList';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

import { SEED_ESTABLISHMENTS } from '../data/seedEstablishments';

// Client Haversine distance calculator in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
};

const ZAMBOANGA_CENTER = { lat: 6.9214, lng: 122.0790 };

export default function EstablishmentsMap({ onViewChange, initialSearchQuery = '' }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userMarkerRef = useRef(null);

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileTab, setMobileTab] = useState(initialSearchQuery ? 'list' : 'map');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showMarkers, setShowMarkers] = useState(true);

    // Filters (Certifier filter removed per instructions)
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedRadius, setSelectedRadius] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
            setMobileTab('list');
        }
    }, [initialSearchQuery]);

    // User Geolocation
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Modals & Previews
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);
    const [activePreviewEst, setActivePreviewEst] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const applySeedFallback = useCallback(() => {
        let list = [...SEED_ESTABLISHMENTS];
        if (selectedStatus !== 'all') {
            list = list.filter((e) => {
                const key = getStatusConfig(e.halal_status).key;
                if (selectedStatus === 'needs_review' || selectedStatus === 'pending_review') {
                    return key === 'needs_review' || key === 'pending_review';
                }
                return key === selectedStatus;
            });
        }
        if (userLocation) {
            list = list.map((e) => ({
                ...e,
                distance_km: calculateDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
            }));
            if (selectedRadius !== 'all') {
                const maxR = parseFloat(selectedRadius);
                list = list.filter((e) => e.distance_km <= maxR);
            }
            list.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
        }
        setEstablishments(list);
    }, [selectedStatus, userLocation, selectedRadius]);

    // Fetch establishments from API or fallback
    const fetchEstablishments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (userLocation?.lat && userLocation?.lng) {
                params.append('lat', userLocation.lat);
                params.append('lng', userLocation.lng);
                if (selectedRadius !== 'all') {
                    params.append('radius', selectedRadius);
                }
            }
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            // 1. Query Supabase directly first for instant ~150ms response (zero cold start)
            try {
                let query = supabase.from('establishments').select('*, certifying_bodies(*)').order('name');
                if (selectedStatus !== 'all') {
                    query = query.eq('halal_status', selectedStatus);
                }
                const { data: sbData, error: sbErr } = await query;
                if (!sbErr && sbData && sbData.length > 0) {
                    let withCoords = sbData.filter((e) => e.latitude && e.longitude);
                    if (userLocation) {
                        withCoords = withCoords.map((e) => ({
                            ...e,
                            distance_km: calculateDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
                        }));
                        if (selectedRadius !== 'all') {
                            const radiusKm = parseFloat(selectedRadius);
                            withCoords = withCoords.filter((e) => e.distance_km <= radiusKm);
                        }
                    }
                    if (withCoords.length > 0) {
                        setEstablishments(withCoords);
                        return;
                    }
                }
            } catch (sbErr) {
                console.warn('Direct Supabase fetch for map warning, trying backend:', sbErr);
            }

            // 2. Fallback to backend API with a 3s timeout
            try {
                const url = `${API_BASE_URL}/api/v1/establishments/map?${params.toString()}`;
                const response = await authFetch(url, { timeout: 3000 });

                if (response.ok) {
                    const json = await response.json();
                    const data = json.data || [];
                    const withCoords = data.filter((e) => e.latitude && e.longitude);
                    if (withCoords.length > 0) {
                        setEstablishments(withCoords);
                        return;
                    }
                }
            } catch (apiErr) {
                console.warn('Map API fallback notice, using curated seeds:', apiErr);
            }

            applySeedFallback();
        } catch (err) {
            console.warn('Map endpoint notice, using curated seeds:', err);
            applySeedFallback();
        } finally {
            setLoading(false);
        }
    }, [userLocation, selectedRadius, selectedStatus, applySeedFallback]);

    useEffect(() => {
        fetchEstablishments();
    }, [fetchEstablishments]);

    const handleFindNearMe = () => {
        if (!navigator.geolocation) {
            setToast({
                visible: true,
                message: 'HTML5 Geolocation is not supported by your browser.',
                type: 'error',
            });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setUserLocation(coords);
                setIsLocating(false);
                setSelectedRadius('10');

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
                }

                setToast({
                    visible: true,
                    message: 'Location acquired! Showing Halal establishments near you.',
                    type: 'success',
                });
            },
            (err) => {
                console.warn('GPS location lookup error:', err);
                setIsLocating(false);
                setUserLocation(ZAMBOANGA_CENTER);
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([ZAMBOANGA_CENTER.lat, ZAMBOANGA_CENTER.lng], 13);
                }
                setToast({
                    visible: true,
                    message: 'Could not acquire precise GPS. Centered on Zamboanga City.',
                    type: 'info',
                });
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleResetCenter = () => {
        setUserLocation(null);
        setSelectedRadius('all');
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([ZAMBOANGA_CENTER.lat, ZAMBOANGA_CENTER.lng], 13, { duration: 1.0 });
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [ZAMBOANGA_CENTER.lat, ZAMBOANGA_CENTER.lng],
            zoom: 13,
            zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            crossOrigin: true,
        }).addTo(map);

        tileLayer.on('tileload', (e) => {
            if (e.tile) {
                e.tile.setAttribute('alt', '');
                e.tile.setAttribute('role', 'presentation');
            }
        });

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        map.on('click', () => {
            setActivePreviewEst(null);
        });

        // Observe container resizes so map is never clipped on mobile viewports
        let resizeObserver;
        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            });
            resizeObserver.observe(mapContainerRef.current);
        }

        // Force Leaflet to re-calculate container dimensions after mount
        const timer1 = setTimeout(() => {
            if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 150);
        const timer2 = setTimeout(() => {
            if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 400);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            if (resizeObserver) resizeObserver.disconnect();
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const filteredList = useMemo(() => {
        return establishments.filter((est) => {
            const matchesQuery =
                !searchQuery ||
                est.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                est.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                est.type?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesQuery;
        });
    }, [establishments, searchQuery]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const isContainerVisible = mapContainerRef.current && mapContainerRef.current.offsetParent !== null;
        if (!isContainerVisible && window.innerWidth < 1024 && mobileTab !== 'map') {
            return;
        }

        try {
            if (userMarkerRef.current) {
                map.removeLayer(userMarkerRef.current);
                userMarkerRef.current = null;
            }

            if (userLocation) {
                const userPinGroup = L.layerGroup();
                L.circleMarker([userLocation.lat, userLocation.lng], {
                    radius: 24,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                    color: '#2563eb',
                    weight: 1.5,
                }).addTo(userPinGroup);

                L.circleMarker([userLocation.lat, userLocation.lng], {
                    radius: 8,
                    fillColor: '#2563eb',
                    fillOpacity: 1.0,
                    color: '#ffffff',
                    weight: 3,
                })
                    .bindPopup('<div style="font-family:system-ui;font-size:12px;font-weight:700;color:#1e3a8a;">📍 Your Current Location</div>')
                    .addTo(userPinGroup);

                userPinGroup.addTo(map);
                userMarkerRef.current = userPinGroup;
            }

            if (markersLayerRef.current) {
                markersLayerRef.current.clearLayers();

                if (showMarkers) {
                    filteredList.forEach((est) => {
                        if (!est.latitude || !est.longitude) return;

                        const statusConfig = getStatusConfig(est.halal_status);

                        const marker = L.circleMarker([est.latitude, est.longitude], {
                            radius: 9,
                            fillColor: statusConfig.color,
                            color: '#ffffff',
                            weight: 2.5,
                            opacity: 1,
                            fillOpacity: 0.9,
                        });

                        // Compact single-line name badge on hover for pointer/mouse devices (never pop up over pins on touchscreens)
                        const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
                        if (!isTouchDevice) {
                            marker.bindTooltip(est.name, {
                                direction: 'top',
                                offset: [0, -10],
                                opacity: 1,
                                sticky: false,
                                className: 'custom-map-name-tooltip',
                            });
                        }

                        marker.on('click', (e) => {
                            if (e && e.originalEvent) {
                                L.DomEvent.stopPropagation(e);
                            }
                            try {
                                marker.closeTooltip();
                            } catch {
                                // Ignore tooltip dismiss on rapid re-click
                            }
                            setActivePreviewEst(est);
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.panTo([est.latitude, est.longitude], { animate: true, duration: 0.35 });
                            }
                        });

                        markersLayerRef.current.addLayer(marker);
                    });
                }
            }

            if (heatLayerRef.current) {
                try {
                    map.removeLayer(heatLayerRef.current);
                } catch {
                    // Layer might have already been removed
                }
                heatLayerRef.current = null;
            }

            if (showHeatmap && filteredList.length > 0 && isContainerVisible) {
                const heatPoints = filteredList
                    .filter((e) => e.latitude && e.longitude)
                    .map((e) => {
                        const weight = getStatusConfig(e.halal_status).weight;
                        return [e.latitude, e.longitude, weight];
                    });

                if (heatPoints.length > 0 && L.heatLayer) {
                    const heat = L.heatLayer(heatPoints, {
                        radius: 35,
                        blur: 22,
                        maxZoom: 15,
                        gradient: {
                            0.2: '#34d399',
                            0.5: '#fbbf24',
                            0.8: '#f97316',
                            1.0: '#ef4444',
                        },
                    }).addTo(map);

                    heatLayerRef.current = heat;

                    // Fix Leaflet.heat canvas redraw bug:
                    // Force immediate canvas redraw so heatmap paints immediately without needing user to zoom in/out
                    try {
                        if (typeof heat._reset === 'function') {
                            heat._reset();
                        }
                        if (typeof heat.redraw === 'function') {
                            heat.redraw();
                        }
                        map.invalidateSize();
                        map.fire('moveend');
                    } catch (heatErr) {
                        console.warn('Heatmap canvas redraw notice:', heatErr);
                    }
                }
            }
        } catch (e) {
            console.warn('Map layer update handled:', e);
        }
    }, [filteredList, showHeatmap, showMarkers, userLocation, mobileTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 200);

        return () => {
            clearTimeout(timer);
        };
    }, [mobileTab]);

    const flyToEstablishment = (est) => {
        setMobileTab('map');
        setActivePreviewEst(est);
        if (!est.latitude || !est.longitude) return;

        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                mapInstanceRef.current.flyTo([est.latitude, est.longitude], 16, { duration: 1.2 });
            }
        }, 150);
    };

    const handleFlagEstablishment = async (est) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setShowAuthModal(true);
        } else {
            setSelectedEstablishment(est);
            setShowReportModal(true);
        }
    };

    return (
        <div className="p-2 sm:p-4 md:p-5 flex-1 flex flex-col min-h-0 bg-slate-50 gap-1.5 sm:gap-2.5 overflow-hidden">
            {/* Compact Filter & Search Toolbar with Integrated Module Title */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-1.5 sm:gap-2 shrink-0">
                {/* Search Bar - Row 1 on mobile, right side on desktop */}
                <div className="relative order-1 md:order-2 w-full md:w-64 lg:w-72 shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, cuisine, street..."
                        className="w-full h-8 sm:h-8.5 pl-8 pr-7 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Filter Controls - Row 2 on mobile (single horizontal row), left side on desktop */}
                <div className="order-2 md:order-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                    <div className="hidden sm:flex items-center gap-1.5 pr-2.5 mr-0.5 border-r border-slate-200 shrink-0">
                        <MapPin size={16} className="text-emerald-600" />
                        <span className="font-black text-slate-800 text-sm tracking-tight">Halal Map</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleFindNearMe}
                        disabled={isLocating}
                        className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0 ${
                            userLocation
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                        title="Use browser GPS to locate establishments near you"
                    >
                        {isLocating ? (
                            <Loader2 size={13} className="animate-spin text-white" />
                        ) : (
                            <Crosshair size={13} className={userLocation ? 'animate-pulse' : ''} />
                        )}
                        <span>{userLocation ? 'Near Me' : <><span className="hidden sm:inline">Find </span>Near Me</>}</span>
                    </button>

                    {userLocation && (
                        <button
                            type="button"
                            onClick={handleResetCenter}
                            className="h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition shrink-0"
                            title="Reset to City Center"
                        >
                            Reset
                        </button>
                    )}

                    <div className="h-8 sm:h-8.5 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2 sm:px-2.5 rounded-xl border border-slate-200 text-xs transition shrink-0">
                        <Compass size={13} className="text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-500 hidden sm:inline">Radius:</span>
                        <select
                            value={selectedRadius}
                            onChange={(e) => setSelectedRadius(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="all">Citywide</option>
                            <option value="1">1 km</option>
                            <option value="3">3 km</option>
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="25">25 km</option>
                        </select>
                    </div>

                    <div className="h-8 sm:h-8.5 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2 sm:px-2.5 rounded-xl border border-slate-200 text-xs transition shrink-0">
                        <Filter size={13} className="text-slate-500 shrink-0" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                            aria-label="Status Guide"
                        >
                            <option value="all">Status Guide</option>
                            <option value="verified">🟢 Verified Halal</option>
                            <option value="needs_review">🟡 Pending Verification</option>
                            <option value="flagged">🔴 Expired / Flagged</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Segmented View Tabs for Mobile & Tablet */}
            <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 shrink-0 shadow-inner">
                <button
                    type="button"
                    onClick={() => {
                        setMobileTab('map');
                        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        mobileTab === 'map'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MapPin size={14} className={mobileTab === 'map' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Map View</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('list')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        mobileTab === 'list'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Store size={14} className={mobileTab === 'list' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Directory ({filteredList.length})</span>
                </button>
            </div>

            {/* Map & Directory Main Layout */}
            <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-3 gap-2 sm:gap-4 relative overflow-hidden">
                <div
                    className={`
                        ${mobileTab === 'map' ? 'flex' : 'hidden'} lg:flex
                        lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col relative
                        w-full h-full min-h-0 flex-1
                    `}
                >
                    {/* Map Canvas rendered FIRST in DOM */}
                    <div ref={mapContainerRef} className="w-full h-full min-h-0 flex-1 z-0" />

                    {/* Top-left Pins & Heatmap toggles placed AFTER map with z-[1000] */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-300 p-1.5 sm:p-2 shadow-md flex flex-col gap-1.5 text-[11px] sm:text-xs">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={showMarkers}
                                    onChange={(e) => setShowMarkers(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <MapPin size={13} className="text-emerald-600 shrink-0" />
                                <span>Pins ({filteredList.length})</span>
                            </label>

                            <div className="w-px h-3.5 bg-slate-200" />

                            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={showHeatmap}
                                    onChange={(e) => setShowHeatmap(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <Flame size={13} className="text-red-500 shrink-0" />
                                <span>Density Heatmap</span>
                            </label>
                        </div>

                        {showHeatmap && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[10px] text-slate-600">
                                <span className="text-[9px] uppercase font-bold text-slate-500">Density:</span>
                                <div className="h-1.5 w-16 sm:w-20 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 shadow-inner" />
                                <span className="text-[9px] text-slate-500 font-semibold">Low → High</span>
                            </div>
                        )}
                    </div>

                    {/* Docked Establishment Preview Card */}
                    {activePreviewEst && (
                        <div className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-3 sm:bottom-3 sm:max-w-sm sm:w-96 z-[1000] bg-white/98 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-2xl p-2.5 sm:p-3.5 flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Card Header: Status Badge, Cert & Close Button */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                            getStatusConfig(activePreviewEst.halal_status).badgeBg
                                        }`}
                                    >
                                        {getStatusConfig(activePreviewEst.halal_status).label}
                                    </span>
                                    {activePreviewEst.certifying_bodies?.code ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            {activePreviewEst.certifying_bodies.code}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                            Self-Declared
                                        </span>
                                    )}
                                    {activePreviewEst.distance_km && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            {activePreviewEst.distance_km} km away
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActivePreviewEst(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                                    title="Close preview"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Card Body: Name & Address */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                                    {activePreviewEst.name}
                                </h4>
                                <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5 line-clamp-1">
                                    <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span>{activePreviewEst.address || activePreviewEst.city || 'Zamboanga City'}</span>
                                </p>
                            </div>

                            {/* Card Actions: View Full Details & Directions */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEstablishment(activePreviewEst)}
                                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                                >
                                    <Store size={13} />
                                    <span>View Full Details</span>
                                </button>
                                {activePreviewEst.latitude && activePreviewEst.longitude && (
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${activePreviewEst.latitude},${activePreviewEst.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shrink-0"
                                        title="Get directions in Google Maps"
                                    >
                                        <Navigation size={13} className="text-blue-600" />
                                        <span>Directions</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <EstablishmentsSidebarList
                    filteredList={filteredList}
                    selectedEstablishment={selectedEstablishment}
                    loading={loading}
                    mobileTab={mobileTab}
                    onSelectEstablishment={flyToEstablishment}
                    onResetFilters={() => {
                        setSelectedStatus('all');
                        setSelectedRadius('all');
                        setSearchQuery('');
                    }}
                />
            </div>

            {/* Establishment Detail Modal */}
            <EstablishmentDetailModal
                establishment={selectedEstablishment}
                userLocation={userLocation}
                onClose={() => {
                    setSelectedEstablishment(null);
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.closePopup();
                    }
                }}
                onFlagEstablishment={handleFlagEstablishment}
            />

            <AuthPromptModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onNavigate={(view) => onViewChange?.(view)}
                actionTitle="Flag or Report Establishment"
            />

            <ReportIssueModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                initialData={{
                    establishment_id: selectedEstablishment?.id,
                    establishment_name: selectedEstablishment?.name,
                    category: 'establishment_concern',
                }}
                onSuccess={() => {
                    setShowReportModal(false);
                    setToast({
                        visible: true,
                        message: 'Report submitted for regulatory review.',
                        type: 'success',
                    });
                }}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, visible: false })}
            />
        </div>
    );
}
