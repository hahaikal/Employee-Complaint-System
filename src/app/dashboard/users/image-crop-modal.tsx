"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, Move, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

const FRAME_SIZE = 260; // preview circle diameter in pixels
const EXPORT_SIZE = 160; // optimized avatar size (super lightweight, sharp on retina)

export function ImageCropModal({
  imageSrc,
  onCancel,
  onCropComplete,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  // Load natural dimensions of the image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Calculate base scale so image fits snugly over the crop circle without being over-zoomed
  const baseScale = naturalSize
    ? Math.max(FRAME_SIZE / naturalSize.width, FRAME_SIZE / naturalSize.height)
    : 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

  // Zoom via mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.6), 3));
  };

  // Export cropped image via Canvas with 100% WYSIWYG precision
  const handleApplyCrop = () => {
    if (!naturalSize) return;

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw circular clip path
    ctx.save();
    ctx.beginPath();
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill white background for transparent images
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    // Multiplier between preview container and export canvas
    const exportMultiplier = EXPORT_SIZE / FRAME_SIZE;

    // Dimensions rendered in preview
    const renderedWidth = naturalSize.width * baseScale * scale;
    const renderedHeight = naturalSize.height * baseScale * scale;

    // Top-left coordinates in export canvas matching preview position
    const destWidth = renderedWidth * exportMultiplier;
    const destHeight = renderedHeight * exportMultiplier;
    const destX = (FRAME_SIZE / 2 + position.x) * exportMultiplier - destWidth / 2;
    const destY = (FRAME_SIZE / 2 + position.y) * exportMultiplier - destHeight / 2;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(img, destX, destY, destWidth, destHeight);
      ctx.restore();

      const croppedUrl = canvas.toDataURL("image/jpeg", 0.8);
      onCropComplete(croppedUrl);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sesuaikan Foto Profil</h3>
            <p className="text-xs text-slate-500">Posisikan foto agar pas di dalam lingkaran profil.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop Viewport with Circular Mask */}
        <div
          className="relative my-4 flex items-center justify-center select-none"
          onWheel={handleWheel}
        >
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ width: `${FRAME_SIZE}px`, height: `${FRAME_SIZE}px` }}
            className="relative cursor-grab overflow-hidden rounded-full border-4 border-sidebar-brand bg-slate-100 shadow-lg active:cursor-grabbing"
          >
            {naturalSize && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Target crop"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${naturalSize.width * baseScale}px`,
                  height: `${naturalSize.height * baseScale}px`,
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                className="transition-transform duration-75"
              />
            )}

            {/* Subtle guide overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/40 ring-1 ring-inset ring-black/10" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-3">
          <Move className="h-3.5 w-3.5" />
          <span>Klik & geser untuk memindahkan posisi foto</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(2)), 0.6))}
            title="Perkecil"
            className="text-slate-500 hover:text-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min="0.6"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-sidebar-brand cursor-pointer"
          />
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(2)), 3))}
            title="Perbesar"
            className="text-slate-500 hover:text-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            title="Reset Posisi & Zoom"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors ml-1"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            className="rounded-full bg-sidebar-brand hover:bg-sidebar-brand-hover text-white font-semibold"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Terapkan Foto
          </Button>
        </div>
      </div>
    </div>
  );
}
