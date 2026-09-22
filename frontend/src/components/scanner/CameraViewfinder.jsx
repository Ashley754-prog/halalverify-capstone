import { useRef } from 'react';
import {
    Camera,
    Image as ImageIcon,
    FlipHorizontal,
    SwitchCamera,
    Crosshair,
    ShieldCheck,
    ShieldAlert,
    ScanSearch,
    FileText
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
}) => {
    const containerRef = useRef(null);
    const nativeCameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-2 mb-2.5 px-1 shrink-0">
                <div className="flex-1 max-w-md mx-auto grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-inner">
                    <button
                        type="button"
                        onClick={() => {
                            setScannerMode('label');
                            if (selectedImage) onReset();
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
                            if (selectedImage) onReset();
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
                onClick={(e) => handleTapToFocus(e, containerRef)}
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

                        {/* YOLOv8 Visual Bounding Box Overlay */}
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
                            onClick={() => onReset()}
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

                {/* 5. Top Viewfinder HUD Toolbar */}
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

                    {/* Guidance Hint */}
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
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 max-w-[70vw] max-h-[42vh] aspect-square border border-emerald-500/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2.5s_infinite]"></div>
                        </div>
                    </div>
                )}

                {/* 7. Bottom Controls (Zoom & Shutter) */}
                <div className="relative z-20 flex flex-col items-center gap-2 p-4 pt-1 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
                    {/* Zoom Buttons */}
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

                    {/* Shutter Row */}
                    <div className="w-full flex items-center justify-around sm:justify-center sm:gap-12">
                        {/* Gallery Upload */}
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

                        {/* Shutter Trigger */}
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
                            title={isCapturing ? 'Capture Photo' : 'Start Camera'}
                        >
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/60 flex items-center justify-center p-1 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                                <div className="w-13 h-13 rounded-full bg-white hover:bg-emerald-50 active:bg-emerald-200 shadow-inner flex items-center justify-center transition">
                                    <div className="w-11 h-11 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                        <Camera size={20} className="text-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Native Phone Camera Upload */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                nativeCameraInputRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-1 text-slate-300 hover:text-white active:scale-90 transition group"
                            title="Open phone native camera app"
                        >
                            <div className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:border-emerald-500 group-hover:bg-slate-800">
                                <Camera size={20} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">Native Cam</span>
                        </button>
                    </div>
                </div>

                {/* Hidden File Inputs */}
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={nativeCameraInputRef}
                    onChange={onFileUpload}
                    className="hidden"
                />
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
