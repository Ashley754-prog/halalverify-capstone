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

    const [isCapturing, setIsCapturing] = useState(false);
    const [actualFacing, setActualFacing] = useState('environment');
    const [videoDevices, setVideoDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [isMirrored, setIsMirrored] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [zoomCapabilities, setZoomCapabilities] = useState(null);
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

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((playErr) => {
                        console.warn('Auto-play blocked or delayed:', playErr);
                    });
                };
            }

            // Interrogate hardware sensor tracks
            const track = stream.getVideoTracks()[0];
            if (track) {
                const settings = track.getSettings ? track.getSettings() : {};
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
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
            setCameraError('Unable to access camera sensor. Please grant camera permissions or use upload mode.');
            setIsCapturing(false);
            if (onToast) {
                onToast({
                    visible: true,
                    message: 'Camera unavailable. You can use Native Camera or Gallery upload.',
                    type: 'info'
                });
            }
        } finally {
            isStartingRef.current = false;
        }
    }, [updateDeviceList, onToast]);

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
     * Capture frame from video element into canvas and export dataUrl
     */
    const captureFrame = (onCaptured) => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const maxDim = 1280;
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

            ctx.save();
            if (isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

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

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            stopCamera();

            if (window.navigator?.vibrate) {
                window.navigator.vibrate([20, 50, 20]);
            }

            if (onCaptured) onCaptured(dataUrl);
        }
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
        focusRing,
        cameraError,
        startCamera,
        stopCamera,
        toggleCamera,
        applyZoom,
        handleTapToFocus,
        captureFrame,
    };
};
