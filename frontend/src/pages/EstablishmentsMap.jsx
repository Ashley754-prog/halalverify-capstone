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

// Fallback seed establishments for Zamboanga City (from Spike S4) when live registry is empty
const SEED_ESTABLISHMENTS = [
    { id: 'seed-1', name: 'Al-Barka Halal Kitchen', type: 'Eatery', address: 'Canelar St, Zamboanga City', city: 'Zamboanga City', latitude: 6.9130, longitude: 122.0750, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-01' },
    { id: 'seed-2', name: 'Yakan Heritage Cafe', type: 'Restaurant', address: 'Upper Calarian, Zamboanga City', city: 'Zamboanga City', latitude: 6.9550, longitude: 122.0500, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-02' },
    { id: 'seed-3', name: 'Sulu Sunset Grill', type: 'Restaurant', address: 'Paseo del Mar, Zamboanga City', city: 'Zamboanga City', latitude: 6.9105, longitude: 122.0705, halal_status: 'expired', certificate_number: 'HDIP-ZAM-2023-09' },
    { id: 'seed-4', name: 'Zambo Halal Mart', type: 'Retailer', address: 'Gov. Lim Ave, Zamboanga City', city: 'Zamboanga City', latitude: 6.9160, longitude: 122.0740, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-04' },
    { id: 'seed-5', name: 'Tumaga Tapsi House', type: 'Eatery', address: 'Tumaga, Zamboanga City', city: 'Zamboanga City', latitude: 6.9700, longitude: 122.0700, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-05' },
    { id: 'seed-6', name: 'Pasonanca Pantry', type: 'Retailer', address: 'Pasonanca, Zamboanga City', city: 'Zamboanga City', latitude: 6.9800, longitude: 122.0800, halal_status: 'needs_review', certificate_number: null },
    { id: 'seed-7', name: 'Baliwasan Bakeshop', type: 'Bakery', address: 'Baliwasan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9150, longitude: 122.0600, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-07' },
    { id: 'seed-8', name: 'Sta. Maria Satti House', type: 'Eatery', address: 'Sta. Maria, Zamboanga City', city: 'Zamboanga City', latitude: 6.9100, longitude: 122.0500, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-08' },
    { id: 'seed-9', name: 'Guiwan Grille & More', type: 'Restaurant', address: 'Guiwan Highway, Zamboanga City', city: 'Zamboanga City', latitude: 6.9200, longitude: 122.1050, halal_status: 'needs_review', certificate_number: null },
    { id: 'seed-10', name: 'Boalan Beef Rendang', type: 'Restaurant', address: 'Boalan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9350, longitude: 122.1100, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-10' },
    { id: 'seed-11', name: 'San Jose Sari-Sari Plus', type: 'Retailer', address: 'San Jose Gusu, Zamboanga City', city: 'Zamboanga City', latitude: 6.9250, longitude: 122.0350, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-11' },
    { id: 'seed-12', name: 'Ayala Agri Market', type: 'Market', address: 'Ayala, Zamboanga City', city: 'Zamboanga City', latitude: 6.9500, longitude: 121.9800, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-12' },
    { id: 'seed-13', name: 'Tetuan Tiyula Itum', type: 'Restaurant', address: 'Tetuan, Zamboanga City', city: 'Zamboanga City', latitude: 6.9430, longitude: 122.0950, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-13' },
    { id: 'seed-14', name: 'Canelar Curacha Grill', type: 'Restaurant', address: 'Canelar, Zamboanga City', city: 'Zamboanga City', latitude: 6.9120, longitude: 122.0730, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-14' },
    { id: 'seed-15', name: 'Camino Nuevo Catering', type: 'Catering', address: 'Camino Nuevo, Zamboanga City', city: 'Zamboanga City', latitude: 6.9190, longitude: 122.0690, halal_status: 'verified', certificate_number: 'IDCP-ZAM-2024-15' },
];

const STATUS_CONFIG = {
    verified: { label: 'Verified Halal', color: '#10b981', weight: 1.0, badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    needs_review: { label: 'Needs Review', color: '#f59e0b', weight: 0.4, badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
    expired: { label: 'Expired / Revoked', color: '#ef4444', weight: 0.0, badgeBg: 'bg-red-50 text-red-700 border-red-200' },
};

export default function EstablishmentsMap() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const heatLayerRef = useRef(null);
    const markersLayerRef = useRef(null);

    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // Update markers and heatmap layers when establishments or filter states change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

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
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (showHeatmap && filtered.length > 0) {
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
    }, [establishments, selectedStatus, searchQuery, showHeatmap, showMarkers]);

    const flyToEstablishment = (est) => {
        if (!mapInstanceRef.current || !est.latitude || !est.longitude) return;
        mapInstanceRef.current.flyTo([est.latitude, est.longitude], 16, { duration: 1.2 });
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

            {/* Map Container & Sidebar Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[550px] relative">
                {/* Map View (2 cols on desktop) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                    {/* Layer Controls Bar */}
                    <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 shadow-md flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={showHeatmap}
                                onChange={(e) => setShowHeatmap(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <Flame size={14} className="text-red-500" />
                            Density Heatmap
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
                    <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-3 shadow-md text-xs space-y-1.5 hidden sm:block">
                        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                            Compliance Status
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600">Verified Halal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-slate-600">Needs Review</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="text-slate-600">Expired / Revoked</span>
                        </div>
                    </div>

                    {/* Leaflet DOM Node */}
                    <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />
                </div>

                {/* Right Column: Establishment Directory & Quick Nav */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4">
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
                                <option value="expired">Expired / Revoked</option>
                            </select>
                        </div>

                        {/* Establishments Scroll List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
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
