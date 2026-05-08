import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import CommentBox from "../components/CommentBox";
import Navbar from "../components/Navbar";

function readingTime(html = "") {
  const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function ShareButtons({ title, url }) {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const share = (href) => window.open(href, "_blank", "noopener,noreferrer,width=600,height=400");
  const copyLink = () => navigator.clipboard.writeText(url);
  const buttonClass = "app-btn-secondary px-3 py-2 text-xs";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => share(`https://twitter.com/intent/tweet?text=${text}&url=${encoded}`)} className={buttonClass}>
        Share
      </button>
      <button onClick={() => share(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`)} className={buttonClass}>
        LinkedIn
      </button>
      <button onClick={copyLink} className={buttonClass}>
        Copy
      </button>
    </div>
  );
}

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [headings, setHeadings] = useState([]);
  const [activeToc, setActiveToc] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/posts/${slug}`);
        setPost(data.post);

        if (data.post.category?._id) {
          const { data: rel } = await api.get("/posts", {
            params: { category: data.post.category._id, status: "published", limit: 4 },
          });
          setRelated(rel.posts.filter((p) => p._id !== data.post._id).slice(0, 3));
        }
      } catch {
        setError("Post not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  useEffect(() => {
    if (!post?.body || !bodyRef.current) return;
    const nodes = Array.from(bodyRef.current.querySelectorAll("h1,h2,h3"));
    const hs = nodes.map((el, i) => {
      const id = `heading-${i}`;
      el.id = id;
      return { id, text: el.textContent, tag: el.tagName };
    });
    setHeadings(hs);
    if (hs.length) setActiveToc(hs[0].id);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    document.title = post.metaTitle || post.title || "MeBlog";

    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const setProperty = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    if (post.metaDescription) setMeta("description", post.metaDescription);
    if (post.ogImage) setProperty("og:image", post.ogImage);
    setProperty("og:title", post.metaTitle || post.title || "");
    setMeta("robots", post.status === "published" ? "index,follow" : "noindex,nofollow");
  }, [post]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveToc(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (loading) {
    return (
      <div className="app-page">
        <Navbar />
        <div className="section-shell py-16 text-center text-sm app-muted">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app-page">
        <Navbar />
        <div className="section-shell py-16 text-center text-sm text-rose-600">{error || "Post not found."}</div>
      </div>
    );
  }

  const pageUrl = window.location.href;
  const estRead = readingTime(post.body);

  return (
    <div className="app-page">
      <Navbar />

      <main className="section-shell py-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="app-card overflow-hidden">
            <div className="p-4 sm:p-6">
              <p className="mb-4 text-xs app-muted">
                <Link to="/" className="no-underline hover:text-[rgb(var(--accent))]">Home</Link>
                <span> / </span>
                <span className="text-[rgb(var(--accent))]">{post.category?.name}</span>
              </p>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[rgb(var(--accent))] text-sm font-extrabold text-white">
                  {post.author?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[rgb(var(--text))]">{post.author?.name}</p>
                  <p className="text-xs app-muted">
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} | {estRead} | {post.views} views
                  </p>
                </div>
                <span className="app-chip text-[rgb(var(--accent))]">{post.category?.name}</span>
              </div>

              <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-[rgb(var(--text))] sm:text-4xl">
                {post.title}
              </h1>

              <div className="mt-5 border-t border-[rgb(var(--border))] pt-4">
                <ShareButtons title={post.title} url={pageUrl} />
              </div>
            </div>

            {post.coverImage && <img src={post.coverImage} alt={post.title} className="h-72 w-full border-y border-[rgb(var(--border))] object-cover sm:h-96" />}

            <div className="px-4 py-5 sm:px-6">
              <div
                ref={bodyRef}
                className="max-w-none text-base leading-8 text-[rgb(var(--text))] [&_a]:text-[rgb(var(--accent))] [&_blockquote]:border-l-4 [&_blockquote]:border-[rgb(var(--accent))] [&_blockquote]:bg-[rgb(var(--surface-2))] [&_blockquote]:p-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_img]:rounded-md [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />

              {post.tags?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link key={tag} to={`/?tag=${tag}`} className="app-chip no-underline hover:text-[rgb(var(--text))]">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-[rgb(var(--border))] pt-6">
                <CommentBox postId={post._id} />
              </div>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {headings.length > 0 && (
              <div className="app-card p-5">
                <p className="mb-3 text-sm font-extrabold text-[rgb(var(--text))]">On this post</p>
                <div className="space-y-1">
                  {headings.map(({ id, text, tag }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={`block rounded-md px-3 py-2 text-left text-sm no-underline transition-colors ${
                        activeToc === id
                          ? "bg-[rgb(var(--accent))] text-white"
                          : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]"
                      } ${tag === "H3" ? "pl-6 text-xs" : ""}`}
                    >
                      {text}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="app-card p-5">
                <p className="mb-3 text-sm font-extrabold text-[rgb(var(--text))]">Related posts</p>
                <div className="space-y-3">
                  {related.map((rp) => (
                    <Link
                      to={`/post/${rp.slug}`}
                      key={rp._id}
                      className="block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 no-underline transition-colors hover:bg-[rgb(var(--surface-2))]"
                    >
                      <p className="mb-1 text-[11px] font-bold uppercase text-[rgb(var(--accent))]">{rp.category?.name}</p>
                      <p className="text-sm leading-6 text-[rgb(var(--text))]">{rp.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
