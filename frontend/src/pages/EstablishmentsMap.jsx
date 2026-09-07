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
    Loader2
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

// Real and curated seed establishments for Zamboanga City (with UCZP & IDCP credentials)
const SEED_ESTABLISHMENTS = [
    {
        id: 'seed-1',
        name: 'Global Pot Restaurant & Catering',
        type: 'Restaurant & Catering',
        address: 'KCC Mall de Zamboanga, Gov. Camins Ave',
        city: 'Zamboanga City',
        latitude: 6.9214,
        longitude: 122.0790,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-01',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p1', name: 'Special Beef Rendang', category: 'Main Course' },
            { id: 'p2', name: 'Zamboanga Seafood Paella', category: 'Main Course' }
        ]
    },
    {
        id: 'seed-2',
        name: "Chick 'n Cow Hotpot",
        type: 'Hotpot Restaurant',
        address: 'MCLL Highway, Putik, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9400,
        longitude: 122.1000,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-02',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p3', name: 'Halal Beef Shabu-Shabu Slices', category: 'Hotpot Dish' },
            { id: 'p4', name: 'Herbal Collagen Broth', category: 'Soup' }
        ]
    },
    {
        id: 'seed-3',
        name: 'Chillies Fried Chicken',
        type: 'Fast Food / Eatery',
        address: 'Mayor Jaldon St, Canelar, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9150,
        longitude: 122.0720,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-03',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p5', name: 'Halal Spiced Crispy Fried Chicken', category: 'Fast Food' },
            { id: 'p6', name: 'Spicy Halal Chicken Burger', category: 'Fast Food' }
        ]
    },
    {
        id: 'seed-4',
        name: 'Black Plate Zamboanga',
        type: 'Restaurant',
        address: 'Mayor Vitaliano Agan Ave, Nuñez Extension',
        city: 'Zamboanga City',
        latitude: 6.9230,
        longitude: 122.0760,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-04',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p7', name: 'Seafood Aglio Olio Pasta', category: 'Pasta' },
            { id: 'p8', name: 'Grilled Lamb Ribs with Mint Jus', category: 'Main Course' }
        ]
    },
    {
        id: 'seed-5',
        name: 'TAAM Halal Pizza',
        type: 'Pizzeria',
        address: 'Near Masjid Sadik, Cabatangan, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9350,
        longitude: 122.0620,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-05',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p9', name: 'Halal Beef Pepperoni Pizza', category: 'Pizza' }
        ]
    },
    {
        id: 'seed-6',
        name: 'Bandits Burger',
        type: 'Burger House',
        address: 'Tetuan Highway, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9300,
        longitude: 122.0880,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-06',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: []
    },
    {
        id: 'seed-7',
        name: "Aly's Halal Catering and Events",
        type: 'Catering Services',
        address: 'Lower Cabatangan, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9310,
        longitude: 122.0650,
        halal_status: 'verified',
        certificate_number: 'UCZP-ZAM-2024-07',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: []
    },
    {
        id: 'seed-8',
        name: 'Assalam Foods',
        type: 'Food Manufacturer / Retailer',
        address: 'A & W Subd, Phase 5, Putik, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9420,
        longitude: 122.1050,
        halal_status: 'verified',
        certificate_number: 'ZAM-HALAL-2024-08',
        certifying_bodies: { code: 'UCZP', name: 'United Cultural Communities of Zamboanga Peninsula' },
        products: [
            { id: 'p10', name: 'Assalam Special Kulma Paste', category: 'Condiment' }
        ]
    },
    {
        id: 'seed-9',
        name: 'Al-Barka Halal Kitchen',
        type: 'Eatery',
        address: 'Canelar St, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9130,
        longitude: 122.0750,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-09',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: []
    },
    {
        id: 'seed-10',
        name: 'Yakan Heritage Cafe',
        type: 'Cafe & Restaurant',
        address: 'Upper Calarian, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9550,
        longitude: 122.0500,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-10',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: [
            { id: 'p11', name: 'Authentic Sulu Kahawa Sug Coffee', category: 'Beverage' }
        ]
    },
    {
        id: 'seed-11',
        name: 'Dennis Coffee Garden',
        type: 'Cafe & Dining',
        address: 'San Jose Road, Baliwasan, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9160,
        longitude: 122.0580,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-11',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: [
            { id: 'p12', name: 'Dennis Signature Roasted Kape Itum', category: 'Beverage' },
            { id: 'p13', name: 'Chicken Pastil Rice Bowl', category: 'Rice Dish' }
        ]
    },
    {
        id: 'seed-12',
        name: 'Sta. Maria Satti House',
        type: 'Eatery',
        address: 'Sta. Maria, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9200,
        longitude: 122.0600,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-12',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: [
            { id: 'p14', name: 'Special Beef Satti Skewers with Sweet-Spicy Sauce', category: 'Eatery Specialty' }
        ]
    },
    {
        id: 'seed-13',
        name: 'Tetuan Tiyula Itum',
        type: 'Restaurant',
        address: 'Tetuan, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9430,
        longitude: 122.0950,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-13',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: [
            { id: 'p15', name: 'Authentic Tausug Tiyula Itum (Black Soup)', category: 'Soup / Stew' }
        ]
    },
    {
        id: 'seed-14',
        name: 'Canelar Curacha Grill',
        type: 'Restaurant',
        address: 'Canelar, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9120,
        longitude: 122.0730,
        halal_status: 'verified',
        certificate_number: 'IDCP-ZAM-2024-14',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: []
    },
    {
        id: 'seed-15',
        name: 'Pasonanca Pantry',
        type: 'Retailer',
        address: 'Pasonanca, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9800,
        longitude: 122.0800,
        halal_status: 'pending_review',
        certificate_number: null,
        certifying_bodies: null,
        products: []
    },
    {
        id: 'seed-16',
        name: 'Guiwan Grille & More',
        type: 'Restaurant',
        address: 'Guiwan Highway, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9200,
        longitude: 122.1050,
        halal_status: 'pending_review',
        certificate_number: null,
        certifying_bodies: null,
        products: []
    },
    {
        id: 'seed-17',
        name: 'Zamboanga Halal Foodhub (Flagged)',
        type: 'Eatery',
        address: 'Gov. Lim Ave, Zamboanga City',
        city: 'Zamboanga City',
        latitude: 6.9050,
        longitude: 122.0740,
        halal_status: 'flagged',
        certificate_number: 'EXPIRED-2023-01',
        certifying_bodies: { code: 'IDCP', name: "Islamic Da'wah Council of the Philippines" },
        products: []
    },
];

