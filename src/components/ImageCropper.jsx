import { useEffect, useMemo, useRef, useState } from "react";

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ImageCropper({ file, aspectRatio = 16 / 9, onCancel, onSave }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let mounted = true;
    if (!file) return undefined;
    fileToImage(file).then((img) => {
      if (mounted) setImage(img);
    });
    return () => {
      mounted = false;
    };
  }, [file]);

  const canvasSize = useMemo(() => {
    const width = 1600;
    const height = Math.round(width / aspectRatio);
    return { width, height };
  }, [aspectRatio]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }, [image, zoom, canvasSize]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onSave(blob);
    }, "image/jpeg", 0.92);
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Crop featured image</p>
            <p className="text-xs text-slate-500">Center-crop with zoom control before upload</p>
          </div>
          <button onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Cancel
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
              <canvas ref={canvasRef} className="block h-auto w-full" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Zoom</span>
              <input
                type="range"
                min="1"
                max="2.4"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">Output</p>
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-slate-900">
              {image ? (
                <img src={image.src} alt="" className="h-full w-full object-cover opacity-90" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading image...</div>
              )}
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              This produces a clean 16:9 crop suitable for featured images and social previews.
            </p>
            <button
              onClick={handleSave}
              className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              Use cropped image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
