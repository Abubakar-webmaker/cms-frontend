export default function PostPreview({ post, onClose }) {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[rgb(var(--surface))] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">Preview mode</p>
            <p className="text-xs app-muted">This is how the post will look before publishing</p>
          </div>
          <button onClick={onClose} className="app-btn-secondary rounded-full px-4 py-2 text-sm">
            Close
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="p-6 sm:p-8 lg:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs app-muted">
              <span className="app-chip text-sky-700 dark:text-sky-300">{post.categoryName || "General"}</span>
              <span>{post.status}</span>
              <span>•</span>
              <span>{post.readingTime || "1 min read"}</span>
            </div>
            <h1 className="max-w-4xl text-4xl leading-tight text-[rgb(var(--text))] sm:text-5xl">
              {post.title || "Untitled post"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 app-muted">
              {post.metaDescription || post.excerpt || "The post preview renders your live content, SEO fields, and image layout."}
            </p>

            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="mt-6 h-72 w-full rounded-[1.5rem] object-cover"
              />
            )}

            <div
              className="prose prose-slate mt-8 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.body || "<p>Your article preview will appear here.</p>" }}
            />

            {post.tags?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="app-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          <aside className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-6 lg:border-t-0 lg:border-l">
            <p className="text-sm font-semibold text-[rgb(var(--text))]">Preview data</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] app-muted">Slug</dt>
                <dd className="mt-1 break-all text-[rgb(var(--text))]">{post.slug || "(auto-generated)"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] app-muted">SEO title</dt>
                <dd className="mt-1 text-[rgb(var(--text))]">{post.metaTitle || post.title}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] app-muted">SEO description</dt>
                <dd className="mt-1 text-[rgb(var(--text))]">{post.metaDescription || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] app-muted">OG image</dt>
                <dd className="mt-1 text-[rgb(var(--text))]">{post.ogImage ? "Provided" : "Not set"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
