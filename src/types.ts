export type ShapeMode = 'circle' | 'roundedRect' | 'heart' | 'star';
export type ThemeMode = 'dreamy' | 'locket' | 'locketGold' | 'locketGoldMidnight' | 'locketGoldEspresso' | 'locketGoldVelvet' | 'neon' | 'sunset';
export type CameraFacingMode = 'user' | 'environment';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error';
export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Point2D {
  x: number;
  y: number;
}

export interface Landmark3D extends Point2D {
  z: number;
}

export interface TrackedHand {
  handedness: 'Left' | 'Right' | 'Unknown';
  confidence: number;
  landmarks: Landmark3D[];
}

export interface PortalGeometry {
  center: Point2D;
  width: number;
  height: number;
  rotation: number;
  confidence: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

export interface CaptureSnapshot {
  createdAt: number;
  portal: PortalGeometry;
  shape: ShapeMode;
}

export interface CameraZoomState {
  supported: boolean;
  min: number;
  max: number;
  step: number;
  value: number;
}
