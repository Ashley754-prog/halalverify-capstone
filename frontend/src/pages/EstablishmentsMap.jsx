import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    MapPin,
    Store,
    Search,
    Compass,
    Crosshair,
    Loader2,
    X,
    Navigation,
    ShieldCheck,
    UtensilsCrossed,
    Phone,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import EstablishmentDetailModal from '../components/map/EstablishmentDetailModal';
import SearchBar from '../components/ui/SearchBar';
import { getStatusConfig, ZAMBOANGA_DISTRICTS, resolveZamboangaDistrict } from '../data/constants';
import EstablishmentsSidebarList from '../components/map/EstablishmentsSidebarList';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { SEED_ESTABLISHMENTS } from '../data/seedEstablishments';

// Quick-filter pills. Venue status and moderation are single-select groups;
// amenities are independent toggles, so the row is rendered in three groups.
const VENUE_STATUS_PILLS = [
    { key: 'all', label: 'All Venues' },
    { key: 'verified', label: 'Halal Certified' },
    { key: 'muslim_owned', label: 'Muslim-Owned' },
    { key: 'muslim_friendly', label: 'Muslim-Friendly' },
    { key: 'vegetarian_vegan', label: 'Plant-Based' },
];

const MODERATION_PILLS = [
    { key: 'needs_review', label: 'Pending Verification' },
    { key: 'flagged', label: 'Expired / Flagged' },
];

const AMENITY_PILLS = [
    { key: 'prayer_space', label: 'Prayer Area', icon: Compass },
    { key: 'alcohol_free', label: 'Alcohol-Free', icon: ShieldCheck },
];

const FILTER_PILL_BASE = 'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';
const FILTER_PILL_ACTIVE = 'bg-emerald-600 text-white shadow-xs';
const FILTER_PILL_ACTIVE_MODERATION = 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs';
const FILTER_PILL_IDLE = 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200';


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

