export default function PostVersionsModal({ versions = [], onApply, onClose }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Version history</p>
            <p className="text-xs text-slate-500">Restore a previous title/body snapshot</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {versions.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No previous versions were saved yet.</p>
          ) : (
            <div className="space-y-3">
              {versions.slice().reverse().map((version, index) => (
                <div key={`${version.updatedAt}-${index}`} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{version.title || "Untitled version"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {version.updatedAt ? new Date(version.updatedAt).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                    <button
                      onClick={() => onApply(version)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      Use this version
                    </button>
                  </div>
                  <div className="mt-3 max-h-40 overflow-hidden rounded-2xl bg-slate-50 p-3 text-sm leading-7 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {version.body ? (
                      <div dangerouslySetInnerHTML={{ __html: version.body }} />
                    ) : (
                      <p>No body content stored.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
