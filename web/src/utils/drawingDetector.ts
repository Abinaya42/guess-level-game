import { StrokeData } from '../types';

export interface DetectionResult {
  label: string;
  confidence: number;
}

// Analyzes canvas pixel geometry, aspect ratio, circles/wheels, roof triangles, and colors
export function detectDrawing(canvas: HTMLCanvasElement, strokes: StrokeData[]): DetectionResult | null {
  if (!strokes || strokes.length === 0) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height).data;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let coloredPixels = 0;
  let redPixels = 0, yellowPixels = 0, greenPixels = 0, orangePixels = 0, purplePixels = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      // Ignore white background
      if (r < 240 || g < 240 || b < 240) {
        coloredPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Color classification for fruits
        if (r > 180 && g < 90 && b < 90) redPixels++;
        else if (r > 200 && g > 170 && b < 80) yellowPixels++;
        else if (r > 200 && g > 90 && g < 165 && b < 70) orangePixels++;
        else if (g > 150 && r < 120) greenPixels++;
        else if (r > 100 && b > 120 && g < 90) purplePixels++;
      }
    }
  }

  if (coloredPixels < 40) return null;

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const aspectRatio = boxW / boxH;

  // Detect closed circular strokes (wheels, fruits, grapes)
  let closedLoops = 0;
  let bottomCircles = 0;
  let topTriangleScore = 0;

  strokes.forEach((s) => {
    if (s.isEraser || s.points.length < 6) return;
    const first = s.points[0];
    const last = s.points[s.points.length - 1];
    const dist = Math.hypot(first.x - last.x, first.y - last.y);

    const xs = s.points.map((p) => p.x);
    const ys = s.points.map((p) => p.y);
    const sW = Math.max(...xs) - Math.min(...xs);
    const sH = Math.max(...ys) - Math.min(...ys);
    const sCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;

    if (dist < Math.max(sW, sH) * 0.45 && sW > 12 && sH > 12) {
      closedLoops++;
      if (sCenterY > minY + boxH * 0.65 && sW < boxW * 0.35) {
        bottomCircles++;
      }
    }

    // Check roof peak at top of bounding box (House)
    const minStrokeY = Math.min(...ys);
    if (minStrokeY <= minY + boxH * 0.15 && sW > boxW * 0.45 && sH < boxH * 0.55) {
      topTriangleScore++;
    }
  });

  // 1. Vehicles: BUS vs VAN (wide box + 2 or more wheels at the bottom)
  if (aspectRatio >= 1.35 && bottomCircles >= 2) {
    if (aspectRatio >= 1.85 || strokes.length >= 6) {
      return { label: 'BUS', confidence: 0.88 };
    }
    return { label: 'VAN', confidence: 0.85 };
  }

  // 2. Buildings: HOUSE (triangular roof on top + rectangular body)
  if (topTriangleScore >= 1 && aspectRatio >= 0.7 && aspectRatio <= 1.5 && bottomCircles === 0) {
    return { label: 'HOUSE', confidence: 0.86 };
  }

  // 3. Fruits detection (by shape + color + stroke clusters)
  if (purplePixels > coloredPixels * 0.25 || closedLoops >= 5) {
    return { label: 'GRAPES', confidence: 0.84 };
  }
  if (aspectRatio >= 1.45 && yellowPixels > coloredPixels * 0.2) {
    return { label: 'BANANA', confidence: 0.87 };
  }
  if (redPixels > coloredPixels * 0.25) {
    return { label: 'APPLE', confidence: 0.89 };
  }
  if (orangePixels > coloredPixels * 0.25) {
    return { label: 'ORANGE', confidence: 0.86 };
  }
  if (yellowPixels > coloredPixels * 0.25 && aspectRatio < 1.35) {
    return { label: 'MANGO', confidence: 0.83 };
  }

  // Fallback shape-only guesses (if drawn in black ink only)
  if (aspectRatio >= 1.8 && strokes.length >= 4) {
    return { label: 'BUS', confidence: 0.76 };
  }
  if (aspectRatio >= 1.45 && strokes.length <= 3) {
    return { label: 'BANANA', confidence: 0.75 };
  }
  if (closedLoops >= 1 && aspectRatio >= 0.75 && aspectRatio <= 1.3) {
    return { label: 'APPLE', confidence: 0.74 };
  }

  return null;
}