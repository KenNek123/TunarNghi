import type { Landmark3D, PortalGeometry, ShapeMode, TrackedHand } from '../types';

const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const WRIST = 0;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, alpha: number) =>
  start + (end - start) * alpha;

export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const averagePoint = (points: Array<{ x: number; y: number }>) => {
  const total = points.reduce(
    (accumulator, point) => {
      accumulator.x += point.x;
      accumulator.y += point.y;
      return accumulator;
    },
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
};

const sortHandsByX = (hands: TrackedHand[]) =>
  [...hands].sort((a, b) => {
    const centerA = averagePoint([a.landmarks[WRIST], a.landmarks[MIDDLE_MCP]]).x;
    const centerB = averagePoint([b.landmarks[WRIST], b.landmarks[MIDDLE_MCP]]).x;
    return centerA - centerB;
  });

const estimateCirclePortal = (hands: TrackedHand[]): PortalGeometry | null => {
  const [leftHand, rightHand] = sortHandsByX(hands);
  const leftIndex = leftHand.landmarks[INDEX_TIP];
  const rightIndex = rightHand.landmarks[INDEX_TIP];

  if (!leftIndex || !rightIndex) {
    return null;
  }

  const fingertipDistance = distance(leftIndex, rightIndex);
  const palmSpan = distance(leftHand.landmarks[WRIST], rightHand.landmarks[WRIST]);
  const diameter = clamp(Math.max(fingertipDistance * 1.08, palmSpan * 0.72), 0.18, 0.78);

  return {
    center: {
      x: clamp((leftIndex.x + rightIndex.x) * 0.5, 0.16, 0.84),
      y: clamp((leftIndex.y + rightIndex.y) * 0.5, 0.18, 0.82),
    },
    width: diameter,
    height: diameter,
    rotation: 0,
    confidence: (leftHand.confidence + rightHand.confidence) * 0.5,
  };
};

const pickVerticalEnds = (thumb: Landmark3D, index: Landmark3D) => ({
  top: thumb.y < index.y ? thumb : index,
  bottom: thumb.y < index.y ? index : thumb,
});

const estimateFourPointPortal = (
  hands: TrackedHand[],
  shape: Exclude<ShapeMode, 'circle'>,
): PortalGeometry | null => {
  const [leftHand, rightHand] = sortHandsByX(hands);
  const leftThumb = leftHand.landmarks[THUMB_TIP];
  const leftIndex = leftHand.landmarks[INDEX_TIP];
  const rightThumb = rightHand.landmarks[THUMB_TIP];
  const rightIndex = rightHand.landmarks[INDEX_TIP];

  if (!leftThumb || !leftIndex || !rightThumb || !rightIndex) {
    return null;
  }

  const leftEnds = pickVerticalEnds(leftThumb, leftIndex);
  const rightEnds = pickVerticalEnds(rightThumb, rightIndex);
  const cornerPoints = [leftThumb, leftIndex, rightThumb, rightIndex];
  const leftEdgeX = (leftThumb.x + leftIndex.x) * 0.5;
  const rightEdgeX = (rightThumb.x + rightIndex.x) * 0.5;
  const rawWidth = Math.abs(rightEdgeX - leftEdgeX);
  const verticalSpan = averagePoint([
    { x: 0, y: Math.abs(leftEnds.bottom.y - leftEnds.top.y) },
    { x: 0, y: Math.abs(rightEnds.bottom.y - rightEnds.top.y) },
  ]).y;
  const wristSpan = distance(leftHand.landmarks[WRIST], rightHand.landmarks[WRIST]);

  let width = clamp(rawWidth * 1.18 + wristSpan * 0.08, 0.2, 0.84);
  let height = clamp(verticalSpan * 1.18, 0.2, 0.76);

  const center = {
    x: clamp((leftEdgeX + rightEdgeX) * 0.5, 0.14, 0.86),
    y: clamp(averagePoint(cornerPoints).y, 0.16, 0.84),
  };

  if (shape === 'heart' || shape === 'star') {
    const unifiedSize = clamp(Math.max(width, height) * 1.04, 0.24, 0.8);
    width = unifiedSize;
    height = unifiedSize;
  } else {
    width = clamp(Math.max(width, height * 0.85), 0.22, 0.86);
    height = clamp(Math.max(height, width * 0.56), 0.2, 0.76);
  }

  return {
    center,
    width,
    height,
    rotation: 0,
    confidence: (leftHand.confidence + rightHand.confidence) * 0.5,
  };
};

export const estimatePortalFromHands = (
  hands: TrackedHand[],
  shape: ShapeMode,
): PortalGeometry | null => {
  if (hands.length < 2) {
    return null;
  }

  if (shape === 'circle') {
    return estimateCirclePortal(hands);
  }

  return estimateFourPointPortal(hands, shape);
};

export const smoothPortal = (
  previous: PortalGeometry | null,
  next: PortalGeometry,
  alpha = 0.2,
): PortalGeometry => {
  if (!previous) {
    return next;
  }

  return {
    center: {
      x: lerp(previous.center.x, next.center.x, alpha),
      y: lerp(previous.center.y, next.center.y, alpha),
    },
    width: lerp(previous.width, next.width, alpha * 0.9),
    height: lerp(previous.height, next.height, alpha * 0.9),
    rotation: lerp(previous.rotation, next.rotation, alpha),
    confidence: lerp(previous.confidence, next.confidence, alpha),
  };
};

export const portalMovement = (
  a: PortalGeometry,
  b: PortalGeometry,
): number => {
  const centerShift = distance(a.center, b.center);
  const sizeShift = Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
  const rotationShift = Math.abs(a.rotation - b.rotation) * 0.2;

  return centerShift * 2.15 + sizeShift * 0.7 + rotationShift;
};
