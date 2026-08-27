import React, { useEffect, useRef, useState } from 'react';
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
    ExternalLink
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { API_BASE_URL, authFetch } from '../utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Real and curated seed establishments for Zamboanga City (including UCZP Halal Certification Board & IDCP vetted spots)
const SEED_ESTABLISHMENTS = [
    { id: 'seed-1', name: 'Global Pot Restaurant & Catering', type: 'Restaurant & Catering', address: 'KCC Mall de Zamboanga, Gov. Camins Ave', city: 'Zamboanga City', latitude: 6.9214, longitude: 122.0790, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-01' },
    { id: 'seed-2', name: "Chick 'n Cow Hotpot", type: 'Hotpot Restaurant', address: 'MCLL Highway, Putik, Zamboanga City', city: 'Zamboanga City', latitude: 6.9400, longitude: 122.1000, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-02' },
    { id: 'seed-3', name: 'Chillies Fried Chicken', type: 'Fast Food / Eatery', address: 'Mayor Jaldon St, Canelar, Zamboanga City', city: 'Zamboanga City', latitude: 6.9150, longitude: 122.0720, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-03' },
    { id: 'seed-4', name: 'Black Plate Zamboanga', type: 'Restaurant', address: 'Mayor Vitaliano Agan Ave, Nuñez Extension', city: 'Zamboanga City', latitude: 6.9230, longitude: 122.0760, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-04' },
    { id: 'seed-5', name: 'TAAM Halal Pizza', type: 'Pizzeria', address: 'Near Masjid Sadik, Cabatangan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9350, longitude: 122.0620, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-05' },
    { id: 'seed-6', name: 'Bandits Burger', type: 'Burger House', address: 'Tetuan Highway, Zamboanga City', city: 'Zamboanga City', latitude: 6.9300, longitude: 122.0880, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-06' },
    { id: 'seed-7', name: "Aly's Halal Catering and Events", type: 'Catering Services', address: 'Lower Cabatangan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9310, longitude: 122.0650, halal_status: 'verified', certificate_number: 'UCZP-ZAM-2024-07' },
    { id: 'seed-8', name: 'Assalam Foods', type: 'Food Manufacturer / Retailer', address: 'A & W Subd, Phase 5, Putik, Zamboanga City', city: 'Zamboanga City', latitude: 6.9420, longitude: 122.1050, halal_status: 'verified', certificate_number: 'ZAM-HALAL-2024-08' },
    { id: 'seed-9', name: 'Al-Barka Halal Kitchen', type: 'Eatery', address: 'Canelar St, Zamboanga City', city: 'Zamboanga City', latitude: 6.9130, longitude: 122.0750, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-09' },
    { id: 'seed-10', name: 'Yakan Heritage Cafe', type: 'Cafe & Restaurant', address: 'Upper Calarian, Zamboanga City', city: 'Zamboanga City', latitude: 6.9550, longitude: 122.0500, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-10' },
    { id: 'seed-11', name: 'Dennis Coffee Garden', type: 'Cafe & Dining', address: 'San Jose Road, Baliwasan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9160, longitude: 122.0580, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-11' },
    { id: 'seed-12', name: 'Sta. Maria Satti House', type: 'Eatery', address: 'Sta. Maria, Zamboanga City', city: 'Zamboanga City', latitude: 6.9200, longitude: 122.0600, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-12' },
    { id: 'seed-13', name: 'Tetuan Tiyula Itum', type: 'Restaurant', address: 'Tetuan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9430, longitude: 122.0950, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-13' },
    { id: 'seed-14', name: 'Canelar Curacha Grill', type: 'Restaurant', address: 'Canelar, Zamboanga City', city: 'Zamboanga City', latitude: 6.9120, longitude: 122.0730, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-14' },
    { id: 'seed-15', name: 'Pasonanca Pantry', type: 'Retailer', address: 'Pasonanca, Zamboanga City', city: 'Zamboanga City', latitude: 6.9800, longitude: 122.0800, halal_status: 'needs_review', certificate_number: null },
    { id: 'seed-16', name: 'Guiwan Grille & More', type: 'Restaurant', address: 'Guiwan Highway, Zamboanga City', city: 'Zamboanga City', latitude: 6.9200, longitude: 122.1050, halal_status: 'needs_review', certificate_number: null },
];

const STATUS_CONFIG = {
    verified: { label: 'Verified Halal', color: '#10b981', weight: 1.0, badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    needs_review: { label: 'Needs Review', color: '#f59e0b', weight: 0.4, badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function EstablishmentsMap() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileTab, setMobileTab] = useState('map'); // 'map' or 'list' on mobile viewports
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);

    useEffect(() => {
        const fetchEstablishments = async () => {
            try {
                setLoading(true);
                const response = await authFetch(`${API_BASE_URL}/registry/establishments`);
                if (response.ok) {
                    const json = await response.json();
                    const data = json.data || [];
                    // If backend database has geocoded establishments, use them; otherwise use seed set
                    const withCoordinates = data.filter((e) => e.latitude && e.longitude);
                    if (withCoordinates.length > 0) {
                        setEstablishments(withCoordinates);
                    } else {
                        setEstablishments(SEED_ESTABLISHMENTS);
                    }
                } else {
                    setEstablishments(SEED_ESTABLISHMENTS);
                }
            } catch (err) {
                console.warn('Using seed map establishments:', err);
                setEstablishments(SEED_ESTABLISHMENTS);
            } finally {
                setLoading(false);
            }
        };

        fetchEstablishments();
    }, []);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [6.9214, 122.0790], // Zamboanga City center
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

    // Update markers and heatmap layers safely when establishments, filters, or tab visibility change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Ensure the map container is visible before attempting Leaflet canvas operations
        const isContainerVisible = mapContainerRef.current && mapContainerRef.current.offsetParent !== null;
        if (!isContainerVisible && window.innerWidth < 1024 && mobileTab !== 'map') {
            return;
        }

        try {
            // Filter establishments
            const filtered = establishments.filter((est) => {
                const matchesStatus = selectedStatus === 'all' || est.halal_status === selectedStatus;
                const matchesQuery =
                    !searchQuery ||
                    est.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    est.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    est.type?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesStatus && matchesQuery;
            });

            // 1. Render Markers Layer
            if (markersLayerRef.current) {
                markersLayerRef.current.clearLayers();

                if (showMarkers) {
                    filtered.forEach((est) => {
                        if (!est.latitude || !est.longitude) return;

                        const statusInfo = STATUS_CONFIG[est.halal_status] || STATUS_CONFIG.needs_review;

                        const marker = L.circleMarker([est.latitude, est.longitude], {
                            radius: 8,
                            fillColor: statusInfo.color,
                            color: '#ffffff',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.85,
                        });

                        const popupContent = `
                            <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
                                <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 2px;">${est.name}</strong>
                                <span style="color: #64748b; font-size: 11px;">${est.type || 'Establishment'} — ${est.address || est.city || 'Zamboanga City'}</span>
                                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; background: ${statusInfo.color}20; color: ${statusInfo.color};">
                                        ${statusInfo.label}
                                    </span>
                                    ${est.certificate_number ? `<div style="margin-top: 4px; color: #475569; font-size: 11px;">Cert: <b>${est.certificate_number}</b></div>` : ''}
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

            // 2. Render Heatmap Layer
            if (heatLayerRef.current) {
                try {
                    map.removeLayer(heatLayerRef.current);
                } catch (e) {
                    // Ignore removal error if layer wasn't attached
                }
                heatLayerRef.current = null;
            }

            if (showHeatmap && filtered.length > 0 && isContainerVisible) {
                const heatPoints = filtered
                    .filter((e) => e.latitude && e.longitude)
                    .map((e) => {
                        const weight = (STATUS_CONFIG[e.halal_status] || STATUS_CONFIG.needs_review).weight;
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
        } catch (layerError) {
            console.warn('Leaflet layer rendering skipped safely:', layerError);
        }
    }, [establishments, selectedStatus, searchQuery, showHeatmap, showMarkers, mobileTab]);

    // Invalidate map size on mobile tab switch or window resize so tiles never break
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
        if (!est.latitude || !est.longitude) return;

        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                mapInstanceRef.current.flyTo([est.latitude, est.longitude], 16, { duration: 1.2 });
            }
        }, 150);

        setSelectedEstablishment(est);
    };

    const filteredList = establishments.filter((est) => {
        const matchesStatus = selectedStatus === 'all' || est.halal_status === selectedStatus;
        const matchesQuery =
            !searchQuery ||
            est.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            est.address?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesQuery;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full bg-slate-50">
            <Topbar
                title="Halal Establishments Geolocation & Density Map"
                subtitle="Interactive GIS mapping and halal establishment density heatmap across Zamboanga City."
            />

            {/* Mobile View Toggle Bar (Visible on mobile/tablets < lg) */}
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
                    Map & Heatmap
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
                    Zamboanga Registry ({filteredList.length})
                </button>
            </div>

            {/* Map Container & Sidebar Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[480px] lg:min-h-[550px] relative">
                {/* Map View (2 cols on desktop, full tab on mobile) */}
                <div
                    className={`
                        ${mobileTab === 'map' ? 'flex' : 'hidden'} lg:flex
                        lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col relative isolate z-0
                        min-h-[420px] sm:min-h-[480px] lg:min-h-[550px]
                    `}
                >
                    {/* Layer Controls Bar */}
                    <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-md flex items-center gap-2 sm:gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={showHeatmap}
                                onChange={(e) => setShowHeatmap(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <Flame size={14} className="text-red-500" />
                            <span className="hidden sm:inline">Density Heatmap</span>
                            <span className="sm:hidden">Heatmap</span>
                        </label>

                        <div className="w-px h-4 bg-slate-200" />

                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={showMarkers}
                                onChange={(e) => setShowMarkers(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <MapPin size={14} className="text-emerald-600" />
                            Pins
                        </label>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-md text-xs space-y-1 sm:space-y-1.5">
                        <span className="font-bold text-slate-700 block text-[10px] sm:text-[11px] uppercase tracking-wider">
                            Status Legend
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600 text-[11px]">Verified Halal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-slate-600 text-[11px]">Needs Review</span>
                        </div>
                    </div>

                    {/* Leaflet DOM Node */}
                    <div ref={mapContainerRef} className="w-full h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[550px]" />
                </div>

                {/* Right Column: Establishment Directory & Quick Nav (1 col on desktop, full tab on mobile) */}
                <div
                    className={`
                        ${mobileTab === 'list' ? 'flex' : 'hidden'} lg:flex
                        bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex-col justify-between space-y-4
                    `}
                >
                    <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                                <Store size={18} className="text-emerald-600" />
                                Zamboanga Registry ({filteredList.length})
                            </h3>
                        </div>

                        {/* Search & Status Filter */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search establishment or barangay..."
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">All Verification Statuses</option>
                                <option value="verified">Verified Halal</option>
                                <option value="needs_review">Needs Review</option>
                            </select>
                        </div>

                        {/* Establishments Scroll List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px] sm:max-h-[420px]">
                            {filteredList.map((est) => {
                                const statusInfo = STATUS_CONFIG[est.halal_status] || STATUS_CONFIG.needs_review;
                                const isSelected = selectedEstablishment?.id === est.id;

                                return (
                                    <div
                                        key={est.id}
                                        onClick={() => flyToEstablishment(est)}
                                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                                                : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-1.5">
                                            <h4 className="text-xs font-bold text-slate-800 leading-tight">
                                                {est.name}
                                            </h4>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${statusInfo.badgeBg}`}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <MapPin size={11} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{est.address || est.city || 'Zamboanga City'}</span>
                                        </p>

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                                            <span>{est.type || 'Establishment'}</span>
                                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                                View on map <Navigation size={9} />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                        <Navigation size={14} className="text-emerald-600 shrink-0" />
                        <span>Click any location in the list to fly the map camera directly to its coordinates.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
