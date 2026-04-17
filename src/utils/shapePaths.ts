import type { FrameSize, PortalGeometry, ShapeMode } from '../types';

export interface PortalPixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export const getPortalPixelRect = (
  portal: PortalGeometry,
  frame: FrameSize,
  inflate = 0,
): PortalPixelRect => {
  const width = portal.width * frame.width + inflate * 2;
  const height = portal.height * frame.height + inflate * 2;
  const centerX = portal.center.x * frame.width;
  const centerY = portal.center.y * frame.height;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    centerX,
    centerY,
  };
};

const roundedRectPath = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(width, height) * 0.18;

  context.moveTo(-halfWidth + radius, -halfHeight);
  context.lineTo(halfWidth - radius, -halfHeight);
  context.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  context.lineTo(halfWidth, halfHeight - radius);
  context.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  context.lineTo(-halfWidth + radius, halfHeight);
  context.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  context.lineTo(-halfWidth, -halfHeight + radius);
  context.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  context.closePath();
};

const heartPath = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  context.moveTo(0, height * 0.34);
  context.bezierCurveTo(
    -width * 0.6,
    height * 0.05,
    -width * 0.62,
    -height * 0.42,
    0,
    -height * 0.12,
  );
  context.bezierCurveTo(
    width * 0.62,
    -height * 0.42,
    width * 0.6,
    height * 0.05,
    0,
    height * 0.34,
  );
  context.closePath();
};

const starPath = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.46;
  const points = 5;

  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
};

export const traceShapePath = (
  context: CanvasRenderingContext2D,
  shape: ShapeMode,
  portal: PortalGeometry,
  frame: FrameSize,
  inflate = 0,
) => {
  const width = portal.width * frame.width + inflate * 2;
  const height = portal.height * frame.height + inflate * 2;
  const centerX = portal.center.x * frame.width;
  const centerY = portal.center.y * frame.height;

  context.save();
  context.translate(centerX, centerY);
  if (portal.rotation !== 0) {
    context.rotate(portal.rotation);
  }

  context.beginPath();

  switch (shape) {
    case 'circle':
      context.arc(0, 0, Math.max(width, height) / 2, 0, Math.PI * 2);
      break;
    case 'roundedRect':
      roundedRectPath(context, width, height);
      break;
    case 'heart':
      heartPath(context, width, height);
      break;
    case 'star':
      starPath(context, width, height);
      break;
    default:
      context.arc(0, 0, Math.max(width, height) / 2, 0, Math.PI * 2);
      break;
  }

  context.restore();
};
