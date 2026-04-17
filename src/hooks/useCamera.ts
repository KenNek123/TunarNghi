import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraFacingMode, CameraStatus, CameraZoomState, FrameSize } from '../types';

interface UseCameraOptions {
  enabled: boolean;
  facingMode: CameraFacingMode;
  zoomLevel: number;
}

interface UseCameraResult {
  status: CameraStatus;
  error: string | null;
  dimensions: FrameSize | null;
  restart: () => void;
  zoom: CameraZoomState;
}

const DEFAULT_ZOOM: CameraZoomState = {
  supported: false,
  min: 1,
  max: 3,
  step: 0.1,
  value: 1,
};

export const useCamera = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  { enabled, facingMode, zoomLevel }: UseCameraOptions,
): UseCameraResult => {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<FrameSize | null>(null);
  const [zoom, setZoom] = useState<CameraZoomState>(DEFAULT_ZOOM);
  const retryKeyRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  const restart = useCallback(() => {
    retryKeyRef.current += 1;
    setRetryKey(retryKeyRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setError(null);
      setDimensions(null);
      setZoom(DEFAULT_ZOOM);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setStatus('requesting');
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          throw new Error('Camera video element is not ready yet.');
        }

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        const syncDimensions = () => {
          if (!video.videoWidth || !video.videoHeight) {
            return;
          }

          setDimensions({
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };

        const syncZoomCapabilities = async () => {
          const [track] = stream.getVideoTracks();
          if (!track) {
            return;
          }

          const capabilities = typeof track.getCapabilities === 'function'
            ? (track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min?: number; max?: number; step?: number } })
            : null;
          const settings = track.getSettings?.();
          const zoomCapability = capabilities?.zoom;

          if (
            zoomCapability &&
            typeof zoomCapability.min === 'number' &&
            typeof zoomCapability.max === 'number'
          ) {
            const nextValue = Math.min(zoomCapability.max, Math.max(zoomCapability.min, zoomLevel));
            try {
              await track.applyConstraints({
                advanced: [{ zoom: nextValue } as MediaTrackConstraintSet],
              });
            } catch {
              // Ignore and keep camera running without zoom.
            }

            const applied = track.getSettings?.().zoom ?? nextValue;
            setZoom({
              supported: true,
              min: zoomCapability.min,
              max: zoomCapability.max,
              step: zoomCapability.step ?? 0.1,
              value: typeof applied === 'number' ? applied : nextValue,
            });
            return;
          }

          setZoom({
            supported: false,
            min: 1,
            max: 3,
            step: 0.1,
            value: typeof settings?.zoom === 'number' ? settings.zoom : 1,
          });
        };

        video.addEventListener('loadedmetadata', syncDimensions);
        video.addEventListener('resize', syncDimensions);

        await video.play().catch(() => undefined);
        syncDimensions();
        await syncZoomCapabilities();
        setStatus('ready');

        return () => {
          video.removeEventListener('loadedmetadata', syncDimensions);
          video.removeEventListener('resize', syncDimensions);
        };
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Camera access was blocked.';

        setStatus('error');
        setError(message);
      }
    };

    const cleanupPromise = startCamera();

    return () => {
      cancelled = true;
      void cleanupPromise?.then((cleanup) => cleanup?.());

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [enabled, retryKey, videoRef, facingMode, zoomLevel]);

  useEffect(() => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks?.()[0];
    if (!track || !zoom.supported) {
      return;
    }

    const nextValue = Math.min(zoom.max, Math.max(zoom.min, zoomLevel));
    track.applyConstraints({
      advanced: [{ zoom: nextValue } as MediaTrackConstraintSet],
    }).then(() => {
      const applied = track.getSettings?.().zoom ?? nextValue;
      setZoom((current) => ({
        ...current,
        value: typeof applied === 'number' ? applied : nextValue,
      }));
    }).catch(() => undefined);
  }, [zoom.supported, zoom.min, zoom.max, zoomLevel]);

  return { status, error, dimensions, restart, zoom };
};
