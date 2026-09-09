import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    MapPin,
    Layers,
    Flame,
    Navigation,
    Store,
    Filter,
    ShieldCheck,
    AlertCircle,
    Clock,
    Search,
    ExternalLink,
    Compass,
    Crosshair,
    Award,
    UtensilsCrossed,
    Flag,
    X,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Phone,
    Mail
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

import { SEED_ESTABLISHMENTS } from '../data/seedEstablishments';


// Helper to normalize 3-tier regulatory classifications (Section 5)
const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verif') && !s.includes('pending') && !s.includes('unverif') && !s.includes('need')) {
        return {
            key: 'verified',
            label: 'Verified Halal',
            color: '#10b981',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            weight: 1.0,
        };
    }
    if (s.includes('flag') || s.includes('suspend') || s.includes('expir')) {
        return {
            key: 'flagged',
            label: 'Flagged / Suspended',
            color: '#ef4444',
            badgeBg: 'bg-red-50 text-red-700 border-red-200',
            weight: 0.1,
        };
    }
    return {
        key: 'needs_review',
        label: 'Self-Declared / Review',
        color: '#f59e0b',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        weight: 0.4,
    };
};

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

export default function EstablishmentsMap({ userRole, onViewChange }) {
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

            const url = `${API_BASE_URL}/api/v1/establishments/map?${params.toString()}`;
            const response = await authFetch(url);

            if (response.ok) {
                const json = await response.json();
                const data = json.data || [];
                const withCoords = data.filter((e) => e.latitude && e.longitude);
                if (withCoords.length > 0) {
                    setEstablishments(withCoords);
                    return;
                }
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
                } catch (e) {}
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

                <div
                    className={`
                        ${mobileTab === 'list' ? 'flex' : 'hidden'} lg:flex
                        bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-col justify-between space-y-3
                    `}
                >
                    <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Store size={17} className="text-emerald-600" />
                                    Zamboanga Halal Directory
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    {filteredList.length} locations matching active filters
                                </p>
                            </div>
                            {loading && <Loader2 size={16} className="animate-spin text-emerald-600" />}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[420px]">
                            {filteredList.length === 0 ? (
                                <div className="text-center py-10 px-4 text-slate-400 space-y-2">
                                    <Store size={28} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-semibold">No establishments match your filters.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus('all');
                                            setSelectedRadius('all');
                                            setSearchQuery('');
                                        }}
                                        className="text-xs text-emerald-700 font-bold hover:underline"
                                    >
                                        Reset all filters
                                    </button>
                                </div>
                            ) : (
                                filteredList.map((est) => {
                                    const statusConfig = getStatusConfig(est.halal_status);
                                    const isSelected = selectedEstablishment?.id === est.id;
                                    const isCertified = Boolean(est.certifying_bodies?.code);
                                    const productsCount = est.products?.length || 0;

                                    return (
                                        <div
                                            key={est.id}
                                            onClick={() => flyToEstablishment(est)}
                                            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                                                    : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-1.5">
                                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                                    {est.name}
                                                </h4>
                                                <span
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${statusConfig.badgeBg}`}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <MapPin size={11} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                                            </p>

                                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/50">
                                                <div className="flex items-center gap-2">
                                                    {isCertified ? (
                                                        <span className="font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                                            {est.certifying_bodies.code}
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                                                            Self-Declared
                                                        </span>
                                                    )}
                                                    {est.distance_km && (
                                                        <span className="text-blue-700 font-bold">
                                                            {est.distance_km} km
                                                        </span>
                                                    )}
                                                    {productsCount > 0 && (
                                                        <span className="text-slate-500 font-medium hidden sm:inline">
                                                            {productsCount} menu items
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-emerald-700 font-semibold flex items-center gap-0.5 hover:underline">
                                                    Inspect <ChevronRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                        <Navigation size={14} className="text-emerald-600 shrink-0" />
                        <span>Click any establishment to center map and view full halal certificate & menu.</span>
                    </div>
                </div>
            </div>

            {/* Establishment Detail Modal */}
            {selectedEstablishment && (
                <Modal
                    isOpen={!!selectedEstablishment}
                    onClose={() => setSelectedEstablishment(null)}
                    title=""
                    size="lg"
                    footer={
                        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleFlagEstablishment(selectedEstablishment)}
                                className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center gap-1.5 transition"
                            >
                                <Flag size={13} className="text-amber-600" />
                                <span>Flag / Report Discrepancy</span>
                            </button>

                            <div className="w-full sm:w-auto flex items-center gap-2">
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedEstablishment.latitude},${selectedEstablishment.longitude}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                                >
                                    <Navigation size={13} />
                                    <span>Get Directions</span>
                                </a>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                            <div>
                                <span
                                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-1.5 ${
                                        getStatusConfig(selectedEstablishment.halal_status).badgeBg
                                    }`}
                                >
                                    {getStatusConfig(selectedEstablishment.halal_status).label}
                                </span>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">
                                    {selectedEstablishment.name}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <MapPin size={13} className="text-emerald-600 shrink-0" />
                                    <span>{selectedEstablishment.address || 'Zamboanga City, Philippines'}</span>
                                    {selectedEstablishment.distance_km && (
                                        <span className="font-bold text-blue-700 ml-1">
                                            • {selectedEstablishment.distance_km} km away
                                        </span>
                                    )}
                                </p>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                                    <ShieldCheck size={11} className="text-slate-400 shrink-0" />
                                    <span>Verified listing · Source: Muslim in Manila Directory</span>
                                </div>
                            </div>
                        </div>

                        {/* HCB Certification Standing */}
                        {selectedEstablishment.certifying_bodies ? (
                            <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                        <Award size={15} className="text-emerald-600" />
                                        Halal Certifying Authority (HCB)
                                    </span>
                                    <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                        {selectedEstablishment.certifying_bodies.code || selectedEstablishment.certifying_bodies.acronym || 'Accredited HCB'}
                                    </span>
                                </div>

                                <p className="text-slate-600 text-[11px]">
                                    {selectedEstablishment.certifying_bodies.name}
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                                    <div>
                                        <span className="text-slate-500 block">Certificate No:</span>
                                        <span className="font-bold text-slate-800">
                                            {selectedEstablishment.certificate_number || 'Official Accredited Record'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Accreditation Standing:</span>
                                        <span className="font-bold text-emerald-700">Official Compliant</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                        <AlertCircle size={15} className="text-amber-600" />
                                        No Accredited HCB on Record
                                    </span>
                                    <span className="font-bold text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                                        Self-Declared / Unverified
                                    </span>
                                </div>

                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    This establishment does not have an active accredited Halal Certification Body (HCB) audit record. Listed as Muslim-owned or self-declared catering.
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                                    <div>
                                        <span className="text-slate-500 block">Certificate Status:</span>
                                        <span className="font-bold text-slate-700">No Official Cert No.</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Compliance Status:</span>
                                        <span className="font-bold text-amber-700">Pending Review</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* About this restaurant & Contact Information */}
                        {(selectedEstablishment.description || selectedEstablishment.phone || selectedEstablishment.email || selectedEstablishment.source_url) && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-2.5">
                                {selectedEstablishment.description && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            About this restaurant
                                        </span>
                                        <p className="text-slate-700 text-[11px] leading-relaxed">
                                            {selectedEstablishment.description}
                                        </p>
                                    </div>
                                )}

                                {(selectedEstablishment.phone || selectedEstablishment.email || selectedEstablishment.source_url) && (
                                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
                                        {selectedEstablishment.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone size={12} className="text-emerald-600 shrink-0" />
                                                <span className="font-semibold text-slate-800">{selectedEstablishment.phone}</span>
                                            </div>
                                        )}
                                        {selectedEstablishment.email && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Mail size={12} className="text-emerald-600 shrink-0" />
                                                <a
                                                    href={`mailto:${selectedEstablishment.email}`}
                                                    className="font-semibold text-emerald-700 hover:underline"
                                                >
                                                    {selectedEstablishment.email}
                                                </a>
                                            </div>
                                        )}
                                        {selectedEstablishment.source_url && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <ExternalLink size={12} className="text-slate-400 shrink-0" />
                                                <a
                                                    href={selectedEstablishment.source_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="hover:text-emerald-700 hover:underline"
                                                >
                                                    Directory Reference
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Truthful Menu Highlights & Specialties Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <UtensilsCrossed size={14} className={selectedEstablishment.certifying_bodies ? "text-emerald-600" : "text-slate-600"} />
                                    {selectedEstablishment.certifying_bodies ? "Menu Highlights & Specialties" : "Reported Menu & Specialties"}
                                </h4>
                                {selectedEstablishment.certifying_bodies ? (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                        {selectedEstablishment.certifying_bodies.code || 'Certified'} Kitchen
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                        Self-Reported / Unaudited
                                    </span>
                                )}
                            </div>

                            {!selectedEstablishment.certifying_bodies && selectedEstablishment.products && selectedEstablishment.products.length > 0 && (
                                <p className="text-[11px] text-slate-500 leading-snug">
                                    Menu items below are sourced from public directory profiles. Individual dishes and kitchen inventory have not been audited or verified compliant by an accredited Halal Certification Body (HCB).
                                </p>
                            )}

                            {selectedEstablishment.products && selectedEstablishment.products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedEstablishment.products.map((p) => (
                                        <div
                                            key={p.id}
                                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                                        >
                                            <div className="truncate mr-2">
                                                <span className="font-semibold text-slate-800 block truncate">
                                                    {p.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {p.category || 'Food Item'}
                                                </span>
                                            </div>
                                            {selectedEstablishment.certifying_bodies ? (
                                                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Listed Dish
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                                    Reported
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                                    {selectedEstablishment.certifying_bodies
                                        ? 'No individual dishes itemized in directory record. Refer to physical establishment menu.'
                                        : 'No individual menu items reported in directory profile. Refer to physical establishment menu.'}
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

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
