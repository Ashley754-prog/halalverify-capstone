import { useEffect, useRef, useState, useMemo } from 'react';
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
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
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

export default function EstablishmentsMap({ onViewChange }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userMarkerRef = useRef(null);

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileTab, setMobileTab] = useState('map');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showMarkers, setShowMarkers] = useState(true);

    // Filters (Certifier filter removed per instructions)
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedRadius, setSelectedRadius] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // User Geolocation
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Modals
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Fetch establishments from API or fallback
    const fetchEstablishments = async () => {
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
                let query = supabase.from('establishments').select('*').order('name');
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
    };

    const applySeedFallback = () => {
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
    };

    useEffect(() => {
        fetchEstablishments();
    }, [userLocation, selectedRadius, selectedStatus]);

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

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        return () => {
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
                        const distText = est.distance_km ? `${est.distance_km} km away` : '';
                        const hcbInfo = est.certifying_bodies?.code
                            ? `<div>Accredited HCB: <b>${est.certifying_bodies.code}</b></div>`
                            : `<div style="color: #b45309; font-weight:600;">Classification: Self-Declared</div>`;

                        const marker = L.circleMarker([est.latitude, est.longitude], {
                            radius: 9,
                            fillColor: statusConfig.color,
                            color: '#ffffff',
                            weight: 2.5,
                            opacity: 1,
                            fillOpacity: 0.9,
                        });

                        const popupContent = `
                            <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
                                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; background: ${statusConfig.color}20; color: ${statusConfig.color};">
                                        ${statusConfig.label}
                                    </span>
                                    ${distText ? `<span style="font-size:10px; color:#64748b; font-weight:600;">${distText}</span>` : ''}
                                </div>
                                <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${est.name}</strong>
                                <span style="color: #64748b; font-size: 11px;">${est.type || 'Establishment'} — ${est.address || 'Zamboanga City'}</span>
                                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
                                    ${hcbInfo}
                                    ${est.certificate_number ? `<div>Cert: <b>${est.certificate_number}</b></div>` : ''}
                                </div>
                            </div>
                        `;

                        marker.bindPopup(popupContent);
                        marker.on('click', () => {
                            setSelectedEstablishment(est);
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
                    heatLayerRef.current = L.heatLayer(heatPoints, {
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
        setSelectedEstablishment(est);
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
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 flex-1 flex flex-col h-full bg-slate-50">
            <Topbar
                title="Interactive Spatial Map & Establishment Directory"
                subtitle="Locate verified Halal and Muslim-owned restaurants, eateries, and food establishments across Zamboanga City."
                onBack={() => onViewChange?.('back')}
            />

            {/* Compact Filter & Search Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 sm:p-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleFindNearMe}
                        disabled={isLocating}
                        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 ${
                            userLocation
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                        title="Use browser GPS to locate establishments near you"
                    >
                        {isLocating ? (
                            <Loader2 size={14} className="animate-spin text-white" />
                        ) : (
                            <Crosshair size={14} className={userLocation ? 'animate-pulse' : ''} />
                        )}
                        <span>{userLocation ? 'Near Me (Active)' : 'Find Near Me'}</span>
                    </button>

                    {userLocation && (
                        <button
                            type="button"
                            onClick={handleResetCenter}
                            className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition shrink-0"
                            title="Reset to City Center"
                        >
                            Reset
                        </button>
                    )}

                    <div className="h-9 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 rounded-xl border border-slate-200 text-xs transition">
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

                    <div className="h-9 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 rounded-xl border border-slate-200 text-xs transition">
                        <Filter size={13} className="text-slate-500 shrink-0" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                        >
                            <option value="all">All Classifications</option>
                            <option value="verified">🟢 Verified Halal</option>
                            <option value="needs_review">🟡 Self-Declared / Review</option>
                            <option value="flagged">🔴 Flagged / Suspended</option>
                        </select>
                    </div>
                </div>

                <div className="relative flex-1 min-w-[200px] max-w-full md:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, cuisine, street..."
                        className="w-full h-9 pl-8 pr-7 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px] lg:min-h-[550px] relative">
                <div
                    className={`
                        ${mobileTab === 'map' ? 'flex' : 'hidden'} lg:flex
                        lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col relative isolate z-0
                        min-h-[420px] sm:min-h-[480px] lg:min-h-[550px]
                    `}
                >
                    <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2 shadow-md flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={showMarkers}
                                onChange={(e) => setShowMarkers(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <MapPin size={14} className="text-emerald-600" />
                            Pins ({filteredList.length})
                        </label>

                        <div className="w-px h-4 bg-slate-200" />

                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={showHeatmap}
                                onChange={(e) => setShowHeatmap(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <Flame size={14} className="text-red-500" />
                            <span>Density Heatmap</span>
                        </label>
                    </div>

                    <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 shadow-md text-xs space-y-1">
                        <span className="font-black text-slate-700 block text-[10px] uppercase tracking-wider">
                            Classification Legend
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600 text-[11px] font-medium">Verified Halal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-slate-600 text-[11px] font-medium">Self-Declared / Review</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="text-slate-600 text-[11px] font-medium">Flagged / Suspended</span>
                        </div>
                        {userLocation && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300" />
                                <span className="text-blue-700 text-[11px] font-bold">Your Location</span>
                            </div>
                        )}
                    </div>

                    <div ref={mapContainerRef} className="w-full h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[550px]" />
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
                onClose={() => setSelectedEstablishment(null)}
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
