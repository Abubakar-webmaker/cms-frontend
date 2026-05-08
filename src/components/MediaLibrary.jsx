// src/components/MediaLibrary.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export default function MediaLibrary({ onSelect, onClose }) {
  const [images, setImages]         = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [selected, setSelected]     = useState(null);

  const fetchImages = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const params = cursor ? { next_cursor: cursor } : {};
      const { data } = await api.get("/media/library", { params });
      setImages((prev) => cursor ? [...prev, ...data.images] : data.images);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("[MEDIA LIBRARY ERROR]", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial media load is intentionally side-effectful.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchImages();
    } catch (err) {
      console.error("[UPLOAD ERROR]", err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (publicId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await api.delete(`/media/${encodeURIComponent(publicId)}`);
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
      if (selected?.publicId === publicId) setSelected(null);
    } catch (err) {
      console.error("[DELETE ERROR]", err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Media Library</p>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              {uploading ? "Uploading..." : "+ Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
              Close
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && images.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading...</p>
          ) : images.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No images yet. Upload one!</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {images.map((img) => (
                  <div
                    key={img.publicId}
                    onClick={() => setSelected(img)}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                      selected?.publicId === img.publicId
                        ? "border-slate-950 dark:border-white"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(img.publicId); }}
                      className="absolute right-1 top-1 hidden rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white group-hover:block"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {nextCursor && (
                <button
                  onClick={() => fetchImages(nextCursor)}
                  disabled={loading}
                  className="mx-auto mt-4 block rounded-full border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-700">
            <p className="truncate text-xs text-slate-500">{selected.url}</p>
            <button
              onClick={() => { onSelect(selected.url); onClose(); }}
              className="ml-3 shrink-0 rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              Use image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