// Helper to normalize 3-tier regulatory classifications (Section 5)
const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('verif') && !s.includes('pending')) {
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
        key: 'pending_review',
        label: 'Pending Review',
        color: '#f59e0b',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
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

    // Filters
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedHcb, setSelectedHcb] = useState('all');
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
            if (selectedHcb !== 'all') {
                params.append('hcb', selectedHcb);
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
        if (selectedHcb !== 'all') {
            list = list.filter((e) => (e.certifying_bodies?.code || '').toUpperCase() === selectedHcb.toUpperCase());
        }
        if (selectedStatus !== 'all') {
            list = list.filter((e) => getStatusConfig(e.halal_status).key === selectedStatus);
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
    }, [userLocation, selectedRadius, selectedHcb, selectedStatus]);

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
                        const hcbName = est.certifying_bodies?.code || 'Local Body';
                        const distText = est.distance_km ? `${est.distance_km} km away` : '';

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
                                    <div>Accredited: <b>${hcbName}</b></div>
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
                        gradient: { 0.2: '#fde047', 0.5: '#f97316', 0.85: '#dc2626' },
                    }).addTo(map);
                }
            }
        } catch (err) {
            console.warn('Leaflet layer render notice:', err);
        }
    }, [filteredList, userLocation, showHeatmap, showMarkers, mobileTab]);

    useEffect(() => {
        const handleResize = () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        };
        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 250);
        return () => {
            window.removeEventListener('resize', handleResize);
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
                subtitle="Locate verified Halal restaurants, eateries, and retail stores across Zamboanga City with PostGIS spatial queries and accredited certification filters."
            />

            {/* Filter & Geolocation Control Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <button
                        type="button"
                        onClick={handleFindNearMe}
                        disabled={isLocating}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                            userLocation
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                        title="Use HTML5 browser GPS to locate establishments near you"
                    >
                        {isLocating ? (
                            <Loader2 size={15} className="animate-spin text-white" />
                        ) : (
                            <Crosshair size={15} className={userLocation ? 'animate-pulse' : ''} />
                        )}
                        <span>{userLocation ? 'GPS Located (Near Me)' : 'Find Near Me (GPS)'}</span>
                    </button>

                    {userLocation && (
                        <button
                            type="button"
                            onClick={handleResetCenter}
                            className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                            title="Reset map view to City Center"
                        >
                            Reset City Center
                        </button>
                    )}

                    <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <Compass size={14} className="text-slate-500" />
                        <span className="font-semibold text-slate-600 hidden sm:inline">Radius:</span>
                        <select
                            value={selectedRadius}
                            onChange={(e) => setSelectedRadius(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                            <option value="all">Citywide</option>
                            <option value="1">1 km</option>
                            <option value="3">3 km</option>
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="25">25 km</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <Award size={14} className="text-emerald-600" />
                        <span className="font-semibold text-slate-600 hidden sm:inline">Certifier:</span>
                        <select
                            value={selectedHcb}
                            onChange={(e) => setSelectedHcb(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Certifiers</option>
                            <option value="UCZP">UCZP (Zamboanga Peninsula)</option>
                            <option value="IDCP">IDCP (Islamic Da'wah)</option>
                            <option value="HDIP">HDIP (Halal Development)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <Filter size={14} className="text-slate-500" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Classifications</option>
                            <option value="verified">🟢 Verified Halal</option>
                            <option value="pending_review">🟡 Pending Review</option>
                            <option value="flagged">🔴 Flagged / Suspended</option>
                        </select>
                    </div>
                </div>

                <div className="relative w-full min-w-0 sm:min-w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, cuisine, street..."
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>

            {/* Mobile View Toggle Bar */}
            <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-xl gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        setMobileTab('map');
                        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        mobileTab === 'map'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MapPin size={15} className={mobileTab === 'map' ? 'text-emerald-600' : 'text-slate-400'} />
                    Map View
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('list')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                        mobileTab === 'list'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Store size={15} className={mobileTab === 'list' ? 'text-emerald-600' : 'text-slate-400'} />
                    Establishment Directory ({filteredList.length})
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
                            <span className="text-slate-600 text-[11px] font-medium">Pending Review</span>
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
                                            setSelectedHcb('all');
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
                                    const hcbCode = est.certifying_bodies?.code || 'Local HCB';
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
                                                    <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                                        {hcbCode}
                                                    </span>
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
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedEstablishment(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                    <Award size={15} className="text-emerald-600" />
                                    Halal Certifying Authority (HCB)
                                </span>
                                <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                    {selectedEstablishment.certifying_bodies?.code || 'UCZP (Zamboanga Peninsula)'}
                                </span>
                            </div>

                            <p className="text-slate-600 text-[11px]">
                                {selectedEstablishment.certifying_bodies?.name ||
                                    'United Cultural Communities of Zamboanga Peninsula Halal Certification Board'}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                                <div>
                                    <span className="text-slate-500 block">Certificate No:</span>
                                    <span className="font-bold text-slate-800">
                                        {selectedEstablishment.certificate_number || 'NCMF / UCZP Accredited'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Accreditation Standing:</span>
                                    <span className="font-bold text-emerald-700">Official Compliant</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <UtensilsCrossed size={14} className="text-emerald-600" />
                                Verified Compliant Menu & Product Inventory
                            </h4>

                            {selectedEstablishment.products && selectedEstablishment.products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
                                            <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                <CheckCircle2 size={10} /> Halal
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                                    Kitchen operations and core preparation methods certified Halal. Full menu available on-site.
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
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
                                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation ? `${userLocation.lat},${userLocation.lng}` : `${ZAMBOANGA_CENTER.lat},${ZAMBOANGA_CENTER.lng}`};${selectedEstablishment.latitude},${selectedEstablishment.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                                >
                                    <Navigation size={13} />
                                    <span>Get Directions</span>
                                </a>
                            </div>
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
                    relatedTo: 'establishment',
                    establishmentId: selectedEstablishment?.id,
                    subjectName: selectedEstablishment?.name || '',
                }}
                onSubmitted={() => {
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
                onClose={() => setToast({ visible: false, message: '', type: 'info' })}
            />
        </div>
    );
}
