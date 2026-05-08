import { Link } from "react-router-dom";

const categoryStyle = {
  Technology: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  Design: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/20",
  Career: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  Tutorials: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
};

const avatarStyle = [
  "bg-[rgb(var(--accent))] text-white",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
];

function readingTime(text = "") {
  const words = text.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export default function PostCard({ post, index = 0, featured = false }) {
  const { slug, title, excerpt, body, category, author, createdAt, views, status, coverImage, tags = [] } = post;

  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const authorName = typeof author === "object" ? author?.name : author;
  const initials = authorName?.slice(0, 2).toUpperCase();
  const catName = typeof category === "object" ? category?.name : category;
  const estRead = readingTime(body || excerpt || "");

  return (
    <article className="app-card overflow-hidden transition-colors hover:border-[rgb(var(--accent))]/50">
      <Link to={`/post/${slug}`} className="block no-underline">
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-extrabold ${avatarStyle[index % avatarStyle.length]}`}>
              {initials || "AU"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[rgb(var(--text))]">{authorName || "Editorial Team"}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs app-muted">
                <span>{displayDate}</span>
                <span>|</span>
                <span>{estRead}</span>
                {status === "draft" && <span className="app-chip py-0.5">Draft</span>}
              </div>
            </div>
            <span className={`hidden rounded-md border px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${categoryStyle[catName] || "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-700"}`}>
              {catName || "General"}
            </span>
          </div>

          <h2 className={`${featured ? "text-2xl sm:text-3xl" : "text-xl"} mb-2 font-extrabold leading-tight text-[rgb(var(--text))]`}>
            {title}
          </h2>

          <p className="line-clamp-3 text-sm leading-6 app-muted">
            {excerpt}
          </p>
        </div>

        {coverImage && (
          <div className="border-y border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
            <img
              src={coverImage}
              alt={title}
              className={`${featured ? "h-80" : "h-64"} w-full object-cover`}
            />
          </div>
        )}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-xs app-muted">
          <span>{views || 0} views</span>
          {tags.slice(0, 2).map((tag) => (
            <Link key={tag} to={`/?tag=${tag}`} className="app-chip py-0.5 no-underline">
              #{tag}
            </Link>
          ))}
        </div>
        <Link to={`/post/${slug}`} className="app-btn-secondary px-3 py-1.5 text-xs no-underline">
          Open
        </Link>
      </div>
    </article>
  );
}
