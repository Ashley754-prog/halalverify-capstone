import { useRef } from 'react';
import {
    Camera,
    Image as ImageIcon,
    SwitchCamera,
    Crosshair,
    ShieldCheck,
    ShieldAlert,
    ScanSearch,
    FileText,
    Layers
} from 'lucide-react';

export const CameraViewfinder = ({
    scannerMode,
    setScannerMode,
    isCapturing,
    videoRef,
    canvasRef,
    selectedImage,
    scanResult,
    isMirrored,
    setIsMirrored,
    zoom,
    zoomCapabilities,
    applyZoom,
    actualFacing,
    toggleCamera,
    focusRing,
    handleTapToFocus,
    onCapture,
    onFileUpload,
    onReset,
    setToast,
    fusionState = null,
    onCancelFusion = null,
}) => {
    const containerRef = useRef(null);
    const galleryInputRef = useRef(null);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Simple & Clean Mode Switcher */}
            <div className="flex items-center justify-center mb-2 px-1 shrink-0">
                <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-inner">
                    <button
                        type="button"
                        onClick={() => {
                            setScannerMode('label');
                            if (selectedImage) onReset();
                        }}
                        className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                            scannerMode === 'label'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ScanSearch size={14} />
                        <span>Product Label</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setScannerMode('cert');
                            if (selectedImage) onReset();
                        }}
                        className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                            scannerMode === 'cert'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <FileText size={14} />
                        <span>Certificate</span>
                    </button>
                </div>
            </div>

            {/* Immersive Viewfinder Container */}
            <div
                ref={containerRef}
                onClick={(e) => handleTapToFocus(e, containerRef)}
                className="relative flex-1 w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
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

                        {/* Visual Bounding Box Overlay */}
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
                                                    className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap shadow-md flex items-center gap-1 ${
                                                        isInvalid ? 'bg-red-600' : 'bg-emerald-600'
                                                    }`}
                                                >
                                                    {isInvalid ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                                    {logo.label}
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
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
                            <Camera size={30} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">Camera Paused</h3>
                        <p className="text-xs text-slate-400 max-w-xs mb-5">
                            Tap below to reactivate camera or select an image from your gallery.
                        </p>
                        <button
                            type="button"
                            onClick={() => onReset()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition"
                        >
                            <Camera size={15} /> Resume Camera
                        </button>
                    </div>
                )}

                {/* 4. Tap-To-Focus Reticle */}
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
                        <div className="relative w-12 h-12 border-2 border-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                            <Crosshair size={16} className="text-emerald-300" />
                        </div>
                    </div>
                )}

                {/* 5. Minimal Top HUD (Instruction & Camera Flip) */}
                <div className="relative z-20 p-3 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-transparent">
                    {fusionState?.active ? (
                        /* Multi-Part / Continuing Capture Banner */
                        <div className="w-full p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/50 backdrop-blur-md shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Layers size={15} className="animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-emerald-300 leading-tight">
                                        {fusionState.target === 'continue-ingredients'
                                            ? `Part ${fusionState.step || 2}: Continuing Ingredients`
                                            : fusionState.target === 'ingredients'
                                            ? 'Part 2: Scan Ingredients List'
                                            : 'Part 2: Scan Halal Logo Seal'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                        Point camera at the remaining text or logo
                                    </p>
                                </div>
                            </div>
                            {onCancelFusion && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancelFusion();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold shrink-0 border border-slate-700 active:scale-95 transition"
                                    title="Return to verification results"
                                >
                                    Back to Results
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Standard Guidance Pill & Camera Flip */
                        <div className="flex items-center justify-between">
                            <div className="px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5 shadow-sm">
                                <span className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                <span>
                                    {scannerMode === 'label'
                                        ? 'Point at ingredients or Halal logo'
                                        : 'Point at Halal Certificate'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCamera();
                                }}
                                className="p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white backdrop-blur-md transition shadow-sm active:rotate-180 duration-300"
                                title="Switch front/rear camera"
                            >
                                <SwitchCamera size={16} />
                            </button>
                        </div>
                    )}
                </div>



                {/* 7. Bottom Shutter & Controls */}
                <div className="relative z-20 flex flex-col items-center gap-2 p-4 pt-1 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
                    <div className="w-full flex items-center justify-around max-w-xs">
                        {/* Gallery Upload Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                galleryInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white active:scale-95 transition"
                            title="Upload from photo library"
                        >
                            <div className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center shadow-md hover:border-emerald-500">
                                <ImageIcon size={19} className="text-slate-300" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">Gallery</span>
                        </button>

                        {/* Primary Shutter Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isCapturing) {
                                    onCapture();
                                } else {
                                    onReset();
                                }
                            }}
                            className="relative p-1 rounded-full active:scale-95 transition focus:outline-none"
                            title={isCapturing ? 'Capture photo' : 'Restart camera'}
                        >
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/70 flex items-center justify-center p-1 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <div className="w-13 h-13 rounded-full bg-white hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center transition shadow-inner">
                                    <div className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center">
                                        <Camera size={19} className="text-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Zoom Pill Toggle */}
                        {isCapturing ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    applyZoom(zoom === 1 ? 2 : 1);
                                }}
                                className="flex flex-col items-center gap-1 text-slate-300 hover:text-white active:scale-95 transition"
                                title="Toggle 1x or 2x zoom"
                            >
                                <div className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center shadow-md font-bold text-xs text-emerald-400">
                                    {zoom}x
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">Zoom</span>
                            </button>
                        ) : (
                            <div className="w-11 h-11" />
                        )}
                    </div>

                    {/* Multi-Section Helpful Hint */}
                    {scannerMode === 'label' && (
                        <p className="text-[11px] text-slate-400 text-center font-normal pt-1">
                            Long packaging? Take Part 1, then tap <strong className="text-emerald-400 font-semibold">+ Scan Next Section</strong> to combine.
                        </p>
                    )}
                </div>

                {/* Hidden File Picker */}
                <input
                    type="file"
                    accept="image/*"
                    ref={galleryInputRef}
                    onChange={onFileUpload}
                    className="hidden"
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default CameraViewfinder;
