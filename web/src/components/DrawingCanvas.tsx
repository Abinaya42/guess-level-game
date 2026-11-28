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
  '#ECFDF5', '#0E2E1F', '#E11D48', '#F97316', '#EAB308',
  '#16A34A', '#2563EB', '#7C3AED', '#EC4899', '#0891B2',
  '#65A30D', '#92400E', '#64748B', '#10B981', '#34D399',
];

const BRUSH_SIZES = [3, 7, 13, 22];

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
  const [tools, setTools] = useState<DrawingTools>({ color: '#ECFDF5', brushSize: 7, isEraser: false });

  // Redraw all strokes whenever strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0B2418';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#0B2418' : stroke.color;
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
    ctx.strokeStyle = tools.isEraser ? '#0B2418' : tools.color;
    ctx.lineWidth = tools.isEraser ? tools.brushSize * 2.5 : tools.brushSize;
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
        brushSize: tools.isEraser ? tools.brushSize * 2.5 : tools.brushSize,
        isEraser: tools.isEraser,
        timestamp: Date.now(),
      };
      onStroke(stroke);
    }
    currentPoints.current = [];
  }, [isArtist, tools, onStroke]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Sketchpad Frame */}
      <div className="sketch-card" style={{ padding: 10, background: '#0B2418', position: 'relative' }}>
        {/* Top Binder Rings Accent */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 24px 8px', borderBottom: '1.5px dashed #1F6B46' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#FAF6EE',
                border: '2px solid #1F6B46',
              }}
            />
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            width: '100%',
            borderRadius: 10,
            background: '#0B2418',
            cursor: isArtist ? (tools.isEraser ? 'cell' : 'crosshair') : 'default',
            touchAction: 'none',
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

      {/* Artist Palette & Tools */}
      {isArtist && (
        <div className="sketch-card" style={toolbarStyle}>
          {/* Color Swatches */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {COLORS.map((c) => {
              const active = tools.color === c && !tools.isEraser;
              return (
                <button
                  key={c}
                  onClick={() => setTools(t => ({ ...t, color: c, isEraser: false }))}
                  aria-label={`Color ${c}`}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: c,
                    border: '2px solid #1F6B46',
                    boxShadow: active ? '2px 2px 0px #ECFDF5' : 'none',
                    transform: active ? 'translateY(-3px) scale(1.08)' : 'none',
                    transition: 'transform 0.1s ease',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </div>

          <div style={dividerStyle} />

          {/* Nib / Brush Size Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {BRUSH_SIZES.map((size) => {
              const active = tools.brushSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setTools(t => ({ ...t, brushSize: size }))}
                  title={`Brush size ${size}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: active ? '#22C55E' : '#0B2418',
                    border: '2px solid #1F6B46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: Math.min(size + 3, 18),
                      height: Math.min(size + 3, 18),
                      borderRadius: '50%',
                      background: tools.isEraser ? '#6EE7B7' : tools.color,
                      border: tools.color === '#0E2E1F' ? '1px solid #ECFDF5' : 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div style={dividerStyle} />

          {/* Tool Buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setTools(t => ({ ...t, isEraser: false }))}
              className="sketch-btn"
              style={toolBtnStyle(!tools.isEraser ? '#22C55E' : '#0B2418')}
              title="Pencil"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <span>Pen</span>
            </button>

            <button
              onClick={() => setTools(t => ({ ...t, isEraser: true }))}
              className="sketch-btn"
              style={toolBtnStyle(tools.isEraser ? '#10B981' : '#0B2418')}
              title="Eraser"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                <path d="M22 21H7" />
              </svg>
              <span>Eraser</span>
            </button>

            <button onClick={onUndo} className="sketch-btn" style={toolBtnStyle('#0B2418')} title="Undo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>

            <button onClick={onRedo} className="sketch-btn" style={toolBtnStyle('#0B2418')} title="Redo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>

            <button onClick={onClear} className="sketch-btn" style={toolBtnStyle('#FFE4E6')} title="Clear sheet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  background: '#0B2418',
};

const dividerStyle: React.CSSProperties = {
  width: 2,
  height: 26,
  background: '#1F6B46',
  borderRadius: 2,
};

const toolBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#ECFDF5',
  padding: '6px 10px',
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
});