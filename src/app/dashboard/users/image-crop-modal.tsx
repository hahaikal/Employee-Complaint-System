"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

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
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const cropSize = 300;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw circular cropped image
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill white background in case of transparent PNG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cropSize, cropSize);

    // Calculate image render dimensions
    const previewSize = 256; // size of the preview circle
    const ratio = cropSize / previewSize;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const baseScale = Math.max(previewSize / imgWidth, previewSize / imgHeight);
    const finalScale = baseScale * scale * ratio;

    const drawWidth = imgWidth * finalScale;
    const drawHeight = imgHeight * finalScale;
    const drawX = cropSize / 2 + position.x * ratio - drawWidth / 2;
    const drawY = cropSize / 2 + position.y * ratio - drawHeight / 2;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    const croppedUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Sesuaikan Foto Profil</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Geser dan atur perbesaran foto agar pas dengan bingkai bulat profil.
        </p>

        {/* Crop Viewport */}
        <div className="relative my-5 flex items-center justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            className="relative h-64 w-64 cursor-grab overflow-hidden rounded-full border-4 border-sidebar-brand bg-slate-100 shadow-inner active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                maxWidth: "none",
                maxHeight: "none",
                userSelect: "none",
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3 px-2 py-1">
          <ZoomOut className="h-4 w-4 text-slate-400" />
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-sidebar-brand"
          />
          <ZoomIn className="h-4 w-4 text-slate-400" />
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            title="Reset Posisi"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
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
