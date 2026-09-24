import { useState, useRef } from 'react';
import { Camera, AlertTriangle, Sparkles } from 'lucide-react';
import Toast from '../components/ui/Toast';
import { analyzeImage, simulateFallback } from '../utils/api';
import { mergeLabelScans } from '../utils/scanFusion';
import { useCameraStream } from '../hooks/useCameraStream';
import CameraViewfinder from '../components/scanner/CameraViewfinder';
import LabelResultsSheet from '../components/scanner/LabelResultsSheet';
import CertResultsSheet from '../components/scanner/CertResultsSheet';

export const Scanner = ({ isOnline, onViewChange }) => {
    // Mode state: 'label' (Logo & Ingredients) vs 'cert' (Certificate Analyzer)
    const [scannerMode, setScannerMode] = useState('label');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [, setErrorMsg] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Multi-Capture Packaging Fusion State
    const [fusionState, setFusionState] = useState(null);

    // Inspection Output
    const [scanResult, setScanResult] = useState(null);
    const [certResult, setCertResult] = useState(null);
    const [showResultsSheet, setShowResultsSheet] = useState(false);

    // Touch Swipe Gesture State
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

    // Custom Camera Stream Hook
    const {
        videoRef,
        canvasRef,
        isCapturing,
        actualFacing,
        isMirrored,
        setIsMirrored,
        zoom,
        zoomCapabilities,
        focusRing,
        startCamera,
        stopCamera,
        toggleCamera,
        applyZoom,
        handleTapToFocus,
        captureFrame,
    } = useCameraStream(setToast);

    /**
     * Send captured payload to FastAPI AI backend
     */
    const triggerAIScan = async (base64Img) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const result = await analyzeImage(base64Img, scannerMode);
            if (scannerMode === 'label') {
                if (fusionState?.active && fusionState.firstScan) {
                    const merged = mergeLabelScans(
                        fusionState.firstScan,
                        result,
                        fusionState.firstImage,
                        base64Img
                    );
                    setScanResult(merged);
                    setFusionState(null);
                    setToast({
                        visible: true,
                        message: 'Multi-angle packaging fusion complete!',
                        type: 'success'
                    });
                } else {
                    setScanResult(result);
                }
            } else {
                setCertResult(result);
            }
        } catch (err) {
            console.error('Backend scan failed:', err);
            setErrorMsg('Backend server unreachable. Displaying fallback inspection details.');
            setTimeout(() => {
                const result = simulateFallback(scannerMode);
                if (scannerMode === 'label') {
                    if (fusionState?.active && fusionState.firstScan) {
                        const merged = mergeLabelScans(
                            fusionState.firstScan,
                            result,
                            fusionState.firstImage,
                            base64Img
                        );
                        setScanResult(merged);
                        setFusionState(null);
                    } else {
                        setScanResult(result);
                    }
                } else {
                    setCertResult(result);
                }
                setIsLoading(false);
            }, 800);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Trigger secondary scan for multi-angle packaging fusion
     */
    const handleScanSecondary = (target) => {
        setFusionState({
            active: true,
            target,
            firstScan: scanResult,
            firstImage: selectedImage
        });
        setShowResultsSheet(false);
        startCamera(actualFacing);
        setToast({
            visible: true,
            message: target === 'ingredients'
                ? 'Point camera at the ingredients panel (back or side)'
                : 'Point camera at the Halal logo seal',
            type: 'info'
        });
    };

    /**
     * Cancel secondary scan and restore first result
     */
    const handleCancelFusion = () => {
        if (fusionState?.firstScan) {
            setScanResult(fusionState.firstScan);
            setSelectedImage(fusionState.firstImage);
            setShowResultsSheet(true);
        }
        setFusionState(null);
    };

    /**
     * Frame capture handler
     */
    const handleCapture = () => {
        captureFrame((dataUrl) => {
            setSelectedImage(dataUrl);
            setShowResultsSheet(true);
            triggerAIScan(dataUrl);
        });
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
        e.target.value = '';
    };

    /**
     * Reset state and resume camera
     */
    const resetState = () => {
        setSelectedImage(null);
        setScanResult(null);
        setCertResult(null);
        setErrorMsg(null);
        setFusionState(null);
        setShowResultsSheet(false);
        startCamera(actualFacing);
    };

    /**
     * Touch swipe gesture listeners for horizontal mode switching
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

        if (elapsed < 400 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
            if (deltaX < 0 && scannerMode === 'label') {
                setScannerMode('cert');
                if (window.navigator?.vibrate) window.navigator.vibrate(25);
                setToast({ visible: true, message: 'Switched to Halal Certificate Analyzer', type: 'info' });
            } else if (deltaX > 0 && scannerMode === 'cert') {
                setScannerMode('label');
                if (window.navigator?.vibrate) window.navigator.vibrate(25);
                setToast({ visible: true, message: 'Switched to Halal Logo & Label Scanner', type: 'info' });
            }
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 p-2 sm:p-4 md:p-6 overflow-hidden relative"
        >
            {/* Dark Themed Page Header */}
            <div className="mb-2 shrink-0 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:px-4 sm:py-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Camera size={16} className="text-emerald-400 shrink-0 sm:h-[18px] sm:w-[18px]" />
                                <span>Optical AI Scanner</span>
                            </h2>
                            <p className="hidden sm:block text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
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

            {/* Camera Viewfinder Component */}
            <CameraViewfinder
                scannerMode={scannerMode}
                setScannerMode={setScannerMode}
                isCapturing={isCapturing}
                videoRef={videoRef}
                canvasRef={canvasRef}
                selectedImage={selectedImage}
                scanResult={scanResult}
                isMirrored={isMirrored}
                setIsMirrored={setIsMirrored}
                zoom={zoom}
                zoomCapabilities={zoomCapabilities}
                applyZoom={applyZoom}
                actualFacing={actualFacing}
                toggleCamera={toggleCamera}
                focusRing={focusRing}
                handleTapToFocus={handleTapToFocus}
                onCapture={handleCapture}
                onFileUpload={handleFileUpload}
                onReset={resetState}
                setToast={setToast}
                fusionState={fusionState}
                onCancelFusion={handleCancelFusion}
            />

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

            {/* Label Results Sheet */}
            {showResultsSheet && scannerMode === 'label' && (
                <LabelResultsSheet
                    scanResult={scanResult}
                    isLoading={isLoading}
                    onReset={resetState}
                    onClose={() => setShowResultsSheet(false)}
                    onViewChange={onViewChange}
                    onScanSecondary={handleScanSecondary}
                />
            )}

            {/* Certificate Results Sheet */}
            {showResultsSheet && scannerMode === 'cert' && (
                <CertResultsSheet
                    certResult={certResult}
                    isLoading={isLoading}
                    onReset={resetState}
                    onClose={() => setShowResultsSheet(false)}
                    onViewChange={onViewChange}
                />
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
