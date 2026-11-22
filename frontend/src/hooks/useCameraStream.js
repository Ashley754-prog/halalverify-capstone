import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage WebRTC camera streaming, hardware lens interrogation,
 * optical/software zoom, tap-to-focus constraints, and frame capture.
 */
export const useCameraStream = (onToast) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const isStartingRef = useRef(false);
    const targetFacingRef = useRef('environment');

    const [isCapturing, setIsCapturing] = useState(true);
    const [actualFacing, setActualFacing] = useState('environment');
    const [videoDevices, setVideoDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [isMirrored, setIsMirrored] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [zoomCapabilities, setZoomCapabilities] = useState(null);
    const [torchOn, setTorchOn] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [focusRing, setFocusRing] = useState(null);
    const [cameraError, setCameraError] = useState(null);

    /**
     * Enumerate available video input devices
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
     * Pick the primary rear lens on multi-camera Android phones (avoids blurry fixed-focus macro/ultra-wide lenses)
     */
    const pickPreferredRearDeviceId = async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return null;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            const backLenses = videoInputs.filter((d) => {
                const lbl = (d.label || '').toLowerCase();
                return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment');
            });
            if (backLenses.length <= 1) return null;

            // Prefer primary main sensor ("camera2 0", "back camera", not ultra-wide/wide/macro/tele/depth)
            const scored = backLenses.map((d, idx) => {
                const lbl = (d.label || '').toLowerCase();
                let score = 0;
                if (lbl.includes('camera2 0') || /\b0\b/.test(lbl)) score += 30;
                if (lbl.includes('main') || lbl.includes('primary')) score += 20;
                if (lbl.includes('ultra') || lbl.includes('macro') || lbl.includes('depth') || lbl.includes('tele')) score -= 40;
                if (lbl.includes('wide') && !lbl.includes('ultra')) score += 5;
                return { deviceId: d.deviceId, score, idx };
            });
            scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
            return scored[0]?.score > 0 ? scored[0].deviceId : null;
        } catch {
            return null;
        }
    };

    /**
     * Configure continuous autofocus, auto-exposure, zoom, and torch capability detection on an active track
     */
    const configureTrackHardware = useCallback((track) => {
        if (!track) return;
        const settings = track.getSettings ? track.getSettings() : {};
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};

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

        const hasTorch = Boolean(capabilities.torch);
        setTorchSupported(hasTorch);
        if (!hasTorch) {
            setTorchOn(false);
        }

        // Enable continuous autofocus, auto-exposure, and auto white balance when supported
        if (track.applyConstraints) {
            const advanced = {};
            if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
                advanced.focusMode = 'continuous';
            }
            if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
                advanced.exposureMode = 'continuous';
            }
            if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes('continuous')) {
                advanced.whiteBalanceMode = 'continuous';
            }
            if (Object.keys(advanced).length > 0) {
                track.applyConstraints({ advanced: [advanced] }).catch(() => {});
            }
        }
    }, []);

    /**
     * Start the camera stream with progressive hardware fallback
     */
    const startCamera = useCallback(async (desiredFacing, specificDeviceId) => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        setCameraError(null);
        setIsCapturing(true);
        const facingToUse = desiredFacing || targetFacingRef.current;

        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }

        try {
            let stream = null;
            let resolvedDeviceId = specificDeviceId || null;
            if (!resolvedDeviceId && facingToUse === 'environment') {
                resolvedDeviceId = await pickPreferredRearDeviceId();
            }

            if (resolvedDeviceId) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: resolvedDeviceId },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            focusMode: { ideal: 'continuous' }
                        },
                        audio: false
                    });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: resolvedDeviceId },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        },
                        audio: false
                    });
                }
            } else {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: { exact: facingToUse },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                            focusMode: { ideal: 'continuous' }
                        },
                        audio: false
                    });
                } catch {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode: { ideal: facingToUse },
                                width: { ideal: 1920 },
                                height: { ideal: 1080 }
                            },
                            audio: false
                        });
                    } catch {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    }
                }
            }

            cameraStreamRef.current = stream;

            // Interrogate hardware sensor tracks
            const track = stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings ? track.getSettings() : {};
                const trackLabel = (track.label || '').toLowerCase();

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
                setIsMirrored(detectedFacing === 'user');
                setTorchOn(false);
                configureTrackHardware(track);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((playErr) => {
                        console.warn('Auto-play blocked or delayed:', playErr);
                    });
                    // Re-read capabilities after video starts (Android Chrome often exposes torch/focusMode only after play)
                    const activeTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
                    if (activeTrack) {
                        setTimeout(() => configureTrackHardware(activeTrack), 300);
                    }
                };
            }

            updateDeviceList();
        } catch (err) {
            console.error('Camera initialization failed:', err);
            setCameraError('Unable to access camera sensor. Please grant camera permissions or use upload mode.');
            setIsCapturing(false);
            if (onToast) {
                onToast({
                    visible: true,
                    message: 'Camera unavailable. You can use Gallery upload.',
                    type: 'info'
                });
            }
        } finally {
            isStartingRef.current = false;
        }
    }, [updateDeviceList, configureTrackHardware, onToast]);

    /**
     * Stop the live camera stream cleanly
     */
    const stopCamera = useCallback(() => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        setTorchOn(false);
        setIsCapturing(false);
    }, []);

    /**
     * Toggle hardware camera flashlight / torch on supported mobile devices
     */
    const toggleTorch = async () => {
        const stream = cameraStreamRef.current;
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (!track || !track.applyConstraints) return;

        const nextTorch = !torchOn;
        try {
            try {
                await track.applyConstraints({
                    advanced: [{ torch: nextTorch }]
                });
            } catch {
                await track.applyConstraints({ torch: nextTorch });
            }
            setTorchOn(nextTorch);
            if (window.navigator?.vibrate) {
                window.navigator.vibrate(15);
            }
        } catch {
            setTorchSupported(false);
            setTorchOn(false);
            if (onToast) {
                onToast({
                    visible: true,
                    message: 'Flashlight is not supported by this browser or camera lens.',
                    type: 'info'
                });
            }
        }
    };

    /**
     * Switch between front and rear cameras
     */
    const toggleCamera = async () => {
        const nextFacing = actualFacing === 'environment' ? 'user' : 'environment';
        targetFacingRef.current = nextFacing;

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
     * Apply hardware or software zoom level
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
     * Tap to focus with HUD reticle indicator & hardware constraint
     */
    const handleTapToFocus = (e, containerRef) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        setFocusRing({ x, y, active: true });
        if (window.navigator?.vibrate) {
            window.navigator.vibrate(15);
        }

        setTimeout(() => {
            setFocusRing((prev) => (prev ? { ...prev, active: false } : null));
        }, 1200);

        const stream = cameraStreamRef.current;
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track && track.applyConstraints) {
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                const focusModes = Array.isArray(capabilities.focusMode) ? capabilities.focusMode : [];
                const normX = Math.max(0, Math.min(1, x / rect.width));
                const normY = Math.max(0, Math.min(1, y / rect.height));

                // Trigger a real refocus cycle without bundling unsupported pointsOfInterest (which makes Android Chrome reject the whole call)
                if (focusModes.includes('single-shot')) {
                    const step = { focusMode: 'single-shot' };
                    if (capabilities.pointsOfInterest) {
                        step.pointsOfInterest = [{ x: normX, y: normY }];
                    }
                    track.applyConstraints({ advanced: [step] })
                        .then(() => {
                            if (focusModes.includes('continuous')) {
                                setTimeout(() => {
                                    track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
                                }, 700);
                            }
                        })
                        .catch(() => {});
                } else if (focusModes.includes('continuous')) {
                    track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
                }
            }
        }
    };

    /**
     * Capture sharp still photo (using hardware ImageCapture API when available, falling back to high-quality canvas)
     */
    const captureFrame = async (onCaptured) => {
        if (!videoRef.current || !canvasRef.current) return;

        const maxDim = 1600;
        const jpegQuality = 0.92;
        const stream = cameraStreamRef.current;
        const track = stream?.getVideoTracks?.()[0];
        const useSoftwareCrop = !zoomCapabilities && zoom > 1;

        const finishCapture = (dataUrl) => {
            stopCamera();
            if (window.navigator?.vibrate) {
                window.navigator.vibrate([20, 50, 20]);
            }
            if (onCaptured) onCaptured(dataUrl);
        };

        // 1. Prefer hardware ImageCapture.takePhoto() on Android Chrome for crisp autofocused still photography
        if (!useSoftwareCrop && !isMirrored && track && typeof window !== 'undefined' && 'ImageCapture' in window) {
            try {
                const imageCapture = new window.ImageCapture(track);
                const photoBlob = await imageCapture.takePhoto();
                const bitmap = await createImageBitmap(photoBlob);
                const canvas = canvasRef.current;
                let targetW = bitmap.width;
                let targetH = bitmap.height;
                if (Math.max(targetW, targetH) > maxDim) {
                    const ratio = maxDim / Math.max(targetW, targetH);
                    targetW = Math.round(targetW * ratio);
                    targetH = Math.round(targetH * ratio);
                }
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
                    bitmap.close?.();
                    finishCapture(canvas.toDataURL('image/jpeg', jpegQuality));
                    return;
                }
                bitmap.close?.();
            } catch (photoErr) {
                console.warn('ImageCapture.takePhoto fallback to video frame:', photoErr);
            }
        }

        // 2. Fallback: high-resolution video frame capture
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        let targetW = vw;
        let targetH = vh;
        if (Math.max(vw, vh) > maxDim) {
            const ratio = maxDim / Math.max(vw, vh);
            targetW = Math.round(vw * ratio);
            targetH = Math.round(vh * ratio);
        }
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        if (useSoftwareCrop) {
            const cropWidth = vw / zoom;
            const cropHeight = vh / zoom;
            const cropX = (vw - cropWidth) / 2;
            const cropY = (vh - cropHeight) / 2;
            ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        finishCapture(canvas.toDataURL('image/jpeg', jpegQuality));
    };

    // Auto-start rear camera stream on mount
    useEffect(() => {
        startCamera('environment');
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return {
        videoRef,
        canvasRef,
        isCapturing,
        actualFacing,
        isMirrored,
        setIsMirrored,
        zoom,
        zoomCapabilities,
        torchOn,
        torchSupported,
        focusRing,
        cameraError,
        startCamera,
        stopCamera,
        toggleCamera,
        toggleTorch,
        applyZoom,
        handleTapToFocus,
        captureFrame,
    };
};
