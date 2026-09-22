import { useState, useRef, useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    RefreshCw,
    ScanSearch,
    FileText,
    Image as ImageIcon,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
    FlipHorizontal,
    SwitchCamera,
    Flag,
    Camera,
    Crosshair,
    ChevronDown
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Toast from '../components/ui/Toast';
import { analyzeImage, simulateFallback } from '../utils/api';

export const Scanner = ({ isOnline, onViewChange }) => {
    // Mode state: 'label' (Logo & Ingredients) vs 'cert' (Certificate Analyzer)
    const [scannerMode, setScannerMode] = useState('label');
    const [isCapturing, setIsCapturing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Inspection Output
    const [scanResult, setScanResult] = useState(null);
    const [certResult, setCertResult] = useState(null);
    const [showResultsSheet, setShowResultsSheet] = useState(false);

    // Hardware Camera References & State
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const nativeCameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Persistent ref to manage stream without triggering effect restarts
    const cameraStreamRef = useRef(null);
    const isStartingRef = useRef(false);
    const targetFacingRef = useRef('environment');

    const [actualFacing, setActualFacing] = useState('environment'); // Detected from hardware
    const [videoDevices, setVideoDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [isMirrored, setIsMirrored] = useState(false);

    // Optical Controls
    const [zoom, setZoom] = useState(1);
    const [zoomCapabilities, setZoomCapabilities] = useState(null);
    const [focusRing, setFocusRing] = useState(null); // { x, y, active }

    // Touch Swipe Gesture State
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

    /**
     * Enumerate available video inputs to support deterministic camera switching
     */
    const updateDeviceList = useCallback(async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            setVideoDevices(videoInputs);
        } catch (err) {
            console.warn('Could not enumerate video devices:', err);
        }
    }, []);

    /**
     * Start the camera stream with hardware sensor interrogation
     */
    const startCamera = useCallback(async (desiredFacing, specificDeviceId) => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        setErrorMsg(null);
        setIsCapturing(true);
        const facingToUse = desiredFacing || targetFacingRef.current;

        // Stop existing stream if any
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }

        try {
            let stream = null;
            if (specificDeviceId) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: specificDeviceId },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        },
                        audio: false
                    });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: specificDeviceId },
                        audio: false
                    });
                }
            } else {
                try {
                    // 1. Try exact facingMode constraint (forces iOS/Android to switch physical camera sensor)
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: { exact: facingToUse },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        },
                        audio: false
                    });
                } catch {
                    try {
                        // 2. Fall back to ideal facingMode
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode: { ideal: facingToUse },
                                width: { ideal: 1920 },
                                height: { ideal: 1080 }
                            },
                            audio: false
                        });
                    } catch {
                        // 3. Fall back to basic video device
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    }
                }
            }

            cameraStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((playErr) => {
                        console.warn('Auto-play blocked or delayed:', playErr);
                    });
                };
            }

            // Interrogate hardware track to fix the sensor desync indicator bug
            const track = stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings ? track.getSettings() : {};
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                const trackLabel = (track.label || '').toLowerCase();

                // Determine TRUE facing mode from hardware settings or device label
                let detectedFacing = settings.facingMode;
                if (!detectedFacing) {
                    if (trackLabel.includes('back') || trackLabel.includes('rear') || trackLabel.includes('environment')) {
                        detectedFacing = 'environment';
                    } else if (trackLabel.includes('front') || trackLabel.includes('user') || trackLabel.includes('selfie')) {
                        detectedFacing = 'user';
                    } else {
                        detectedFacing = facingToUse;
                    }
                }

                setActualFacing(detectedFacing);
                targetFacingRef.current = detectedFacing;
                setActiveDeviceId(settings.deviceId || null);

                // Default mirror mode: front camera is mirrored for natural selfie feel, rear is unmirrored
                setIsMirrored(detectedFacing === 'user');

                // Inspect optical zoom capabilities
                if (capabilities.zoom) {
                    setZoomCapabilities({
                        min: capabilities.zoom.min || 1,
                        max: capabilities.zoom.max || 5,
                        step: capabilities.zoom.step || 0.1
                    });
                    setZoom(settings.zoom || 1);
                } else {
                    setZoomCapabilities(null);
                    setZoom(1);
                }
            }

            updateDeviceList();
        } catch (err) {
            console.error('Camera initialization failed:', err);
            setErrorMsg('Unable to access camera sensor. Please grant camera permissions or use upload mode.');
            setIsCapturing(false);
            setToast({
                visible: true,
                message: 'Camera unavailable. You can use the Native Camera or Gallery upload.',
                type: 'info'
            });
        } finally {
            isStartingRef.current = false;
        }
    }, [updateDeviceList]);

    /**
     * Stop the live camera stream cleanly
     */
    const stopCamera = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCapturing(false);
    }, []);

    /**
     * Toggle between front and rear cameras using hardware device switching
     */
    const toggleCamera = async () => {
        const nextFacing = actualFacing === 'environment' ? 'user' : 'environment';
        targetFacingRef.current = nextFacing;

        // If multiple video devices are enumerated, find an alternate device
        if (videoDevices.length > 1) {
            const otherDevices = videoDevices.filter((d) => d.deviceId !== activeDeviceId);
            const candidate = otherDevices.find((d) => {
                const lbl = (d.label || '').toLowerCase();
                if (nextFacing === 'environment') {
                    return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment') || lbl.includes('0');
                } else {
                    return lbl.includes('front') || lbl.includes('user') || lbl.includes('selfie') || lbl.includes('1');
                }
            }) || otherDevices[0];

            if (candidate && candidate.deviceId) {
                await startCamera(nextFacing, candidate.deviceId);
                return;
            }
        }

        await startCamera(nextFacing);
    };

    /**
     * Apply hardware or software zoom
     */
    const applyZoom = async (newZoom) => {
        setZoom(newZoom);
        const stream = cameraStreamRef.current;
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track && track.applyConstraints && zoomCapabilities) {
                try {
                    await track.applyConstraints({
                        advanced: [{ zoom: newZoom }]
                    });
                } catch (err) {
                    console.warn('Hardware zoom application failed:', err);
                }
            }
        }
    };

    /**
     * Tap to focus with visual HUD reticle animation & points-of-interest focus
     */
    const handleTapToFocus = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Visual reticle display
        setFocusRing({ x, y, active: true });
        if (window.navigator?.vibrate) {
            window.navigator.vibrate(15);
        }

        setTimeout(() => {
            setFocusRing((prev) => (prev ? { ...prev, active: false } : null));
        }, 1200);

        // Attempt hardware focus constraint if supported
        const stream = cameraStreamRef.current;
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track && track.applyConstraints) {
                const normX = Math.max(0, Math.min(1, x / rect.width));
                const normY = Math.max(0, Math.min(1, y / rect.height));
                track.applyConstraints({
                    advanced: [{
                        focusMode: 'continuous',
                        pointsOfInterest: [{ x: normX, y: normY }]
                    }]
                }).catch(() => {});
            }
        }
    };

    /**
     * Frame capture from WebRTC stream into Canvas
     */
    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');

            ctx.save();
            if (isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            // If using software zoom on unsupported hardware, crop center
            if (!zoomCapabilities && zoom > 1) {
                const cropWidth = canvas.width / zoom;
                const cropHeight = canvas.height / zoom;
                const cropX = (canvas.width - cropWidth) / 2;
                const cropY = (canvas.height - cropHeight) / 2;
                ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            ctx.restore();

            const dataUrl = canvas.toDataURL('image/png', 0.95);
            setSelectedImage(dataUrl);
            setShowResultsSheet(true);
            stopCamera();

            if (window.navigator?.vibrate) {
                window.navigator.vibrate([20, 50, 20]);
            }

            triggerAIScan(dataUrl);
        }
    };

    /**
     * File upload handler for gallery and native phone camera
     */
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                setSelectedImage(dataUrl);
                setShowResultsSheet(true);
                stopCamera();
                triggerAIScan(dataUrl);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input value to allow re-uploading same file if desired
        e.target.value = '';
    };

    /**
     * Send captured payload to FastAPI AI backend
     */
    const triggerAIScan = async (base64Img) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const result = await analyzeImage(base64Img, scannerMode);
            if (scannerMode === 'label') {
                setScanResult(result);
            } else {
                setCertResult(result);
            }
            setToast({ visible: true, message: 'Analysis complete. Verification results ready.', type: 'success' });
        } catch {
            setErrorMsg('Backend server unreachable. Displaying fallback inspection details.');
            setTimeout(() => {
                const result = simulateFallback(scannerMode);
                if (scannerMode === 'label') setScanResult(result);
                else setCertResult(result);
                setIsLoading(false);
            }, 800);
        } finally {
            if (!errorMsg) setIsLoading(false);
        }
    };

    /**
     * Reset state and resume camera
     */
    const resetState = () => {
        setSelectedImage(null);
        setScanResult(null);
        setCertResult(null);
        setErrorMsg(null);
        setShowResultsSheet(false);
        startCamera(actualFacing);
    };

    /**
     * Touch swipe gesture listeners for mode switching
     */
    const handleTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
    };

    const handleTouchEnd = (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        const elapsed = Date.now() - touchStartRef.current.time;

        // Must be a rapid swipe with horizontal dominance
        if (elapsed < 400 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
            if (deltaX < 0 && scannerMode === 'label') {
                // Swipe Left -> Switch to Certificate Analyzer
                setScannerMode('cert');
                if (window.navigator?.vibrate) window.navigator.vibrate(25);
                setToast({ visible: true, message: 'Switched to Halal Certificate Analyzer', type: 'info' });
            } else if (deltaX > 0 && scannerMode === 'cert') {
                // Swipe Right -> Switch to Logo & Label Scanner
                setScannerMode('label');
                if (window.navigator?.vibrate) window.navigator.vibrate(25);
                setToast({ visible: true, message: 'Switched to Halal Logo & Label Scanner', type: 'info' });
            }
        }
    };

    // Auto-start camera with rear camera on mount (strictly runs once)
    useEffect(() => {
        startCamera('environment');
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 p-2 sm:p-4 md:p-6 overflow-hidden relative">
            {/* Dark Themed Page Header */}
            <div className="mb-2 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:px-4 sm:py-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Camera size={18} className="text-emerald-400 shrink-0" />
                                <span>Optical AI Scanner</span>
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                Dual-engine halal logo detection and chemical additive verification
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {!isOnline && (
                <div className="mb-2 shrink-0 p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2">
                    <AlertTriangle size={14} /> Offline Mode: Live OCR and database lookups will use offline fallback mode.
                </div>
            )}

            {/* Mode Switcher Tabs with Swipe Hint */}
            <div className="flex items-center justify-between gap-2 mb-2.5 px-1 shrink-0">
                <div className="flex-1 max-w-md mx-auto grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-inner">
                    <button
                        type="button"
                        onClick={() => {
                            setScannerMode('label');
                            if (selectedImage) resetState();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            scannerMode === 'label'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <ScanSearch size={15} />
                        <span>Logo & Label</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setScannerMode('cert');
                            if (selectedImage) resetState();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            scannerMode === 'cert'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FileText size={15} />
                        <span>Certificate</span>
                    </button>
                </div>
            </div>

            {/* Immersive Viewfinder Container */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={handleTapToFocus}
                className="relative flex-1 w-full rounded-2xl sm:rounded-3xl bg-black border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
                style={{ touchAction: 'pan-y' }}
            >
                {/* 1. Live Camera Stream */}
                {isCapturing && (
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
                        style={{
                            transform: `${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'} ${
                                !zoomCapabilities && zoom > 1 ? `scale(${zoom})` : ''
                            }`.trim()
                        }}
                    />
                )}

                {/* 2. Captured Photo Preview */}
                {selectedImage && !isCapturing && (
                    <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img
                            src={selectedImage}
                            alt="Captured Frame"
                            className="w-full h-full object-contain"
                        />

                        {/* YOLOv8 Visual Bounding Box Overlay for Detected Logos */}
                        {scanResult?.detectedLogos && scanResult.detectedLogos.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="relative w-full h-full">
                                    {scanResult.detectedLogos.map((logo, idx) => {
                                        if (!logo.norm_box || logo.norm_box.length < 4) return null;
                                        const [x1, y1, x2, y2] = logo.norm_box;
                                        const isInvalid = logo.label === 'Invalid_logo' || scanResult.isInvalidLogo;
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    left: `${x1 * 100}%`,
                                                    top: `${y1 * 100}%`,
                                                    width: `${(x2 - x1) * 100}%`,
                                                    height: `${(y2 - y1) * 100}%`
                                                }}
                                                className={`absolute border-2 rounded transition-all ${
                                                    isInvalid
                                                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
                                                        : 'border-emerald-400 bg-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1 ${
                                                        isInvalid ? 'bg-red-600' : 'bg-emerald-600'
                                                    }`}
                                                >
                                                    {isInvalid ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                                    {logo.label} • {logo.confidence}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Fallback View when Camera is Closed & No Image */}
                {!isCapturing && !selectedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
                            <Camera size={32} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">Scanner Idle</h3>
                        <p className="text-xs text-slate-400 max-w-xs mb-6">
                            Tap below to re-activate the camera viewfinder or select an image from your device.
                        </p>
                        <button
                            type="button"
                            onClick={() => startCamera(actualFacing)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 active:scale-95 transition"
                        >
                            <Camera size={16} /> Re-open Camera
                        </button>
                    </div>
                )}

                {/* 4. Tap-To-Focus Animated Reticle Ring */}
                {focusRing && (
                    <div
                        style={{
                            left: focusRing.x,
                            top: focusRing.y,
                            transform: 'translate(-50%, -50%)'
                        }}
                        className={`pointer-events-none absolute z-30 transition-all duration-300 ${
                            focusRing.active ? 'scale-100 opacity-100' : 'scale-125 opacity-0'
                        }`}
                    >
                        <div className="relative w-14 h-14 border-2 border-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                            <Crosshair size={18} className="text-emerald-300" />
                            <span className="absolute -top-1 w-2 h-0.5 bg-emerald-400"></span>
                            <span className="absolute -bottom-1 w-2 h-0.5 bg-emerald-400"></span>
                            <span className="absolute -left-1 h-2 w-0.5 bg-emerald-400"></span>
                            <span className="absolute -right-1 h-2 w-0.5 bg-emerald-400"></span>
                        </div>
                    </div>
                )}

                {/* 5. Top Viewfinder HUD Toolbar & Guidance */}
                <div className="relative z-20 flex flex-col gap-2 p-3 sm:p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
                    <div className="flex items-center justify-between">
                        {/* Hardware Camera Sensor Indicator Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/70 backdrop-blur-md text-[11px] font-semibold text-slate-200 shadow-md">
                            <span className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                            <span>{actualFacing === 'user' ? 'Front Camera' : 'Rear Camera'}</span>
                            {isMirrored && <span className="text-[9px] text-slate-400 font-normal">| Mirrored</span>}
                        </div>

                        {/* Camera Control Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Mirror Flip Toggle */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMirrored((prev) => {
                                        const next = !prev;
                                        setToast({
                                            visible: true,
                                            message: next ? 'Camera preview mirrored' : 'Camera preview unmirrored',
                                            type: 'info'
                                        });
                                        return next;
                                    });
                                }}
                                className={`p-2 rounded-full border backdrop-blur-md transition shadow-md ${
                                    isMirrored
                                        ? 'bg-emerald-600 border-emerald-400 text-white'
                                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                                }`}
                                title={isMirrored ? 'Disable Mirror' : 'Enable Mirror Preview'}
                            >
                                <FlipHorizontal size={16} />
                            </button>

                            {/* Physical Camera Flip Switch */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextTarget = actualFacing === 'environment' ? 'Front' : 'Rear';
                                    setToast({
                                        visible: true,
                                        message: `Switching to ${nextTarget} Camera...`,
                                        type: 'info'
                                    });
                                    toggleCamera();
                                }}
                                className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-md transition shadow-md active:rotate-180 duration-300"
                                title={`Switch to ${actualFacing === 'environment' ? 'Front' : 'Rear'} Camera`}
                            >
                                <SwitchCamera size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Guidance Hint - Floating cleanly beneath top toolbar without colliding with shutter */}
                    {isCapturing && (
                        <div className="flex justify-center pointer-events-none">
                            <div className="px-3.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 shadow-md font-medium text-center">
                                {scannerMode === 'label'
                                    ? 'Align Halal Logo & Ingredient List inside reticle'
                                    : 'Center Halal Certificate document within frame'}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Center Viewfinder Scan Guide Reticle */}
                {isCapturing && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 z-10">
                        {/* HUD Framing Box */}
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 max-w-[70vw] max-h-[42vh] aspect-square border border-emerald-500/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                            {/* Reticle Corner Accents */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>

                            {/* Animated Laser Scanning Line */}
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2.5s_infinite]"></div>
                        </div>
                    </div>
                )}

                {/* 7. Bottom Controls (Zoom & Shutter) */}
                <div className="relative z-20 flex flex-col items-center gap-2 p-4 pt-1 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
                    {/* Zoom Controls */}
                    {isCapturing && (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-700/80 backdrop-blur-md rounded-full shadow-lg">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    applyZoom(1);
                                }}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                                    zoom === 1
                                        ? 'bg-emerald-600 text-white shadow'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                1x
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    applyZoom(2);
                                }}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                                    zoom === 2
                                        ? 'bg-emerald-600 text-white shadow'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                2x
                            </button>
                        </div>
                    )}

                    {/* Shutter & Alternate Input Row */}
                    <div className="w-full flex items-center justify-around sm:justify-center sm:gap-12">
                        {/* Gallery Upload Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                galleryInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white active:scale-90 transition group"
                            title="Upload photo from device gallery"
                        >
                            <div className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-800">
                                <ImageIcon size={20} className="text-slate-200 group-hover:text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">Gallery</span>
                        </button>

                        {/* Main Shutter Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isCapturing) {
                                    captureFrame();
                                } else {
                                    resetState();
                                }
                            }}
                            className="relative p-1 rounded-full active:scale-95 transition focus:outline-none"
                            title={isCapturing ? 'Capture Photo' : 'Start Camera'}
                        >
                            {/* Outer Ring */}
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/60 flex items-center justify-center p-1 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                                {/* Inner Shutter Core */}
                                <div className="w-13 h-13 rounded-full bg-white hover:bg-emerald-50 active:bg-emerald-200 shadow-inner flex items-center justify-center transition">
                                    <div className="w-11 h-11 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                        <Camera size={20} className="text-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Native Phone Camera Alternative Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                nativeCameraInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white active:scale-90 transition group"
                            title="Open phone's native camera application"
                        >
                            <div className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-800">
                                <Camera size={20} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">Native Cam</span>
                        </button>
                    </div>
                </div>

                {/* Hidden File Inputs for Native Camera & Gallery */}
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={nativeCameraInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <input
                    type="file"
                    accept="image/*"
                    ref={galleryInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Floating Action Button to Re-Open Results Sheet when Collapsed */}
            {!showResultsSheet && (scanResult || certResult) && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
                    <button
                        type="button"
                        onClick={() => setShowResultsSheet(true)}
                        className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 active:scale-95 transition border border-emerald-400/40 backdrop-blur-sm"
                    >
                        <Sparkles size={14} className="text-emerald-200" />
                        <span>View Inspection Results ({scanResult?.verdict || certResult?.status || 'Ready'})</span>
                    </button>
                </div>
            )}

            {/* Slide-Up Results Bottom Sheet (Scoped strictly to Scanner viewport) */}
            {showResultsSheet && (
                <div className="absolute inset-0 z-40 flex flex-col justify-end">
                    {/* Clickable Backdrop to easily click outside and collapse */}
                    <div 
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                        onClick={() => setShowResultsSheet(false)}
                        aria-label="Collapse inspection sheet"
                    />
                    <div className="relative w-full max-h-[88%] bg-slate-900 border-t border-slate-700 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 text-slate-100 z-10">
                        {/* Grab Handle & Sheet Header */}
                        <div className="p-3 pb-2 flex flex-col items-center border-b border-slate-800 cursor-pointer" onClick={() => setShowResultsSheet(false)}>
                            <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-2"></div>
                            <div className="w-full flex items-center justify-between px-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-emerald-400" />
                                    <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-200">
                                        Inspection & Pipeline Evaluation
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetState();
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition"
                                    >
                                        <RefreshCw size={12} /> Retake / Scan Next
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowResultsSheet(false);
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                                        title="Collapse sheet"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    {/* Scrollable Results Content */}
                    <div className="overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[75vh]">
                        {/* Loading Spinner during OCR / YOLO analysis */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <RefreshCw className="h-9 w-9 text-emerald-400 animate-spin" />
                                <p className="text-sm text-slate-300 font-semibold">Running Optical AI Analysis...</p>
                                <span className="text-xs text-slate-500">Executing YOLOv8-Nano and EasyOCR pipeline</span>
                            </div>
                        )}

                        {/* Label Scanner Result Body */}
                        {!isLoading && scanResult && scannerMode === 'label' && (
                            <div className="space-y-4">
                                {/* Verdict Banner */}
                                <div
                                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                                        scanResult.verdict === 'Green'
                                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                            : scanResult.verdict === 'Yellow'
                                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                                            : 'bg-red-950/60 border-red-500/50 text-red-200'
                                    }`}
                                >
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Classification Verdict
                                        </span>
                                        <p className="text-xl font-black tracking-wide">
                                            {scanResult.verdict} State
                                        </p>
                                        <p className="text-xs font-semibold mt-0.5 opacity-90">
                                            {scanResult.riskLevel}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/30 border border-white/10">
                                        {scanResult.verdict === 'Green' ? (
                                            <ShieldCheck size={28} className="text-emerald-400" />
                                        ) : scanResult.verdict === 'Yellow' ? (
                                            <AlertTriangle size={28} className="text-amber-400" />
                                        ) : (
                                            <ShieldAlert size={28} className="text-red-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Halal Logo Authentication (YOLOv8-Nano) */}
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                                            <ShieldCheck size={14} /> Halal Logo Localization
                                        </span>
                                        <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                            YOLOv8-Nano
                                        </span>
                                    </div>

                                    {scanResult.isInvalidLogo ? (
                                        <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                                                <ShieldAlert size={14} className="text-red-400 animate-pulse" />
                                                <span>Suspected Counterfeit / Invalid Mark</span>
                                            </div>
                                            <p className="text-xs text-red-300/90 leading-relaxed">
                                                An unauthorized, altered, or unverified halal certification logo was localized. Do not rely on this mark.
                                            </p>
                                        </div>
                                    ) : scanResult.logoDetected ? (
                                        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-300">
                                                    {scanResult.logoBody}
                                                </span>
                                                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-800/60 text-emerald-200 rounded">
                                                    {scanResult.logoConfidence}% Match
                                                </span>
                                            </div>
                                            <p className="text-xs text-emerald-300/80 leading-relaxed">
                                                Official certification mark recognized and cross-referenced with authorized Islamic bodies.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                                            No accredited halal certification seal localized in this photo frame.
                                        </p>
                                    )}
                                </div>

                                {/* Summary & Flagged Additives */}
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                                    <span className="text-xs uppercase font-bold text-slate-300">Analysis Summary</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {scanResult.analysisSummary}
                                    </p>

                                    <div className="pt-2 border-t border-slate-700/60 space-y-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Screened Additive Compounds
                                        </span>
                                        {scanResult.flaggedIngredients?.length > 0 ? (
                                            scanResult.flaggedIngredients.map((flag, idx) => (
                                                <div key={idx} className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-bold text-red-300">
                                                        <span>{flag.ingredient}</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-red-900/80 text-red-200 text-[10px]">
                                                            {flag.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-red-300/80 leading-relaxed">
                                                        {flag.reason}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                                                <CheckCircle2 size={15} className="text-emerald-400" />
                                                <span>Zero prohibited additives identified against local database.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Extracted Ingredients Text (EasyOCR) */}
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
                                            <FileText size={14} className="text-emerald-400" /> Extracted Ingredients Text
                                        </span>
                                        <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                            EasyOCR Engine
                                        </span>
                                    </div>
                                    {scanResult.ocrText ? (
                                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-44 overflow-y-auto select-text">
                                            {scanResult.ocrText}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                                            No readable ingredient text extracted from this photo frame.
                                        </p>
                                    )}
                                </div>

                                {/* 5-Stage IPO Process Inspector */}
                                {scanResult.pipelineStages?.length > 0 && (
                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                                                <Sparkles size={14} /> IPO Process Inspector (5 Stages)
                                            </span>
                                            {scanResult.totalLatencyMs && (
                                                <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                                    {scanResult.totalLatencyMs} ms total
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {scanResult.pipelineStages.map((st) => (
                                                <div key={st.step} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                                                                {st.step}
                                                            </span>
                                                            {st.name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            {st.latencyMs !== undefined && (
                                                                <span className="text-[10px] font-mono text-slate-400">{st.latencyMs}ms</span>
                                                            )}
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                                                                {st.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                                                        <span className="text-emerald-400 font-mono mr-1">[{st.module}]</span>
                                                        {st.details}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {scanResult.recommendations?.length > 0 && (
                                    <div className="bg-blue-950/60 border border-blue-500/40 rounded-2xl p-4 space-y-2">
                                        <span className="text-xs uppercase font-bold text-blue-300">Recommendations</span>
                                        <ul className="list-disc pl-4 text-xs text-blue-200/90 space-y-1">
                                            {scanResult.recommendations.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Bottom Action Buttons */}
                                <div className="pt-2 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={resetState}
                                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                                    >
                                        <RefreshCw size={15} /> Scan Another Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onViewChange?.('report-issue')}
                                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition"
                                    >
                                        <Flag size={15} /> Report Issue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Certificate Scanner Result Body */}
                        {!isLoading && certResult && scannerMode === 'cert' && (
                            <div className="space-y-4">
                                <div
                                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                                        certResult.status === 'Valid'
                                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                            : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                                    }`}
                                >
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Document Status
                                        </span>
                                        <p className="text-xl font-black">{certResult.status}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                                    <p className="text-slate-300">Certifying Body: <span className="font-bold text-white">{certResult.certifyingBody}</span></p>
                                    <p className="text-slate-300">Establishment: <span className="font-bold text-white">{certResult.establishmentName}</span></p>
                                    <p className="text-slate-300">Serial Key: <span className="font-bold font-mono text-emerald-400">{certResult.certificateNumber}</span></p>
                                    <p className="text-slate-300">Expiry Date: <span className="font-bold text-white">{certResult.expirationDate || 'Not detected'}</span></p>
                                </div>

                                <div className="pt-2 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={resetState}
                                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                                    >
                                        <RefreshCw size={15} /> Scan Another Certificate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onViewChange?.('report-issue')}
                                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition"
                                    >
                                        <Flag size={15} /> Report Discrepancy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Notification Toast */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ visible: false, message: '', type: 'info' })}
            />
        </div>
    );
};

export default Scanner;