export default function EstablishmentsMap({ userRole, onViewChange, initialSearchQuery = '' }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userMarkerRef = useRef(null);

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileTab, setMobileTab] = useState(initialSearchQuery ? 'list' : 'map');
    const [showMarkers, setShowMarkers] = useState(true);

    // Filters (Certifier filter removed per instructions)
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDistrict, setSelectedDistrict] = useState('all');
    const [selectedAmenity, setSelectedAmenity] = useState('all');
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

    // Auto-detect user GPS silently on mount to compute distances & highlight nearest venue
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const distToCenter = calculateDistanceKm(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    ZAMBOANGA_CENTER.lat,
                    ZAMBOANGA_CENTER.lng
                );
                // If browser reports coordinates far outside Zamboanga City (e.g. ISP router in Dipolog, Cebu, Manila),
                // ignore it so we don't skew distances or misplace user location
                if (distToCenter && distToCenter > 70) {
                    return;
                }
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            () => {
                // Silent fallback if user denies or GPS times out on initial load
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
        );
    }, []);

    // Modals & Previews
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);
    const [activePreviewEst, setActivePreviewEst] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const applySeedFallback = useCallback(() => {
        let list = [...SEED_ESTABLISHMENTS];
        if (selectedStatus === 'all') {
            list = list.filter((e) => {
                const key = getStatusConfig(e).key;
                return key !== 'needs_review' && key !== 'pending_review' && key !== 'flagged' && key !== 'rejected';
            });
        } else {
            list = list.filter((e) => {
                const key = getStatusConfig(e).key;
                if (selectedStatus === 'needs_review' || selectedStatus === 'pending_review') {
                    return key === 'needs_review' || key === 'pending_review';
                }
                if (selectedStatus === 'verified' || selectedStatus === 'halal_certified') {
                    return key === 'verified';
                }
                if (selectedStatus === 'muslim_owned') {
                    return key === 'muslim_owned' || key === 'community';
                }
                if (selectedStatus === 'muslim_friendly') {
                    return key === 'muslim_friendly';
                }
                if (selectedStatus === 'vegetarian_vegan') {
                    return key === 'vegetarian_vegan';
                }
                if (selectedStatus === 'flagged') {
                    return key === 'flagged' || key === 'rejected';
                }
                return key === selectedStatus;
            });
        }
        if (userLocation) {
            list = list.map((e) => ({
                ...e,
                distance_km: calculateDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
            }));
            list.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
        }
        setEstablishments(list);
    }, [selectedStatus, userLocation]);

    // Fetch establishments from API or fallback
    const fetchEstablishments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (userLocation?.lat && userLocation?.lng) {
                params.append('lat', userLocation.lat);
                params.append('lng', userLocation.lng);
            }
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            // 1. Query Supabase directly first for instant ~150ms response (zero cold start)
            try {
                let query = supabase.from('establishments').select('*, certifying_bodies(*)').order('name');
                const { data: sbData, error: sbErr } = await query;
                if (!sbErr && sbData && sbData.length > 0) {
                    let withCoords = sbData.filter((e) => e.latitude && e.longitude);
                    withCoords = withCoords.filter((e) => {
                        const st = (e.halal_status || '').toLowerCase().trim();
                        if (st === 'rejected' || st.includes('reject') || st === 'flagged' || st === 'suspended' || st === 'expired') {
                            return selectedStatus === 'flagged' || selectedStatus === 'rejected';
                        }
                        if (st === 'needs_review' || st === 'pending' || st.includes('pending') || st.includes('needs_review')) {
                            return selectedStatus === 'needs_review' || selectedStatus === 'pending_review';
                        }
                        return true;
                    });

                    if (selectedStatus === 'all') {
                        withCoords = withCoords.filter((e) => {
                            const cfg = getStatusConfig(e);
                            return cfg.key !== 'needs_review' && cfg.key !== 'pending_review' && cfg.key !== 'flagged' && cfg.key !== 'rejected';
                        });
                    } else {
                        withCoords = withCoords.filter((e) => {
                            const cfg = getStatusConfig(e);
                            if (selectedStatus === 'verified' || selectedStatus === 'halal_certified') {
                                return cfg.key === 'verified';
                            }
                            if (selectedStatus === 'muslim_owned') {
                                return cfg.key === 'muslim_owned' || cfg.key === 'community';
                            }
                            if (selectedStatus === 'muslim_friendly') {
                                return cfg.key === 'muslim_friendly';
                            }
                            if (selectedStatus === 'vegetarian_vegan') {
                                return cfg.key === 'vegetarian_vegan';
                            }
                            if (selectedStatus === 'needs_review' || selectedStatus === 'pending_review') {
                                return cfg.key === 'needs_review' || cfg.key === 'pending_review';
                            }
                            if (selectedStatus === 'flagged') {
                                return cfg.key === 'flagged' || cfg.key === 'rejected';
                            }
                            return cfg.key === selectedStatus;
                        });
                    }
                    if (userLocation) {
                        withCoords = withCoords.map((e) => ({
                            ...e,
                            distance_km: calculateDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude)
                        }));
                        withCoords.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
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
                    let withCoords = data.filter((e) => e.latitude && e.longitude);
                    if (selectedStatus === 'all') {
                        withCoords = withCoords.filter((e) => {
                            const cfg = getStatusConfig(e);
                            return cfg.key !== 'needs_review' && cfg.key !== 'pending_review' && cfg.key !== 'flagged' && cfg.key !== 'rejected';
                        });
                    }
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
    }, [userLocation, selectedStatus, applySeedFallback]);

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
                const distToCenter = calculateDistanceKm(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    ZAMBOANGA_CENTER.lat,
                    ZAMBOANGA_CENTER.lng
                );
                setIsLocating(false);

                if (distToCenter && distToCenter > 70) {
                    setToast({
                        visible: true,
                        message: 'Your network or browser reported a location outside Zamboanga City. Showing Zamboanga City map.',
                        type: 'info',
                    });
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize();
                        mapInstanceRef.current.flyTo([ZAMBOANGA_CENTER.lat, ZAMBOANGA_CENTER.lng], 13, { duration: 1.0 });
                    }
                    return;
                }

                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setUserLocation(coords);

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
        return establishments
            .filter((est) => {
                const matchesQuery =
                    !searchQuery ||
                    est.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    est.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    est.type?.toLowerCase().includes(searchQuery.toLowerCase());
                const district = resolveZamboangaDistrict(est);
                const matchesDistrict = selectedDistrict === 'all' || district.id === selectedDistrict;

                let matchesAmenity = true;
                if (selectedAmenity === 'prayer_space') {
                    matchesAmenity = Boolean(
                        est.has_prayer_space ||
                        est.description?.toLowerCase().includes('prayer') ||
                        est.description?.toLowerCase().includes('musalah') ||
                        (Array.isArray(est.amenities) && est.amenities.some(a => String(a).toLowerCase().includes('prayer')))
                    );
                } else if (selectedAmenity === 'alcohol_free') {
                    matchesAmenity = Boolean(
                        est.is_alcohol_free ||
                        est.description?.toLowerCase().includes('alcohol') ||
                        (Array.isArray(est.amenities) && est.amenities.some(a => String(a).toLowerCase().includes('alcohol')))
                    );
                }

                return matchesQuery && matchesDistrict && matchesAmenity;
            })
            .sort((a, b) => {
                if (a.distance_km != null && b.distance_km != null) {
                    return a.distance_km - b.distance_km;
                }
                return 0;
            });
    }, [establishments, searchQuery, selectedDistrict, selectedAmenity]);

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
                    .bindPopup('<div style="font-family:system-ui;font-size:12px;font-weight:700;color:#1e3a8a;">Your Current Location</div>')
                    .addTo(userPinGroup);

                userPinGroup.addTo(map);
                userMarkerRef.current = userPinGroup;
            }

            if (markersLayerRef.current) {
                markersLayerRef.current.clearLayers();

                if (showMarkers) {
                    const validEsts = filteredList.filter((e) => e.latitude && e.longitude);
                    const selectedEst = activePreviewEst && validEsts.find((e) => e.id === activePreviewEst.id);
                    const otherEsts = selectedEst ? validEsts.filter((e) => e.id !== selectedEst.id) : validEsts;

                    // 1. Render all other markers first (slightly dimmed if one is selected)
                    otherEsts.forEach((est) => {
                        const statusConfig = getStatusConfig(est);
                        const hasSelection = Boolean(selectedEst);

                        const normalIcon = L.divIcon({
                            className: 'map-pin-container',
                            html: `<div class="map-pin-circle ${hasSelection ? 'map-pin-dimmed' : ''}" style="background-color: ${statusConfig.color};"></div>`,
                            iconSize: [18, 18],
                            iconAnchor: [9, 9],
                        });

                        const marker = L.marker([est.latitude, est.longitude], {
                            icon: normalIcon,
                            keyboard: false,
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

                    // 2. Render selected marker with fixed HTML divIcon so it stays crisp and never scales or distorts during zoom animations
                    if (selectedEst) {
                        const statusConfig = getStatusConfig(selectedEst);

                        const selectedIcon = L.divIcon({
                            className: 'map-pin-selected-container',
                            html: `
                                <div class="selected-pin-wrapper">
                                    <div class="selected-pin-halo" style="background-color: ${statusConfig.color}; border-color: ${statusConfig.color};"></div>
                                    <div class="selected-pin-core" style="background-color: ${statusConfig.color};"></div>
                                    <div class="selected-pin-name-label">${selectedEst.name}</div>
                                </div>
                            `,
                            iconSize: [44, 44],
                            iconAnchor: [22, 22],
                        });

                        const selectedMarker = L.marker([selectedEst.latitude, selectedEst.longitude], {
                            icon: selectedIcon,
                            zIndexOffset: 1000,
                            keyboard: false,
                        });

                        selectedMarker.on('click', (e) => {
                            if (e && e.originalEvent) {
                                L.DomEvent.stopPropagation(e);
                            }
                            setActivePreviewEst(selectedEst);
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.panTo([selectedEst.latitude, selectedEst.longitude], { animate: true, duration: 0.35 });
                            }
                        });

                        markersLayerRef.current.addLayer(selectedMarker);
                    }
                }
            }
        } catch (e) {
            console.warn('Map layer update handled:', e);
        }
    }, [filteredList, showMarkers, userLocation, mobileTab, activePreviewEst]);

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
                mapInstanceRef.current.flyTo([est.latitude, est.longitude], 16, { duration: 0.85 });
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
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search name, cuisine, street..."
                    className="order-1 md:order-2 w-full md:w-64 lg:w-72 shrink-0"
                    size="sm"
                />

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
                        <MapPin size={13} className="text-slate-500 shrink-0" />
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                            aria-label="Filter by Zamboanga District"
                        >
                            {ZAMBOANGA_DISTRICTS.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {/* Quick One-Tap Filter Pills Row */}
            <div className="relative shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pr-7 select-none">
                    {VENUE_STATUS_PILLS.map((pill) => {
                        const isActive = pill.key === 'all'
                            ? selectedStatus === 'all' && selectedAmenity === 'all'
                            : selectedStatus === pill.key;
                        return (
                            <button
                                key={pill.key}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => { setSelectedStatus(pill.key); setSelectedAmenity('all'); }}
                                className={`${FILTER_PILL_BASE} ${isActive ? FILTER_PILL_ACTIVE : FILTER_PILL_IDLE}`}
                            >
                                {pill.label}
                            </button>
                        );
                    })}

                    {userRole === 'admin' && (
                        <>
                            <span aria-hidden="true" className="h-4 w-px bg-slate-200 shrink-0 mx-1" />
                            {MODERATION_PILLS.map((pill) => {
                                const isActive = selectedStatus === pill.key;
                                return (
                                    <button
                                        key={pill.key}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => { setSelectedStatus(pill.key); setSelectedAmenity('all'); }}
                                        className={`${FILTER_PILL_BASE} ${isActive ? FILTER_PILL_ACTIVE_MODERATION : FILTER_PILL_IDLE}`}
                                    >
                                        {pill.label}
                                    </button>
                                );
                            })}
                        </>
                    )}

                    <span aria-hidden="true" className="h-4 w-px bg-slate-200 shrink-0 mx-1" />

                    {AMENITY_PILLS.map((pill) => {
                        const Icon = pill.icon;
                        const isActive = selectedAmenity === pill.key;
                        return (
                            <button
                                key={pill.key}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setSelectedAmenity(isActive ? 'all' : pill.key)}
                                className={`${FILTER_PILL_BASE} ${isActive ? FILTER_PILL_ACTIVE : FILTER_PILL_IDLE}`}
                            >
                                <Icon size={12} />
                                <span>{pill.label}</span>
                            </button>
                        );
                    })}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 to-transparent" />
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

                    {/* Top-left Pins toggle */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-300 p-1.5 sm:p-2 shadow-md flex items-center text-[11px] sm:text-xs">
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
                    </div>

                    {/* Docked Establishment Preview Card */}
                    {activePreviewEst && (
                        <div className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-3 sm:bottom-3 sm:max-w-sm sm:w-96 z-[1000] bg-white/98 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-2xl p-2.5 sm:p-3.5 flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Card Header: Status Badge, Cert & Close Button */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {(() => {
                                        const previewConfig = getStatusConfig(activePreviewEst);
                                        const certCode = activePreviewEst.certifying_bodies?.code;
                                        return (
                                            <>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${previewConfig.badgeBg}`}
                                                >
                                                    {previewConfig.label}
                                                </span>
                                                {certCode && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        {certCode}
                                                    </span>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {activePreviewEst.distance_km && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            {activePreviewEst.distance_km} km away
                                        </span>
                                    )}
                                    {userLocation && filteredList[0]?.id === activePreviewEst.id && (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                            Nearest to You
                                        </span>
                                    )}
                                    {(() => {
                                        const dInfo = resolveZamboangaDistrict(activePreviewEst);
                                        return dInfo ? (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${dInfo.badgeClass}`}>
                                                {dInfo.shortLabel}
                                            </span>
                                        ) : null;
                                    })()}
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
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                                    {activePreviewEst.type || 'Restaurant'}
                                </p>
                                <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5 line-clamp-1">
                                    <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span>{activePreviewEst.address || activePreviewEst.city || 'Zamboanga City'}</span>
                                </p>
                            </div>

                            {/* Amenity Badges */}
                            {(() => {
                                const hasPrayer = Boolean(
                                    activePreviewEst.has_prayer_space ||
                                    (activePreviewEst.description && (activePreviewEst.description.toLowerCase().includes('prayer') || activePreviewEst.description.toLowerCase().includes('musalah'))) ||
                                    (Array.isArray(activePreviewEst.amenities) && activePreviewEst.amenities.some((a) => String(a).toLowerCase().includes('prayer')))
                                );
                                const hasAlcohol = Boolean(
                                    activePreviewEst.is_alcohol_free ||
                                    (activePreviewEst.description && activePreviewEst.description.toLowerCase().includes('alcohol')) ||
                                    (Array.isArray(activePreviewEst.amenities) && activePreviewEst.amenities.some((a) => String(a).toLowerCase().includes('alcohol')))
                                );
                                if (!hasPrayer && !hasAlcohol) return null;
                                return (
                                    <div className="flex flex-wrap gap-1">
                                        {hasPrayer && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                                <Compass size={10} className="text-emerald-600" />
                                                Prayer Space
                                            </span>
                                        )}
                                        {hasAlcohol && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                                <ShieldCheck size={10} className="text-emerald-600" />
                                                Alcohol-Free
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Popular Dishes / Menu Highlights Preview */}
                            {(() => {
                                const dishes = (activePreviewEst.associated_products?.map(p => p.name) || [])
                                    .concat(activePreviewEst.product_names?.split(',').map(s => s.trim()).filter(Boolean) || []);
                                const uniqueDishes = Array.from(new Set(dishes)).filter(Boolean);
                                if (uniqueDishes.length === 0) return null;
                                return (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                                            <UtensilsCrossed size={11} className="text-emerald-600" />
                                            <span>Menu:</span>
                                        </span>
                                        {uniqueDishes.slice(0, 3).map((dish) => (
                                            <span
                                                key={dish}
                                                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[120px]"
                                            >
                                                {dish}
                                            </span>
                                        ))}
                                        {uniqueDishes.length > 3 && (
                                            <span className="text-[10px] text-slate-400 font-semibold">
                                                +{uniqueDishes.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Card Actions: View Full Details, Call, & Directions */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEstablishment(activePreviewEst)}
                                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs active:scale-98 cursor-pointer"
                                >
                                    <Store size={13} />
                                    <span>Details</span>
                                </button>
                                {(activePreviewEst.contact_number || activePreviewEst.phone) && (
                                    <a
                                        href={`tel:${activePreviewEst.contact_number || activePreviewEst.phone}`}
                                        className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1 shrink-0"
                                        title="Call establishment"
                                    >
                                        <Phone size={12} className="text-emerald-600" />
                                        <span>Call</span>
                                    </a>
                                )}
                                {activePreviewEst.latitude && activePreviewEst.longitude && (
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${activePreviewEst.latitude},${activePreviewEst.longitude}${userLocation?.lat && userLocation?.lng ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shrink-0"
                                        title="Get directions in Google Maps"
                                    >
                                        <Navigation size={12} className="text-blue-600" />
                                        <span>Directions</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <EstablishmentsSidebarList
                    filteredList={filteredList}
                    selectedEstablishment={activePreviewEst || selectedEstablishment}
                    loading={loading}
                    mobileTab={mobileTab}
                    onSelectEstablishment={flyToEstablishment}
                    onResetFilters={() => {
                        setSelectedStatus('all');
                        setSelectedDistrict('all');
                        setSelectedRadius('all');
                        setSelectedAmenity('all');
                        setSearchQuery('');
                    }}
                    userLocation={userLocation}
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
                    relatedTo: 'establishment',
                    subjectName: selectedEstablishment?.name,
                    establishmentId: selectedEstablishment?.id,
                    halalTier: selectedEstablishment?.halal_status || selectedEstablishment?.tier,
                }}
                onSuccess={() => {
                    setShowReportModal(false);
                    setToast({
                        visible: true,
                        message: 'Report submitted for administrative review.',
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
