import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import type { TrackerStatus, TrackedHand } from '../types';

const WASM_ROOT = '/wasm';
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

interface UseHandTrackingResult {
  status: TrackerStatus;
  error: string | null;
  handsRef: React.MutableRefObject<TrackedHand[]>;
  timestampRef: React.MutableRefObject<number>;
}

const normalizeHandedness = (rawValue: unknown): 'Left' | 'Right' | 'Unknown' => {
  if (rawValue === 'Left' || rawValue === 'Right') {
    return rawValue;
  }

  return 'Unknown';
};

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
): UseHandTrackingResult => {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<TrackedHand[]>([]);
  const timestampRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setError(null);
      handsRef.current = [];
      return;
    }

    let cancelled = false;
    let animationFrame = 0;
    let lastVideoTime = -1;
    let handLandmarker: HandLandmarker | null = null;

    const setup = async () => {
      setStatus('loading');
      setError(null);

      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
        if (cancelled) {
          return;
        }

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.58,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        setStatus('ready');

        const detect = () => {
          const video = videoRef.current;
          if (!video || !handLandmarker) {
            animationFrame = requestAnimationFrame(detect);
            return;
          }

          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            if (video.currentTime !== lastVideoTime) {
              const now = performance.now();
              const result: HandLandmarkerResult = handLandmarker.detectForVideo(video, now);
              const rawHandedness = result.handedness ?? result.handednesses ?? [];

              handsRef.current = result.landmarks.slice(0, 2).map((landmarks, index) => ({
                landmarks: landmarks.map((landmark) => ({
                  x: 1 - landmark.x,
                  y: landmark.y,
                  z: landmark.z ?? 0,
                })),
                handedness: normalizeHandedness(rawHandedness[index]?.[0]?.categoryName),
                confidence: rawHandedness[index]?.[0]?.score ?? 0.5,
              }));

              timestampRef.current = now;
              lastVideoTime = video.currentTime;
            }
          }

          animationFrame = requestAnimationFrame(detect);
        };

        detect();
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Hand tracking could not start.';
        setStatus('error');
        setError(message);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      handsRef.current = [];
      handLandmarker?.close();
    };
  }, [enabled, videoRef]);

  return {
    status,
    error,
    handsRef,
    timestampRef,
  };
};
