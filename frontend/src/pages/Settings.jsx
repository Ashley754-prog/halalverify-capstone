import { useState } from 'react';
import {
    BookOpen,
    Users,
    Award,
    Trash2,
    Camera,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    User,
    ExternalLink,
    HardDrive,
} from 'lucide-react';
import { PROPONENTS, JURISDICTION } from '../data/constants';
import Toast from '../components/ui/Toast';

export const Settings = ({ onViewChange, userRole }) => {
    const [clearing, setClearing] = useState(false);
    const [cameraTesting, setCameraTesting] = useState(false);
    const [cameraStatus, setCameraStatus] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const handleClearCache = async () => {
        try {
            setClearing(true);
            // Clear temporary local storage keys while preserving auth token
            const keysToKeep = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('sb-') || k.includes('auth-token'))) {
                    keysToKeep.add(k);
                }
            }

            const preserved = {};
            keysToKeep.forEach((k) => {
                preserved[k] = localStorage.getItem(k);
            });

            localStorage.clear();
            sessionStorage.clear();

            Object.entries(preserved).forEach(([k, v]) => {
                if (v !== null) localStorage.setItem(k, v);
            });

            // Update Service Worker Cache if supported
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map((cName) => {
                        return caches.delete(cName);
                    })
                );
            }

            setToast({
                visible: true,
                message: 'Local browser cache & offline storage cleared successfully.',
                type: 'success',
            });
        } catch (err) {
            console.error(err);
            setToast({
                visible: true,
                message: 'Could not completely clear local cache.',
                type: 'error',
            });
        } finally {
            setClearing(false);
        }
    };

    const handleTestCamera = async () => {
        setCameraTesting(true);
        setCameraStatus(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraStatus({ success: false, message: 'Camera API is not supported on this browser or requires HTTPS.' });
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            // Release tracks immediately
            stream.getTracks().forEach((track) => track.stop());
            setCameraStatus({ success: true, message: 'Camera permission and hardware verified successfully.' });
        } catch (err) {
            setCameraStatus({
                success: false,
                message: err.name === 'NotAllowedError'
                    ? 'Camera access was denied. Please allow camera permissions in your browser.'
                    : `Camera error: ${err.message}`,
            });
        } finally {
            setCameraTesting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 flex-1 max-w-5xl mx-auto w-full">
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ visible: false, message: '', type: 'info' })}
                />
            )}

            {/* Header Title */}
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">About &amp; Application Settings</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    System diagnostics, local data storage controls, research framework, and developer credentials.
                </p>
            </div>

            {/* Section 1: Device & Storage Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                    <HardDrive size={16} />
                    Device Diagnostics &amp; Local Storage
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Clear Local Cache */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Trash2 size={16} className="text-slate-600" />
                                <h4 className="text-sm font-bold text-slate-800">Clear Local App Cache</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Purges cached packaging images, offline service-worker assets, and temporary form drafts while preserving your login session.
                            </p>
                        </div>
                        <div className="pt-3">
                            <button
                                type="button"
                                disabled={clearing}
                                onClick={handleClearCache}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold text-xs shadow-2xs hover:bg-slate-50 transition cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={clearing ? 'animate-spin' : ''} />
                                <span>{clearing ? 'Clearing...' : 'Purge Cached Data'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Camera Diagnostics */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Camera size={16} className="text-slate-600" />
                                <h4 className="text-sm font-bold text-slate-800">Camera Hardware Diagnostic</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Tests whether your browser and operating system permit optical label and certificate scanning.
                            </p>
                            {cameraStatus && (
                                <div className={`mt-2 p-2 rounded-lg text-xs flex items-start gap-1.5 ${
                                    cameraStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}>
                                    {cameraStatus.success ? <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />}
                                    <span>{cameraStatus.message}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-3">
                            <button
                                type="button"
                                disabled={cameraTesting}
                                onClick={handleTestCamera}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold text-xs shadow-2xs hover:bg-slate-50 transition cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                <Camera size={13} />
                                <span>{cameraTesting ? 'Testing Sensor...' : 'Test Camera Access'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Architecture Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">Cloud Database &amp; Model Architecture</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Product and establishment searches connect to the Supabase PostgreSQL cloud database holding 13,000+ verified records.
                        Optical barcode reading, ingredient parsing, and Halal logo localization run through the high-performance YOLOv8-Nano and RapidOCR (ONNX Runtime) microservice.
                    </p>
                </div>
            </div>

            {/* Section 3: About / Capstone Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 mb-3 sm:mb-4 border-b border-slate-100 pb-2.5 sm:pb-3 flex items-center gap-2">
                        <Users size={16} />
                        About The Developers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {PROPONENTS.map((name, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 sm:p-5">
                                <p className="text-sm sm:text-base font-extrabold text-slate-800">{name}</p>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Computer Science Research Scholar</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-2">
                        <Award size={16} />
                        Academic &amp; Judicial Framework
                    </h3>
                    <div className="text-xs sm:text-sm text-slate-600 space-y-2 sm:space-y-3 leading-relaxed">
                        <p>
                            <strong>Sector Priority Focus:</strong> Smart Food Safety, Applied Computer Vision Systems, Regulatory Inspection Automation.
                        </p>
                        <p>
                            <strong>Jurisdictional Directive:</strong> Tailored targeting frameworks aligned specifically with <strong>{JURISDICTION}</strong> (Zamboanga City Halal Ordinance No. 489).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
