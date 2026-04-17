import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useHandTracking } from '../hooks/useHandTracking';
import { PORTAL_THEME_VISUALS } from '../themePresets';
import type {
  CameraFacingMode,
  CaptureSnapshot,
  FrameSize,
  PortalGeometry,
  ShapeMode,
  ThemeMode,
} from '../types';
import { clamp, estimatePortalFromHands, portalMovement, smoothPortal } from '../utils/portalMath';
import { playShutterSound } from '../utils/sound';
import { getPortalPixelRect, traceShapePath } from '../utils/shapePaths';
import { ControlPanel } from './ControlPanel';

interface PortalExperienceProps {
  shape: ShapeMode;
  onShapeChange: (shape: ShapeMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface RuntimeState {
  smoothedPortal: PortalGeometry | null;
  previousPortal: PortalGeometry | null;
  holdElapsed: number;
  holdProgress: number;
  flash: number;
  particles: Particle[];
  particleAccumulator: number;
  lastTick: number;
  lastUiSync: number;
}

interface ThemeVisual {
  name: string;
  shell: string;
  panel: string;
  stageGlow: string;
  badge: string;
  accentText: string;
  infoPanel: string;
  infoText: string;
  borderA: string;
  borderB: string;
  borderC: string;
  shadow: string;
  progressA: string;
  progressB: string;
  progressC: string;
  particle: string;
}

const HOLD_DURATION_MS = 1800;
const STABILITY_THRESHOLD = 0.026;
const BASE_FRAME: FrameSize = { width: 720, height: 960 };

const THEME_VISUALS: Record<ThemeMode, ThemeVisual> = PORTAL_THEME_VISUALS;

const createParticle = (portal: PortalGeometry, frame: FrameSize, burst = false): Particle => {
  const portalRect = getPortalPixelRect(portal, frame);
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.max(portalRect.width, portalRect.height) * 0.52;
  const spawnRadius = radius * (burst ? 1.04 + Math.random() * 0.18 : 0.94 + Math.random() * 0.12);
  const speed = burst ? 0.065 + Math.random() * 0.09 : 0.012 + Math.random() * 0.028;

  return {
    x: portalRect.centerX + Math.cos(angle) * spawnRadius,
    y: portalRect.centerY + Math.sin(angle) * spawnRadius * 0.85,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (burst ? 0.02 : 0.01),
    life: burst ? 950 + Math.random() * 420 : 700 + Math.random() * 280,
    maxLife: burst ? 950 + Math.random() * 420 : 700 + Math.random() * 280,
    size: burst ? 2 + Math.random() * 4.5 : 1.2 + Math.random() * 2.8,
  };
};

const drawMirroredSource = (context: CanvasRenderingContext2D, source: CanvasImageSource, frame: FrameSize) => {
  context.save();
  context.translate(frame.width, 0);
  context.scale(-1, 1);
  context.drawImage(source, 0, 0, frame.width, frame.height);
  context.restore();
};

const syncCanvasResolution = (canvas: HTMLCanvasElement, frame: FrameSize) => {
  const targetWidth = Math.round(frame.width);
  const targetHeight = Math.round(frame.height);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  canvas.style.aspectRatio = `${frame.width} / ${frame.height}`;
};

const resetRuntime = (runtime: RuntimeState) => {
  runtime.smoothedPortal = null;
  runtime.previousPortal = null;
  runtime.holdElapsed = 0;
  runtime.holdProgress = 0;
  runtime.flash = 0;
  runtime.particles = [];
  runtime.particleAccumulator = 0;
};

const drawPortalBorder = (
  context: CanvasRenderingContext2D,
  portal: PortalGeometry,
  frame: FrameSize,
  shape: ShapeMode,
  now: number,
  chargedAmount: number,
  captured: boolean,
  themeVisual: ThemeVisual,
) => {
  const portalRect = getPortalPixelRect(portal, frame, 0);
  const gradient = context.createLinearGradient(
    portalRect.x,
    portalRect.y,
    portalRect.x + portalRect.width,
    portalRect.y + portalRect.height,
  );
  gradient.addColorStop(0, themeVisual.borderA);
  gradient.addColorStop(0.35, themeVisual.borderB);
  gradient.addColorStop(0.68, themeVisual.borderC);
  gradient.addColorStop(1, themeVisual.borderA);

  context.save();
  traceShapePath(context, shape, portal, frame, captured ? 5 : 3);
  context.lineWidth = captured ? 12 : 10;
  context.strokeStyle = gradient;
  context.shadowBlur = captured ? 34 : 24;
  context.shadowColor = themeVisual.shadow;
  context.globalAlpha = captured ? 0.98 : 0.6 + chargedAmount * 0.36;
  context.stroke();
  context.restore();

  context.save();
  traceShapePath(context, shape, portal, frame);
  context.lineWidth = captured ? 3.6 : 2.8;
  context.strokeStyle = 'rgba(255,255,255,0.95)';
  context.stroke();
  context.restore();

  context.save();
  traceShapePath(context, shape, portal, frame, captured ? 7 : 5);
  context.setLineDash([18, 14]);
  context.lineDashOffset = -now * 0.02;
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(255,255,255,0.44)';
  context.stroke();
  context.restore();
};

const drawProgressRing = (
  context: CanvasRenderingContext2D,
  portal: PortalGeometry,
  frame: FrameSize,
  progress: number,
  themeVisual: ThemeVisual,
) => {
  if (progress <= 0) {
    return;
  }

  const portalRect = getPortalPixelRect(portal, frame);
  const radius = Math.min(frame.width, frame.height) * 0.09 + Math.max(portalRect.width, portalRect.height) * 0.12;
  const centerX = portalRect.centerX;
  const centerY = clamp(portalRect.centerY - portalRect.height * 0.66, radius + 20, frame.height - radius - 20);

  context.save();
  context.lineCap = 'round';
  context.lineWidth = 10;
  context.strokeStyle = 'rgba(255,255,255,0.18)';
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();

  const ringGradient = context.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  ringGradient.addColorStop(0, themeVisual.progressA);
  ringGradient.addColorStop(0.5, themeVisual.progressB);
  ringGradient.addColorStop(1, themeVisual.progressC);
  context.strokeStyle = ringGradient;
  context.shadowBlur = 20;
  context.shadowColor = themeVisual.shadow;
  context.beginPath();
  context.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  context.stroke();

  context.shadowBlur = 0;
  context.fillStyle = 'rgba(255,255,255,0.94)';
  context.font = '600 16px Inter, ui-sans-serif, system-ui';
  context.textAlign = 'center';
  context.fillText(`${Math.round(progress * 100)}%`, centerX, centerY + 5);
  context.restore();
};

const drawParticles = (context: CanvasRenderingContext2D, particles: Particle[], themeVisual: ThemeVisual) => {
  context.save();
  particles.forEach((particle) => {
    const life = clamp(particle.life / particle.maxLife, 0, 1);
    context.globalAlpha = life;
    context.fillStyle = 'rgba(255,255,255,0.94)';
    context.shadowBlur = 16;
    context.shadowColor = themeVisual.particle;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size * life, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
};

const drawDreamyPlaceholder = (context: CanvasRenderingContext2D, frame: FrameSize, message: string, themeVisual: ThemeVisual) => {
  const backgroundGradient = context.createLinearGradient(0, 0, frame.width, frame.height);
  backgroundGradient.addColorStop(0, themeVisual.progressA);
  backgroundGradient.addColorStop(0.45, themeVisual.progressB);
  backgroundGradient.addColorStop(1, themeVisual.progressC);
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, frame.width, frame.height);

  for (let index = 0; index < 28; index += 1) {
    const x = (index * 173) % frame.width;
    const y = (index * 97) % frame.height;
    const radius = 1.8 + (index % 3);
    context.fillStyle = `rgba(255,255,255,${0.22 + (index % 4) * 0.08})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = 'rgba(15,23,42,0.74)';
  context.textAlign = 'center';
  context.font = '600 24px Inter, ui-sans-serif, system-ui';
  context.fillText('Time Portal Camera', frame.width / 2, frame.height / 2 - 16);
  context.font = '500 16px Inter, ui-sans-serif, system-ui';
  context.fillStyle = 'rgba(30,41,59,0.74)';
  context.fillText(message, frame.width / 2, frame.height / 2 + 18);
};

const drawFlashOverlay = (context: CanvasRenderingContext2D, frame: FrameSize, strength: number) => {
  if (strength <= 0) {
    return;
  }

  const gradient = context.createRadialGradient(
    frame.width / 2,
    frame.height / 2,
    frame.width * 0.04,
    frame.width / 2,
    frame.height / 2,
    Math.max(frame.width, frame.height) * 0.65,
  );
  gradient.addColorStop(0, `rgba(255,255,255,${0.9 * strength})`);
  gradient.addColorStop(0.5, `rgba(255,255,255,${0.28 * strength})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, frame.width, frame.height);
};

const drawPortalFrame = ({
  context,
  frame,
  video,
  snapshotCanvas,
  innerLockCanvas,
  previewPortal,
  captureSnapshot,
  lockInnerFrame,
  activeShape,
  progress,
  particles,
  flash,
  now,
  statusMessage,
  themeVisual,
}: {
  context: CanvasRenderingContext2D;
  frame: FrameSize;
  video: HTMLVideoElement | null;
  snapshotCanvas: HTMLCanvasElement | null;
  innerLockCanvas: HTMLCanvasElement | null;
  previewPortal: PortalGeometry | null;
  captureSnapshot: CaptureSnapshot | null;
  lockInnerFrame: boolean;
  activeShape: ShapeMode;
  progress: number;
  particles: Particle[];
  flash: number;
  now: number;
  statusMessage: string;
  themeVisual: ThemeVisual;
}) => {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    if (captureSnapshot && snapshotCanvas) {
      drawMirroredSource(context, snapshotCanvas, frame);
    } else {
      drawMirroredSource(context, video, frame);
    }
  } else {
    drawDreamyPlaceholder(context, frame, statusMessage, themeVisual);
  }

  const currentPortal = captureSnapshot?.portal ?? previewPortal;
  const currentShape = captureSnapshot?.shape ?? activeShape;

  if (captureSnapshot && currentPortal) {
    context.save();
    traceShapePath(context, currentShape, currentPortal, frame);
    context.clip();
    if (lockInnerFrame && innerLockCanvas) {
      drawMirroredSource(context, innerLockCanvas, frame);
    } else if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      drawMirroredSource(context, video, frame);
    } else if (snapshotCanvas) {
      drawMirroredSource(context, snapshotCanvas, frame);
    }
    context.restore();
  }

  if (!captureSnapshot && currentPortal) {
    context.save();
    traceShapePath(context, currentShape, currentPortal, frame);
    context.fillStyle = 'rgba(255,255,255,0.08)';
    context.fill();
    context.restore();
  }

  if (currentPortal) {
    drawPortalBorder(context, currentPortal, frame, currentShape, now, progress, Boolean(captureSnapshot), themeVisual);
  }

  if (!captureSnapshot && currentPortal) {
    drawProgressRing(context, currentPortal, frame, progress, themeVisual);
  }

  drawParticles(context, particles, themeVisual);
  drawFlashOverlay(context, frame, flash);
};

export function PortalExperience({ shape, onShapeChange, theme, onThemeChange }: PortalExperienceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const innerLockCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shapeRef = useRef(shape);
  const captureRef = useRef<CaptureSnapshot | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>('user');
  const runtimeRef = useRef<RuntimeState>({
    smoothedPortal: null,
    previousPortal: null,
    holdElapsed: 0,
    holdProgress: 0,
    flash: 0,
    particles: [],
    particleAccumulator: 0,
    lastTick: performance.now(),
    lastUiSync: 0,
  });

  const camera = useCamera(videoRef, { enabled: true, facingMode: cameraFacingMode, zoomLevel });
  const tracking = useHandTracking(videoRef, camera.status === 'ready');

  const [captureSnapshot, setCaptureSnapshot] = useState<CaptureSnapshot | null>(null);
  const [innerFrameLocked, setInnerFrameLocked] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [hintText, setHintText] = useState('Giơ hai tay lên để tạo portal');
  const uiStateRef = useRef({ holdProgress: 0, hintText: 'Giơ hai tay lên để tạo portal' });

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);

