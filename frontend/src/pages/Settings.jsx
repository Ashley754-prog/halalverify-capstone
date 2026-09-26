import { useState, useEffect } from 'react';
import { BookOpen, Server, CheckCircle2, AlertCircle, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import { PROPONENTS, JURISDICTION } from '../data/constants';
import { API_BASE_URL, authFetch } from '../utils/api';

export const Settings = ({ onViewChange }) => {
    const [customApiUrl, setCustomApiUrl] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('halalverify_api_url') || '' : '';
    });
    const [activeUrl, setActiveUrl] = useState(API_BASE_URL);
    const [pingStatus, setPingStatus] = useState({ state: 'idle', latency: null, message: '' });
    const [savedMessage, setSavedMessage] = useState('');

    const testConnection = async (urlToTest) => {
        const target = (urlToTest || activeUrl).replace(/\/+$/, '');
        setPingStatus({ state: 'testing', latency: null, message: 'Testing connection...' });
        const start = Date.now();
        try {
            const res = await authFetch(`${target}/health`, { timeout: 10000 });
            const latency = Date.now() - start;
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                setPingStatus({
                    state: 'online',
                    latency,
                    message: `Connected successfully (${latency}ms) — ${data.service || 'HalalVerify API'}`,
                });
            } else {
                setPingStatus({
                    state: 'error',
                    latency,
                    message: `Server returned HTTP ${res.status}: ${res.statusText}`,
                });
            }
        } catch (err) {
            setPingStatus({
                state: 'error',
                latency: Date.now() - start,
                message: err.name === 'AbortError' ? 'Connection timed out (10s)' : (err.message || 'Cannot reach server'),
            });
        }
    };

    useEffect(() => {
        testConnection(activeUrl);
    }, []);

    const handleSaveCustomUrl = (e) => {
        e.preventDefault();
        const trimmed = customApiUrl.trim().replace(/\/+$/, '');
        if (trimmed) {
            localStorage.setItem('halalverify_api_url', trimmed);
            setActiveUrl(trimmed);
            setSavedMessage('Cloud API URL saved! Testing connection...');
            testConnection(trimmed);
        } else {
            handleResetDefault();
        }
        setTimeout(() => setSavedMessage(''), 4000);
    };

    const handleResetDefault = () => {
        localStorage.removeItem('halalverify_api_url');
        setCustomApiUrl('');
        setActiveUrl(API_BASE_URL);
        setSavedMessage('Reset to default backend endpoint.');
        testConnection(API_BASE_URL);
        setTimeout(() => setSavedMessage(''), 4000);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1">
            <Topbar
                title="System Settings"
                subtitle="Application configuration, cloud backend status, and capstone details."
                onBack={() => onViewChange?.('back')}
            />

            {/* Cloud Backend Server Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Server size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800">Backend API Connection</h3>
                            <p className="text-xs text-slate-500">Configure cloud host (Render, Hugging Face, or local tunnel)</p>
                        </div>
                    </div>
                    <div>
                        {pingStatus.state === 'online' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={13} className="text-emerald-500" />
                                Online ({pingStatus.latency}ms)
                            </span>
                        )}
                        {pingStatus.state === 'error' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle size={13} className="text-rose-500" />
                                Unreachable
                            </span>
                        )}
                        {pingStatus.state === 'testing' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <RefreshCw size={13} className="animate-spin text-amber-500" />
                                Testing...
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Active Backend Endpoint:
                        </label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-mono break-all">
                                {activeUrl}
                            </code>
                            <button
                                type="button"
                                onClick={() => testConnection(activeUrl)}
                                disabled={pingStatus.state === 'testing'}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition active:scale-95 disabled:opacity-50"
                                title="Re-test connection"
                            >
                                <RefreshCw size={14} className={pingStatus.state === 'testing' ? 'animate-spin' : ''} />
                                Ping
                            </button>
                        </div>
                        {pingStatus.message && (
                            <p className={`text-xs mt-1.5 ${pingStatus.state === 'online' ? 'text-emerald-600' : pingStatus.state === 'error' ? 'text-rose-600' : 'text-slate-500'}`}>
                                {pingStatus.message}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSaveCustomUrl} className="pt-2 border-t border-slate-100 space-y-2">
                        <label className="block text-xs font-semibold text-slate-600">
                            Custom Cloud Backend URL (e.g. Render Web Service):
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="url"
                                value={customApiUrl}
                                onChange={(e) => setCustomApiUrl(e.target.value)}
                                placeholder="https://your-service.onrender.com"
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                                >
                                    Save & Connect
                                </button>
                                {customApiUrl && (
                                    <button
                                        type="button"
                                        onClick={handleResetDefault}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                        {savedMessage && (
                            <p className="text-xs text-emerald-600 font-medium">{savedMessage}</p>
                        )}
                    </form>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Globe size={13} className="text-slate-500" />
                            How to host backend on Render for 24/7 cloud access:
                        </p>
                        <ol className="list-decimal list-inside space-y-0.5 text-slate-500 pl-1 text-[11px] sm:text-xs">
                            <li>Go to <strong>dashboard.render.com</strong> &rarr; <strong>New Web Service</strong></li>
                            <li>Connect your GitHub repository (<code>halalverify-capstone</code>)</li>
                            <li>Set <strong>Root Directory</strong> to <code>backend</code> and <strong>Runtime</strong> to <code>Python 3</code></li>
                            <li>Build Command: <code>pip install --upgrade pip && pip install -r requirements.txt</code></li>
                            <li>Start Command: <code>uvicorn app.main:app --host 0.0.0.0 --port $PORT</code></li>
                            <li>Add Environment Variables: <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>ALLOWED_ORIGINS=*</code></li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Offline dictionary status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex items-start gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                    <BookOpen size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">Database & Registry Architecture</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Product and establishment searches connect directly to the Supabase cloud database with 13,000+ verified records.
                        Image scanning and logo OCR utilize the cloud computer vision microservice above.
                    </p>
                </div>
            </div>

            {/* About / Capstone Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mt-6 sm:mt-8">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 sm:mb-4 border-b border-slate-100 pb-2.5 sm:pb-3">
                    About The Developers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6">
                    {PROPONENTS.map((name, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 sm:p-5">
                            <p className="text-sm sm:text-base font-extrabold text-slate-800">{name}</p>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Computer Science Research Scholar</p>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 mb-2">Academic & Judicial Framework</h3>
                <div className="text-xs sm:text-sm text-slate-600 space-y-2 sm:space-y-3 leading-relaxed">
                    <p>
                        <strong>Sector Priority Focus:</strong> Smart Food Safety, Applied Computer Vision Systems, Regulatory Inspection Automation.
                    </p>
                    <p>
                        <strong>Jurisdictional Directive:</strong> Tailored targeting frameworks aligned specifically with <strong>{JURISDICTION}</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
