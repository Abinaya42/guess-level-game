import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StrokeData } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DrawingCanvasProps {
  isArtist: boolean;
  strokes: StrokeData[];
  onStroke?: (stroke: StrokeData) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

interface DrawingTools {
  color: string;
  brushSize: number;
  isEraser: boolean;
}

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#f59e0b', '#6b7280', '#a78bfa', '#34d399',
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isArtist,
  strokes,
  onStroke,
  onUndo,
  onRedo,
  onClear,
  width = 600,
  height = 450,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<Array<{ x: number; y: number }>>([]);
  const [tools, setTools] = useState<DrawingTools>({ color: '#000000', brushSize: 4, isEraser: false });

  // Redraw all strokes whenever strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, [strokes]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isArtist) return;
    isDrawing.current = true;
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    currentPoints.current = [pos];

    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.strokeStyle = tools.isEraser ? '#ffffff' : tools.color;
    ctx.lineWidth = tools.isEraser ? tools.brushSize * 3 : tools.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(pos.x, pos.y);
  }, [isArtist, tools]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isArtist || !isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    currentPoints.current.push(pos);

    const ctx = canvas.getContext('2d')!;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isArtist]);

  const endDraw = useCallback(() => {
    if (!isArtist || !isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.current.length > 1 && onStroke) {
      const stroke: StrokeData = {
        id: uuidv4(),
        points: [...currentPoints.current],
        color: tools.color,
        brushSize: tools.isEraser ? tools.brushSize * 3 : tools.brushSize,
        isEraser: tools.isEraser,
        timestamp: Date.now(),
      };
      onStroke(stroke);
    }
    currentPoints.current = [];
  }, [isArtist, tools, onStroke]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isArtist && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {/* Colors */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setTools(t => ({ ...t, color: c, isEraser: false }))}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c,
                  border: tools.color === c && !tools.isEraser ? '3px solid #3b82f6' : '1px solid #94a3b8',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Brush size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Size:</span>
            <input
              type="range" min={1} max={30} value={tools.brushSize}
              onChange={e => setTools(t => ({ ...t, brushSize: +e.target.value }))}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: 12, minWidth: 20 }}>{tools.brushSize}</span>
          </div>

          {/* Tools */}
          <button
            onClick={() => setTools(t => ({ ...t, isEraser: !t.isEraser }))}
            style={{ padding: '4px 10px', borderRadius: 6, background: tools.isEraser ? '#3b82f6' : '#e2e8f0', color: tools.isEraser ? '#fff' : '#374151', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            ✏️ {tools.isEraser ? 'Eraser' : 'Draw'}
          </button>
          <button onClick={onUndo} style={{ padding: '4px 10px', borderRadius: 6, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: 13 }}>↩ Undo</button>
          <button onClick={onRedo} style={{ padding: '4px 10px', borderRadius: 6, background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: 13 }}>↪ Redo</button>
          <button onClick={onClear} style={{ padding: '4px 10px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 13 }}>🗑 Clear</button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '2px solid #e2e8f0',
          borderRadius: 8,
          background: '#ffffff',
          cursor: isArtist ? (tools.isEraser ? 'cell' : 'crosshair') : 'default',
          touchAction: 'none',
          maxWidth: '100%',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
};
