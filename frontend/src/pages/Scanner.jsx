import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Eye, ScanSearch, FileText, X, Image as ImageIcon } from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Toast from '../components/ui/Toast';
import { analyzeImage, simulateFallback } from '../utils/api';

export const Scanner = () => {
    const [scannerMode, setScannerMode] = useState('label'); // 'label' or 'cert'
    const [isCapturing, setIsCapturing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    const [scanResult, setScanResult] = useState(null);
    const [certResult, setCertResult] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraStream, setCameraStream] = useState(null);

    const startCamera = async () => {
        setErrorMsg(null);
        setIsCapturing(true);
        setScanResult(null);
        setCertResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setToast({ visible: true, message: 'Camera ready. Capture a photo to begin analysis.', type: 'success' });
        } catch (err) {
            setErrorMsg("Unable to access local camera. Fallback to file upload mode.");
            setToast({ visible: true, message: 'Camera unavailable. You can still upload an image file.', type: 'info' });
            setIsCapturing(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCapturing(false);
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setSelectedImage(dataUrl);
            stopCamera();
            setToast({ visible: true, message: 'Image captured. Running analysis now.', type: 'info' });
            triggerAIScan(dataUrl);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result);
                setToast({ visible: true, message: 'Image uploaded. Running analysis now.', type: 'info' });
                triggerAIScan(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerAIScan = async (base64Img) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const result = await analyzeImage(base64Img, scannerMode);
            if (scannerMode === 'label') setScanResult(result);
            else setCertResult(result);
            setToast({ visible: true, message: 'Analysis complete. Review the results below.', type: 'success' });
        } catch (err) {
            setErrorMsg("Backend server unreachable. The placeholder result below is NOT a verification.");
            setToast({ visible: true, message: 'Backend unavailable. Showing offline placeholder result.', type: 'info' });
            setTimeout(() => {
                const result = simulateFallback(scannerMode);
                if (scannerMode === 'label') setScanResult(result);
                else setCertResult(result);
                setIsLoading(false);
            }, 1000);
        } finally {
            if (!errorMsg) setIsLoading(false);
        }
    };

    const resetState = () => {
        setSelectedImage(null);
        setScanResult(null);
        setCertResult(null);
        setErrorMsg(null);
        stopCamera();
    };

    useEffect(() => {
        return () => { if (cameraStream) stopCamera(); };
    }, [cameraStream]);

    return (
        <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col h-full">
            <Topbar
                title="Visual Inspection Scanner"
                subtitle="Capture or upload a product label or halal certificate for OCR analysis."
            />

            {/* Mode Toggle Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <button
                    onClick={() => { setScannerMode('label'); resetState(); }}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                        scannerMode === 'label'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <ScanSearch size={18} /> Label Scanner & Parser (EasyOCR)
                    </span>
                </button>
                <button
                    onClick={() => { setScannerMode('cert'); resetState(); }}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
                        scannerMode === 'cert'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/10'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <FileText size={18} /> Halal Certificate Analyzer (OCR + Registry)
                    </span>
                </button>
            </div>

            {/* Main Interactive Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start flex-1">

                {/* Left Side: Capture View */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5 min-h-[320px] sm:min-h-[400px] justify-between">
                    <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-200 flex flex-col justify-center items-center">
                        {isCapturing && (
                            <div className="absolute inset-0 z-10 flex flex-col justify-end p-3 sm:p-4">
                                <video ref={videoRef} className="w-full h-full object-cover absolute top-0 left-0" playsInline muted></video>
                                <div className="absolute inset-3 sm:inset-4 border-2 border-dashed border-emerald-500/50 rounded-lg pointer-events-none"></div>
                                <div className="relative z-20 flex gap-2 sm:gap-4 justify-center">
                                    <button onClick={captureFrame} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg text-xs sm:text-sm flex items-center gap-2">
                                        Capture Picture
                                    </button>
                                    <button onClick={stopCamera} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm border border-slate-600">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isCapturing && !selectedImage && (
                            <div className="text-center p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 flex justify-center items-center text-emerald-400">
                                    <ImageIcon size={24} className="sm:w-7 sm:h-7" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-200 text-xs sm:text-sm">Input Image Workspace</p>
                                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-xs sm:max-w-sm">Capture a live label, logo photo, or upload an image file.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full max-w-md mt-1 sm:mt-2">
                                    <button onClick={startCamera} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm">
                                        Open Camera
                                    </button>
                                    <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 sm:py-3 rounded-xl cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors">
                                        Upload File
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        )}

                        {selectedImage && !isCapturing && (
                            <div className="relative w-full h-full">
                                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                                <button onClick={resetState} className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-2 border border-slate-700">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {errorMsg && <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 sm:p-4 text-xs font-medium">{errorMsg}</div>}
                </div>

                {/* Right Side: Analytical Panel */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 min-h-[320px] sm:min-h-[400px]">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Eye size={16} className="text-emerald-500 shrink-0" /> Pipeline Evaluation Output
                    </h3>

                    {isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-12 gap-3">
                            <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-500 animate-spin" />
                            <p className="text-xs text-slate-500 font-medium">Running OCR analysis...</p>
                        </div>
                    )}

                    {!isLoading && !scanResult && !certResult && (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-12 text-center text-slate-400">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p className="text-xs">Provide an image input to start OCR analysis.</p>
                        </div>
                    )}

                    {!isLoading && scanResult && scannerMode === 'label' && (
                        <div className="space-y-3 sm:space-y-4">
                            <div className={`p-3.5 sm:p-4 rounded-xl border flex justify-between items-center ${
                                scanResult.verdict === 'Green' ? 'bg-green-50 border-green-200 text-green-800' :
                                scanResult.verdict === 'Yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                'bg-red-50 border-red-200 text-red-800'
                            }`}>
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Classification Verdict</span>
                                    <p className="text-base sm:text-lg font-black tracking-wide">{scanResult.verdict} State</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Analysis Summary</span>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    {scanResult.analysisSummary}
                                </p>
                                {scanResult.riskLevel && (
                                    <p className="text-xs text-slate-600">
                                        Risk Level: <span className="font-bold">{scanResult.riskLevel}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Flagged Additive Compounds</span>
                                {scanResult.flaggedIngredients?.length > 0 ? (
                                    scanResult.flaggedIngredients.map((flag, i) => (
                                        <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs">
                                            <p className="font-bold text-red-700">{flag.ingredient} - {flag.status}</p>
                                            <p className="text-red-600/80 mt-0.5">{flag.reason}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
                                        No flagged additives found in the current database.
                                    </div>
                                )}
                            </div>

                            {scanResult.recommendations?.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-blue-500">Recommendations</span>
                                    <ul className="list-disc pl-4 text-xs text-blue-700 space-y-1">
                                        {scanResult.recommendations.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {scanResult.ocrText && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Extracted OCR Text</span>
                                    <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                                        {scanResult.ocrText}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && certResult && scannerMode === 'cert' && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border ${
                                certResult.status === 'Valid'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : certResult.status === 'Suspicious'
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                                <span className="text-[10px] uppercase font-bold">Document Authentication State</span>
                                <p className="text-lg font-black">{certResult.status}</p>
                            </div>

                            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100 space-y-1.5 sm:space-y-2 text-xs">
                                <p className="text-slate-600">Issuer: <span className="font-bold text-slate-800">{certResult.certifyingBody}</span></p>
                                <p className="text-slate-600">Establishment: <span className="font-bold text-slate-800">{certResult.establishmentName}</span></p>
                                <p className="text-slate-600">Serial Key: <span className="font-bold text-slate-800 font-mono">{certResult.certificateNumber}</span></p>
                                <p className="text-slate-600">Expires: <span className="font-bold text-slate-800">{certResult.expirationDate || 'Not detected'}</span></p>
                                {typeof certResult.layoutConfidence === 'number' && (
                                    <p className="text-slate-600">
                                        OCR Confidence: <span className="font-bold text-slate-800">{Math.round(certResult.layoutConfidence * 100)}%</span>
                                    </p>
                                )}
                                {certResult.ocrQuality && (
                                    <p className="text-slate-600">
                                        OCR Quality: <span className="font-bold text-slate-800">{certResult.ocrQuality}</span>
                                    </p>
                                )}
                                {typeof certResult.matchConfidence === 'number' && certResult.matchConfidence > 0 && (
                                    <p className="text-slate-600">
                                        Registry Match Confidence: <span className="font-bold text-slate-800">{Math.round(certResult.matchConfidence * 100)}%</span>
                                    </p>
                                )}
                            </div>

                            {certResult.authenticationNote && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Authentication Note</span>
                                    <p className="text-slate-700 leading-relaxed">{certResult.authenticationNote}</p>
                                </div>
                            )}

                            {certResult.registryMatch && (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-emerald-600">Registry Match</span>
                                    <p className="text-emerald-700">
                                        Matched with: <span className="font-bold">{certResult.registryMatch.name}</span>
                                    </p>
                                    <p className="text-emerald-700">
                                        Certificate No: <span className="font-bold font-mono">{certResult.registryMatch.certificate_number}</span>
                                    </p>
                                    <p className="text-emerald-700">
                                        Registry expiry: <span className="font-bold">{certResult.registryMatch.expiry_date || 'N/A'}</span>
                                    </p>
                                </div>
                            )}

                            {certResult.recommendations?.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-blue-500">Recommendations</span>
                                    <ul className="list-disc pl-4 text-blue-700 space-y-1">
                                        {certResult.recommendations.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {certResult.ocrText && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Extracted OCR Text</span>
                                    <p className="text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                                        {certResult.ocrText}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ visible: false, message: '', type: 'info' })} />
        </div>
    );
};

export default Scanner;