  useEffect(() => {
    if (camera.zoom.supported) {
      setZoomLevel((current) => clamp(current, camera.zoom.min, camera.zoom.max));
    } else {
      setZoomLevel(1);
    }
  }, [camera.zoom.supported, camera.zoom.min, camera.zoom.max]);

  const themeVisual = THEME_VISUALS[theme];
  const frame = useMemo<FrameSize>(() => camera.dimensions ?? BASE_FRAME, [camera.dimensions]);

  const pushUiState = useCallback((progress: number, message: string, force = false) => {
    const previous = uiStateRef.current;

    if (force || Math.abs(progress - previous.holdProgress) > 0.035) {
      previous.holdProgress = progress;
      setHoldProgress(progress);
    }

    if (force || message !== previous.hintText) {
      previous.hintText = message;
      setHintText(message);
    }
  }, []);

  const capturePortal = useCallback((portal: PortalGeometry, portalShape: ShapeMode) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const snapshotCanvas = snapshotCanvasRef.current ?? document.createElement('canvas');
    snapshotCanvas.width = frame.width;
    snapshotCanvas.height = frame.height;
    const snapshotContext = snapshotCanvas.getContext('2d');
    if (!snapshotContext) {
      return;
    }

    snapshotContext.clearRect(0, 0, frame.width, frame.height);
    snapshotContext.drawImage(video, 0, 0, frame.width, frame.height);
    snapshotCanvasRef.current = snapshotCanvas;

    const snapshot: CaptureSnapshot = { createdAt: performance.now(), portal, shape: portalShape };
    captureRef.current = snapshot;
    setCaptureSnapshot(snapshot);
    innerLockCanvasRef.current = null;
    setInnerFrameLocked(false);
    runtimeRef.current.flash = 1;
    runtimeRef.current.holdElapsed = 0;
    runtimeRef.current.holdProgress = 0;
    runtimeRef.current.particles.push(...Array.from({ length: 28 }, () => createParticle(portal, frame, true)));
    pushUiState(0, `Portal ${themeVisual.name} đã mở — bên trong vẫn live ✨`, true);
    void playShutterSound();
  }, [frame, pushUiState, themeVisual.name]);

  const handleReset = useCallback(() => {
    captureRef.current = null;
    setCaptureSnapshot(null);
    snapshotCanvasRef.current = null;
    innerLockCanvasRef.current = null;
    setInnerFrameLocked(false);
    resetRuntime(runtimeRef.current);
    pushUiState(0, 'Giơ hai tay lên để tạo portal', true);
  }, [pushUiState]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !captureRef.current) {
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = frame.width;
    exportCanvas.height = frame.height;
    const exportContext = exportCanvas.getContext('2d');
    if (!exportContext) {
      return;
    }

    drawPortalFrame({
      context: exportContext,
      frame,
      video,
      snapshotCanvas: snapshotCanvasRef.current,
      innerLockCanvas: innerLockCanvasRef.current,
      previewPortal: null,
      captureSnapshot: captureRef.current,
      lockInnerFrame: innerFrameLocked,
      activeShape: shapeRef.current,
      progress: 0,
      particles: [],
      flash: 0,
      now: performance.now(),
      statusMessage: hintText,
      themeVisual,
    });

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `time-portal-${theme}-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, 'image/png');
  }, [frame, hintText, innerFrameLocked, theme, themeVisual]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;

    const render = (now: number) => {
      const runtime = runtimeRef.current;
      const video = videoRef.current;
      const currentFrame = frame;
      const delta = Math.min(42, Math.max(12, now - runtime.lastTick));
      runtime.lastTick = now;

      syncCanvasResolution(canvas, currentFrame);

      let previewPortal: PortalGeometry | null = null;
      let nextHint = uiStateRef.current.hintText;

      if (!captureRef.current) {
        const hands = tracking.handsRef.current;
        const rawPortal = estimatePortalFromHands(hands, shapeRef.current);

        if (rawPortal) {
          runtime.smoothedPortal = smoothPortal(runtime.smoothedPortal, rawPortal, 0.2);
          previewPortal = runtime.smoothedPortal;

          const movement = runtime.previousPortal ? portalMovement(previewPortal, runtime.previousPortal) : STABILITY_THRESHOLD * 0.35;
          runtime.previousPortal = previewPortal;

          if (movement < STABILITY_THRESHOLD) {
            runtime.holdElapsed = Math.min(HOLD_DURATION_MS, runtime.holdElapsed + delta);
            runtime.holdProgress = runtime.holdElapsed / HOLD_DURATION_MS;
            nextHint = runtime.holdProgress > 0.98 ? 'Chuẩn bị chụp...' : 'Giữ yên thêm một chút';
          } else {
            runtime.holdElapsed = Math.max(0, runtime.holdElapsed - delta * 1.4);
            runtime.holdProgress = runtime.holdElapsed / HOLD_DURATION_MS;
            nextHint = 'Giữ tay ổn định để khóa portal';
          }

          runtime.particleAccumulator += delta * (0.015 + runtime.holdProgress * 0.032);
          while (runtime.particleAccumulator >= 1) {
            runtime.particles.push(createParticle(previewPortal, currentFrame));
            runtime.particleAccumulator -= 1;
          }

          if (runtime.holdElapsed >= HOLD_DURATION_MS) {
            capturePortal(previewPortal, shapeRef.current);
          }
        } else {
          runtime.smoothedPortal = null;
          runtime.previousPortal = null;
          runtime.holdElapsed = Math.max(0, runtime.holdElapsed - delta * 1.6);
          runtime.holdProgress = runtime.holdElapsed / HOLD_DURATION_MS;
          nextHint = shapeRef.current === 'circle' ? 'Đưa 2 ngón trỏ vào khung hình' : 'Đưa 2 ngón trỏ và 2 ngón cái vào khung hình';
        }
      } else {
        runtime.holdElapsed = 0;
        runtime.holdProgress = 0;
        nextHint = 'Ảnh đã đóng băng bên ngoài portal';
      }

      runtime.flash = Math.max(0, runtime.flash - delta * 0.0034);
      runtime.particles = runtime.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * delta,
          y: particle.y + particle.vy * delta,
          vy: particle.vy + delta * 0.00003,
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0);

      drawPortalFrame({
        context,
        frame: currentFrame,
        video,
        snapshotCanvas: snapshotCanvasRef.current,
        innerLockCanvas: innerLockCanvasRef.current,
        previewPortal,
        captureSnapshot: captureRef.current,
        lockInnerFrame: innerFrameLocked,
        activeShape: shapeRef.current,
        progress: runtime.holdProgress,
        particles: runtime.particles,
        flash: runtime.flash,
        now,
        statusMessage: nextHint,
        themeVisual,
      });

      if (now - runtime.lastUiSync > 90 || Math.abs(runtime.holdProgress - uiStateRef.current.holdProgress) > 0.06 || nextHint !== uiStateRef.current.hintText) {
        runtime.lastUiSync = now;
        pushUiState(runtime.holdProgress, nextHint);
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [capturePortal, frame, innerFrameLocked, pushUiState, themeVisual, tracking.handsRef, tracking.status]);

  const toggleInnerFrameLock = useCallback(() => {
    if (!captureRef.current) {
      return;
    }

    setInnerFrameLocked((current) => {
      const next = !current;

      if (next) {
        const video = videoRef.current;
        const lockCanvas = innerLockCanvasRef.current ?? document.createElement('canvas');
        lockCanvas.width = frame.width;
        lockCanvas.height = frame.height;
        const lockContext = lockCanvas.getContext('2d');

        if (lockContext && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          lockContext.clearRect(0, 0, frame.width, frame.height);
          lockContext.drawImage(video, 0, 0, frame.width, frame.height);
          innerLockCanvasRef.current = lockCanvas;
          pushUiState(0, 'Đã lock đúng ảnh đang nằm trong khung — giờ lưu sẽ giữ nguyên phần bên trong này.', true);
        } else {
          innerLockCanvasRef.current = snapshotCanvasRef.current;
          pushUiState(0, 'Đã lock khung trong bằng ảnh gần nhất đang có.', true);
        }
      } else {
        innerLockCanvasRef.current = null;
        pushUiState(0, 'Đã mở lock — phần trong portal live lại để bạn canh tiếp.', true);
      }

      return next;
    });
  }, [frame, pushUiState]);

  const overlayMessage = camera.status === 'error'
    ? camera.error ?? 'Camera chưa được cấp quyền.'
    : tracking.status === 'error'
      ? tracking.error ?? 'Không khởi động được nhận diện tay.'
      : hintText;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <section className={`pretty-card relative overflow-hidden bg-gradient-to-br ${themeVisual.shell} p-4 sm:p-5`}>
        <div className={`absolute inset-0 ${themeVisual.stageGlow}`} />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${themeVisual.accentText}`}>
                Sân khấu portal live
              </p>
              <h2 className={`mt-1 text-2xl font-semibold ${theme === 'neon' || theme.includes('locketGold') ? 'text-white' : 'text-slate-800'}`}>
                Đổi UI tùy thích, vẫn giữ portal luôn sống.
              </h2>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-white/70 backdrop-blur ${themeVisual.badge}`}>
              {captureSnapshot ? `${innerFrameLocked ? 'Đã lock' : 'Đã chụp'} · ${themeVisual.name}` : `Preview · ${themeVisual.name}`}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.28)] ring-1 ring-black/5">
            <canvas ref={canvasRef} className="block w-full bg-slate-950" />
            <video ref={videoRef} className="hidden" muted playsInline autoPlay />
            <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center">
              <div className="max-w-xl rounded-full bg-slate-900/68 px-4 py-2 text-center text-sm font-medium text-white shadow-lg backdrop-blur">
                {overlayMessage}
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              <span className="rounded-full bg-black/30 px-3 py-2 backdrop-blur">{cameraFacingMode === 'user' ? 'Cam trước' : 'Cam sau'}</span>
              <span className="rounded-full bg-black/30 px-3 py-2 backdrop-blur">{camera.zoom.supported ? `${camera.zoom.value.toFixed(1)}x` : '1.0x'}</span>
            </div>
            {(camera.status === 'requesting' || tracking.status === 'loading') && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/26 backdrop-blur-[2px]">
                <div className="rounded-full bg-white/86 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg">
                  Đang gọi phép portal…
                </div>
              </div>
            )}
          </div>

          <div className={`grid gap-3 rounded-[28px] ${themeVisual.infoPanel} px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:grid-cols-3 sm:px-5 ${themeVisual.infoText}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${themeVisual.accentText}`}>Bước 1</p>
              <p className="mt-2 text-sm">Chọn UI và shape rồi căn tay vào khung.</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${themeVisual.accentText}`}>Bước 2</p>
              <p className="mt-2 text-sm">Dùng zoom hoặc đổi cam để lấy góc đẹp hơn khi chụp.</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${themeVisual.accentText}`}>Bước 3</p>
              <p className="mt-2 text-sm">Giữ yên để portal khóa rồi lưu ảnh đúng vibe mong muốn.</p>
            </div>
          </div>
        </div>
      </section>

      <ControlPanel
        shape={shape}
        onShapeChange={onShapeChange}
        theme={theme}
        onThemeChange={onThemeChange}
        onReset={camera.status === 'error' ? camera.restart : handleReset}
        onSave={handleSave}
        onFacingModeChange={setCameraFacingMode}
        cameraFacingMode={cameraFacingMode}
        onZoomChange={setZoomLevel}
        zoom={camera.zoom}
        cameraStatus={camera.status}
        trackerStatus={tracking.status}
        holdProgress={holdProgress}
        hasCapture={Boolean(captureSnapshot)}
        captureLocked={innerFrameLocked}
        onToggleCaptureLock={toggleInnerFrameLock}
      />
    </div>
  );
}
